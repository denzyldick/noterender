class Audio {
  /**
   *
   * @param fftSize The size of the fft.
   */
  constructor(fftSize) {
    this.fft = null;
    this.fftSize = fftSize;
    this.initialized = false;
    this.analyzer = null;
    this.smoothingTimeConstant = 0.8;
  }

  setSmoothing(val) {
    this.smoothingTimeConstant = val;
    if (this.analyzer) {
      this.analyzer.smoothingTimeConstant = val;
    }
  }

  nodes() {
    if (this.initialized === false) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.context = new AudioContextClass();
      const elementsByTagNameElement =
        document.getElementsByTagName("audio")[0];
      this.audioElement = elementsByTagNameElement;

      if (typeof this.mediaSource === "undefined") {
        this.mediaSource = this.context.createMediaElementSource(
          elementsByTagNameElement,
        );
      }
      this.analyzer = this.context.createAnalyser();
      this.analyzer.fftSize = this.fftSize;
      this.analyzer.smoothingTimeConstant = this.smoothingTimeConstant;
      const bufferLength = this.analyzer.frequencyBinCount;
      this.fft = new Uint8Array(bufferLength);
      this.mediaSource.connect(this.analyzer);
      this.analyzer.connect(this.context.destination);
      this.initialized = true;
    }
    if (this.context && this.context.state === "suspended") {
      this.context.resume();
    }
  }

  async useMicrophone() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.context = new AudioContextClass();
    this.analyzer = this.context.createAnalyser();
    this.analyzer.fftSize = this.fftSize;
    this.analyzer.smoothingTimeConstant = this.smoothingTimeConstant;
    const bufferLength = this.analyzer.frequencyBinCount;
    this.fft = new Uint8Array(bufferLength);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.stream = stream;
      this.mediaSource = this.context.createMediaStreamSource(stream);
      this.mediaSource.connect(this.analyzer);
      this.initialized = true;
      this.context.resume();
    } catch (e) {
      console.error("Microphone access denied", e);
    }
  }

  async useSystemAudio() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.context = new AudioContextClass();
    this.analyzer = this.context.createAnalyser();
    this.analyzer.fftSize = this.fftSize;
    this.analyzer.smoothingTimeConstant = this.smoothingTimeConstant;
    const bufferLength = this.analyzer.frequencyBinCount;
    this.fft = new Uint8Array(bufferLength);

    if (window.electronAPI) {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          mandatory: {
            chromeMediaSource: "desktop",
          },
        },
      });
      this.stream = stream;
      this.mediaSource = this.context.createMediaStreamSource(stream);
      this.mediaSource.connect(this.analyzer);
      this.initialized = true;
      this.context.resume();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      this.stream = stream;

      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error("No system audio track found. Make sure to check 'Share audio'.");
      }

      this.mediaSource = this.context.createMediaStreamSource(stream);
      this.mediaSource.connect(this.analyzer);
      this.initialized = true;
      this.context.resume();
    } catch (e) {
      console.error("System audio access denied", e);
      throw e;
    }
  }

  async useDevice(deviceId) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.context = new AudioContextClass();
    this.analyzer = this.context.createAnalyser();
    this.analyzer.fftSize = this.fftSize;
    this.analyzer.smoothingTimeConstant = this.smoothingTimeConstant;
    const bufferLength = this.analyzer.frequencyBinCount;
    this.fft = new Uint8Array(bufferLength);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } },
      });
      this.stream = stream;
      this.mediaSource = this.context.createMediaStreamSource(stream);
      this.mediaSource.connect(this.analyzer);
      this.initialized = true;
      this.context.resume();
    } catch (e) {
      console.error("Device audio access denied", e);
      throw e;
    }
  }

  static async getAudioDevices() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(d => d.kind === 'audioinput');
  }

  getFrequency() {
    if (this.analyzer !== null) {
      return this.analyzer.getByteFrequencyData(this.fft);
    }
  }

  onPause(resolver) {
    return new Promise(resolver);
  }

  async stop(resolver) {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (typeof this.audioElement !== "undefined") {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
    return new Promise(resolver);
  }

  async play() {
    if (!this.audioElement) return;
    try {
      this.nodes();
      this.audioElement.currentTime = 0;
      return await this.audioElement.play();
    } catch (e) {
      console.warn("Autoplay prevented:", e.message);
      throw e;
    }
  }

  getStream() {
    if (this.stream) {
      return this.stream;
    }
    if (!this.audioElement) return null;
    if (this.audioElement.captureStream) {
      return this.audioElement.captureStream();
    } else if (this.audioElement.mozCaptureStream) {
      return this.audioElement.mozCaptureStream();
    } else if (this.audioElement.webkitCaptureStream) {
      return this.audioElement.webkitCaptureStream();
    }
    return null;
  }

  getFtt() {
    this.getFrequency();
    return this.fft;
  }
}

export default Audio;
