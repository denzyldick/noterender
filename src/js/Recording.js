"use strict";
let mediaRecorder;
let recordedBlobs;

function handleDataAvailable(event) {
  console.log("handleDataAvailable", event);
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
  record: async function (videoStream, audioStream) {
    recordedBlobs = [];
    let options = { mimeType: "video/webm;codecs=vp9,opus" };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      console.error(`${options.mimeType} is not supported`);
      options = { mimeType: "video/webm;codecs=vp8,opus" };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.error(`${options.mimeType} is not supported`);
        options = { mimeType: "video/webm" };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          console.error(`${options.mimeType} is not supported`);
          options = { mimeType: "" };
        }
      }
    }

    try {
      const combined = new MediaStream([
        ...videoStream.getTracks(),
        ...audioStream.getTracks(),
      ]);
      // let recorder = new MediaRecorder(combined);
      mediaRecorder = new MediaRecorder(combined, options);
    } catch (e) {
      console.error("Exception while creating MediaRecorder:", e);
      return;
    }

    console.log(
      "Created MediaRecorder",
      mediaRecorder,
      "with options",
      options
    );
    mediaRecorder.onstop = (event) => {
      console.log("Recorder stopped: ", event);
      console.log("Recorded Blobs: ", recordedBlobs);
      this.download();
    };

    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.start();
    console.log("MediaRecorder started", mediaRecorder);
  },
  start: async function (videoStream, audioStream) {
    this.record(videoStream, audioStream);
  },
  download: function () {
    const blob = new Blob(recordedBlobs, { type: "video/webm" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = "wave.denzyl.io.webm";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  },
};

export default recording;
