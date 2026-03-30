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
      this.context = new AudioContext();
      const elementsByTagNameElement =
        document.getElementsByTagName("audio")[0];
      this.audioElement = elementsByTagNameElement;

      if (typeof this.mediaSource === "undefined") {
        this.mediaSource = this.context.createMediaElementSource(
          elementsByTagNameElement,
        );
      }
      //Create analyzer node
      this.analyzer = this.context.createAnalyser();
      this.analyzer.fftSize = this.fftSize;
      this.analyzer.smoothingTimeConstant = this.smoothingTimeConstant;
      const bufferLength = this.analyzer.frequencyBinCount;
      this.fft = new Uint8Array(bufferLength);
      //Set up audio node network
      this.mediaSource.connect(this.analyzer);
      this.analyzer.connect(this.context.destination);
      this.initialized = true;
    }
    if (this.context && this.context.state === "suspended") {
      this.context.resume();
    }
  }

  async useMicrophone() {
    this.context = new AudioContext();
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
      // Do not connect to destination to avoid feedback
      this.initialized = true;
      this.context.resume();
    } catch (e) {
      console.error("Microphone access denied", e);
    }
  }

  getFrequency() {
    if (this.analyzer !== null) {
      return this.analyzer.getByteFrequencyData(this.fft);
    }
  }

  /**
   *
   * @param resolver
   * @returns {Promise<unknown>}
   */
  onPause(resolver) {
    return new Promise(resolver);
  }

  /**
   * Stop the sound.
   * @param resolver
   * @returns {Promise<unknown>}
   */
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

  /**
   * Start playing the sound.
   * @param resolver
   * @returns {Promise<unknown>}
   */
  play(resolver) {
    this.audioElement.play();
    this.audioElement.currentTime = 0;
    this.nodes();
    return new Promise(resolver);
  }

  /**
   * Get the audio stream.
   * @returns {MediaStream}
   */
  getStream() {
    if (this.stream) {
      return this.stream;
    }
    return this.audioElement.captureStream ? this.audioElement.captureStream() : this.audioElement.mozCaptureStream();
  }

  /**
   *
   * @returns {null}
   */
  getFtt() {
    this.getFrequency();
    return this.fft;
  }
}

export default Audio;
