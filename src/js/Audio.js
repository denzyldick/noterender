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
  }

  nodes() {
    if (this.initialized === false) {
      this.context = new AudioContext();
      const elementsByTagNameElement =
        document.getElementsByTagName("audio")[0];
      this.audioElement = elementsByTagNameElement;
      console.log(typeof this.mediaSource);
      console.log(this.mediaSource);
      if (typeof this.mediaSource === "undefined") {
        this.mediaSource = this.context.createMediaElementSource(
          elementsByTagNameElement
        );
      }
      //Create analyzer node
      this.analyzer = this.context.createAnalyser();
      this.analyzer.fftSize = this.fftSize;
      const bufferLength = this.analyzer.frequencyBinCount;
      this.fft = new Uint8Array(bufferLength);
      //Set up audio node network
      this.mediaSource.connect(this.analyzer);
      this.analyzer.connect(this.context.destination);
      this.initialized = true;
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
    return this.audioElement.captureStream();
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
