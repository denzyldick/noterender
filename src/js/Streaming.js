"use strict";

const DEFAULT_RELAY = "ws://localhost:8090";

class Streaming {
  constructor() {
    this.recorder = null;
    this.combined = null;
    this.ws = null;
    this.active = false;
    this.format = "mpegts";
    this.onStatus = null;
  }

  setStatus(state, message) {
    if (this.onStatus) this.onStatus(state, message);
  }

  buildTracks(videoStream, audioStream) {
    const tracks = [];
    if (videoStream && videoStream.getTracks) tracks.push(...videoStream.getTracks());
    if (audioStream && audioStream.getTracks) tracks.push(...audioStream.getTracks());
    if (tracks.length === 0) throw new Error("No tracks to stream");
    return new MediaStream(tracks);
  }

  pickMimeType() {
    const candidates = [
      { mimeType: "video/mp2t", format: "mpegts" },
      { mimeType: "video/webm;codecs=h264", format: "webm" },
      { mimeType: "video/webm", format: "webm" }
    ];
    for (const c of candidates) {
      if (MediaRecorder.isTypeSupported(c.mimeType)) return c;
    }
    return { mimeType: "", format: "webm" };
  }

  async start(videoStream, audioStream, options = {}) {
    if (this.active) return;
    const relayUrl = options.relayUrl || DEFAULT_RELAY;
    const bitrate = options.bitrate || 2500000;
    this.onStatus = options.onStatus || null;

    this.combined = this.buildTracks(videoStream, audioStream);

    const mime = this.pickMimeType();
    this.format = mime.format;

    const recorderOptions = {};
    if (mime.mimeType) recorderOptions.mimeType = mime.mimeType;
    recorderOptions.videoBitsPerSecond = bitrate;
    recorderOptions.audioBitsPerSecond = 128000;

    this.setStatus("connecting", "Connecting to relay…");

    await new Promise((resolve, reject) => {
      this.ws = new WebSocket(relayUrl);
      this.ws.binaryType = "arraybuffer";
      this.ws.onopen = () => resolve();
      this.ws.onerror = (e) => {
        this.setStatus("error", "Cannot reach relay server. Is it running?");
        reject(new Error("relay connection failed"));
      };
    });

    this.ws.send(JSON.stringify({
      type: "connect",
      rtmpUrl: options.rtmpUrl,
      format: this.format,
      bitrate,
    }));

    this.ws.onmessage = (event) => {
      const msg = event.data;
      if (typeof msg === "string") {
        try {
          const data = JSON.parse(msg);
          if (data.error) {
            this.setStatus("error", data.error);
          } else if (data.live) {
            this.setStatus("live", "LIVE on TikTok");
          } else if (data.status) {
            this.setStatus("connecting", data.status);
          }
        } catch (_) {
          /* ignore non-JSON status frames */
        }
      }
    };
    this.ws.onclose = () => {
      if (this.active) this.setStatus("error", "Relay disconnected");
    };

    this.streamState = { firstChunk: true };
    this.recorder = new MediaRecorder(this.combined, recorderOptions);
    this.recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0 && this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(event.data);
      }
    };
    this.recorder.onstop = () => this.disconnect();
    this.recorder.start(500);
    this.active = true;
    this.setStatus("connecting", "Streaming to relay…");
  }

  async stop() {
    this.active = false;
    if (this.recorder && this.recorder.state !== "inactive") {
      this.recorder.stop();
    } else {
      this.disconnect();
    }
  }

  disconnect() {
    if (this.ws) {
      try {
        if (this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: "stop" }));
        }
      } catch (_) {}
      this.ws.close();
    }
    this.ws = null;
    if (this.combined) {
      this.combined.getTracks().forEach((t) => t.stop());
      this.combined = null;
    }
    this.recorder = null;
  }

  get isActive() {
    return this.active;
  }
}

export default new Streaming();