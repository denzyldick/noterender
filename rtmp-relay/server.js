#!/usr/bin/env node
"use strict";

/*
 * Noterender RTMP Relay
 *
 * Receives live video chunks from the browser over WebSocket and pushes
 * them to a destination RTMP endpoint (e.g. TikTok Live) using ffmpeg.
 *
 *   Browser ──WS (video/mp2t, 500ms chunks)──► relay ──pipe:0──► ffmpeg ──RTMP──► TikTok Live
 *
 * Requires ffmpeg on PATH.
 */

const { WebSocketServer } = require("ws");
const { spawn } = require("child_process");

const HOST = process.env.RELAY_HOST || "127.0.0.1";
const PORT = parseInt(process.env.RELAY_PORT || "8090", 10);

function rtmpAudioArgs(format) {
  // MPEG-TS from Chrome contains AAC; copy it. WebM fallback contains Opus — re-encode to AAC.
  return format === "mpegts"
    ? ["-c:a", "copy"]
    : ["-c:a", "aac", "-b:a", "128k", "-ar", "44100", "-ac", "2"];
}

function spawnFfmpeg(rtmpUrl, format, logSink) {
  const args = [
    "-fflags", "+nobuffer",
    "-flags", "low_delay",
    "-f", format === "mpegts" ? "mpegts" : "webm",
    "-i", "pipe:0",
    "-c:v", "copy",
    ...rtmpAudioArgs(format),
    "-f", "flv",
    "-flvflags", "no_duration_filesize",
    rtmpUrl,
  ];

  if (logSink) logSink(`ffmpeg start: ${args.join(" ")}`);

  const proc = spawn("ffmpeg", args, { stdio: ["pipe", "inherit", "inherit"] });
  proc.on("error", (err) => {
    if (logSink) logSink(`ffmpeg spawn error: ${err.message}`);
  });
  return proc;
}

const wss = new WebSocketServer({ host: HOST, port: PORT });

wss.on("listening", () => {
  console.log(`[relay] listening on ws://${HOST}:${PORT} — requires ffmpeg on PATH`);
});

wss.on("connection", (ws) => {
  let ffmpeg = null;
  let rtmpUrl = null;
  let format = "mpegts";
  let draining = false;
  let liveConfirmed = false;

  const log = (msg) => console.log(`[relay] ${msg}`);

  const cleanupFfmpeg = () => {
    if (ffmpeg) {
      try {
        ffmpeg.stdin.end();
      } catch (_) {}
      try {
        ffmpeg.kill("SIGKILL");
      } catch (_) {}
      ffmpeg = null;
    }
  };

  ws.on("message", (data, isBinary) => {
    if (isBinary) {
      if (!ffmpeg) return;
      if (ffmpeg.stdin.writable) {
        if (!liveConfirmed) {
          liveConfirmed = true;
          ws.send(JSON.stringify({ live: true, status: "LIVE on TikTok" }));
        }
        ffmpeg.stdin.write(Buffer.from(data));
      }
      return;
    }

    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch (_) {
      return;
    }

    if (msg.type === "connect") {
      if (!msg.rtmpUrl) {
        ws.send(JSON.stringify({ error: "rtmpUrl required" }));
        return;
      }
      rtmpUrl = msg.rtmpUrl;
      format = msg.format === "webm" ? "webm" : "mpegts";
      log(`connect → ${rtmpUrl} (${format})`);
      startFfmpeg();
      ws.send(JSON.stringify({ live: false, status: "Relay connected — starting stream" }));
    } else if (msg.type === "stop") {
      log("stop received");
      cleanupFfmpeg();
      ws.send(JSON.stringify({ status: "stopped" }));
    }
  });

  function startFfmpeg() {
    if (!rtmpUrl || draining) return;
    liveConfirmed = false;
    ffmpeg = spawnFfmpeg(rtmpUrl, format, log);
    ffmpeg.on("error", (err) => log(`ffmpeg error: ${err.message}`));
    ffmpeg.on("exit", (code, signal) => {
      log(`ffmpeg exited (code=${code}, signal=${signal})`);
      ffmpeg = null;
      if (ws.readyState === ws.OPEN && !draining) {
        ws.send(JSON.stringify({ error: "ffmpeg exited — check RTMP URL / stream key" }));
      }
    });
  }

  ws.on("close", () => {
    log("client disconnected");
    draining = true;
    cleanupFfmpeg();
  });
  ws.on("error", () => {
    draining = true;
    cleanupFfmpeg();
  });
});

process.on("SIGINT", () => {
  console.log("\n[relay] shutting down");
  wss.close(() => process.exit(0));
});