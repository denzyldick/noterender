"use strict";
let mediaRecorder;
let recordedBlobs;

function handleDataAvailable(event) {
  if (event.data && event.data.size > 0) {
    recordedBlobs.push(event.data);
  }
}

const recording = {
  stop: function () {
    if (typeof mediaRecorder !== "undefined") {
      mediaRecorder.stop();
    }
  },
  record: async function (videoStream, audioStream, bitrate) {
    recordedBlobs = [];
    const supportedTypes = [
      { mimeType: "video/mp4", extension: "mp4" },
      { mimeType: "video/webm;codecs=h264", extension: "webm" },
      { mimeType: "video/webm", extension: "webm" }
    ];

    let chosenMime = "";
    let chosenExt = "webm";
    for (const type of supportedTypes) {
      if (MediaRecorder.isTypeSupported(type.mimeType)) {
        chosenMime = type.mimeType;
        chosenExt = type.extension;
        break;
      }
    }

    let options = {};
    if (chosenMime) options.mimeType = chosenMime;

    if (bitrate) {
      options.videoBitsPerSecond = bitrate;
      options.audioBitsPerSecond = 128000;
    }

    try {
      const combined = new MediaStream([
        ...videoStream.getTracks(),
        ...audioStream.getTracks(),
      ]);
      mediaRecorder = new MediaRecorder(combined, options);
    } catch (e) {
      console.error("Exception while creating MediaRecorder:", e);
      const combined = new MediaStream([
        ...videoStream.getTracks(),
        ...audioStream.getTracks(),
      ]);
      mediaRecorder = new MediaRecorder(combined);
    }

    this.options = {
      mimeType: (mediaRecorder.mimeType || chosenMime).split(';')[0] || "video/webm",
      extension: chosenExt
    };

    console.log(
      "Created MediaRecorder",
      mediaRecorder,
      "with options",
      this.options,
    );
    mediaRecorder.onstop = (event) => {
      console.log("Recorder stopped: ", event);
      console.log("Recorded Blobs: ", recordedBlobs);
      this.download();
    };

    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.start();
    console.error("MediaRecorder started! (Buffered natively structure)");
  },
  start: async function (videoStream, audioStream, bitrate) {
    this.record(videoStream, audioStream, bitrate);
  },
  download: function () {
    const blob = new Blob(recordedBlobs, {
      type: this.options.mimeType || "video/webm",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = `noterender.denzyl.io.${this.options.extension || "webm"}`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  },
};

export default recording;
