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
      // Do not connect to destination to avoid feedback
      this.initialized = true;
      this.context.resume();
    } catch (e) {
      console.error("Microphone access denied", e);
    }
  }

  async useSystemAudio() {
    if (window.__TAURI__) {
      const { invoke } = window.__TAURI__.core;
      const { listen } = window.__TAURI__.event;
      this.fft = new Uint8Array(256);
      this.tauriNative = true;

      await invoke("start_system_audio_capture");

      this._unlisten = await listen("audio-fft", (event) => {
        const floatData = event.payload;
        for (let i = 0; i < 256 && i < floatData.length; i++) {
          this.fft[i] = Math.round(floatData[i] * 255);
        }
      });

      this.initialized = true;
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.context = new AudioContextClass();
    this.analyzer = this.context.createAnalyser();
    this.analyzer.fftSize = this.fftSize;
    this.analyzer.smoothingTimeConstant = this.smoothingTimeConstant;
    const bufferLength = this.analyzer.frequencyBinCount;
    this.fft = new Uint8Array(bufferLength);

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

  /**
   * Start capturing PCM samples from Tauri system audio for recording.
   * Returns a MediaStream that can be passed to MediaRecorder.
   */
  async startRecordingCapture() {
    if (!window.__TAURI__ || !this.tauriNative) return null;

    const { invoke } = window.__TAURI__.core;
    const { listen } = window.__TAURI__.event;

    const ctx = new (window.AudioContext || window.webkitAudioContext)({
      sampleRate: 44100,
    });

    const dest = ctx.createMediaStreamDestination();

    const workletCode = `
      class PCMProcessor extends AudioWorkletProcessor {
        constructor() {
          super();
          this.buffer = new Float32Array(16384);
          this.writePos = 0;
          this.readPos = 0;
          this.buffered = 0;
          this.port.onmessage = (e) => {
            const data = e.data;
            for (let i = 0; i < data.length; i++) {
              this.buffer[(this.writePos + i) & 16383] = data[i];
            }
            this.writePos = (this.writePos + data.length) & 16383;
            this.buffered += data.length;
          };
        }

        process(inputs, outputs) {
          const output = outputs[0][0];
          if (this.buffered < output.length) {
            return true;
          }
          for (let i = 0; i < output.length; i++) {
            output[i] = this.buffer[(this.readPos + i) & 16383];
          }
          this.readPos = (this.readPos + output.length) & 16383;
          this.buffered -= output.length;

          for (let ch = 1; ch < outputs[0].length; ch++) {
            outputs[0][ch].set(output);
          }
          return true;
        }
      }
      registerProcessor('pcm-processor', PCMProcessor);
    `;

    const blob = new Blob([workletCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    await ctx.audioWorklet.addModule(url);
    URL.revokeObjectURL(url);

    const worklet = new AudioWorkletNode(ctx, 'pcm-processor');
    worklet.connect(dest);

    this._recordingCtx = ctx;
    this._recordingDest = dest;
    this._recordingWorklet = worklet;

    await invoke("set_recording_active", { active: true });

    this._recordingUnlisten = await listen('audio-pcm', (event) => {
      const samples = event.payload;
      worklet.port.postMessage(new Float32Array(samples));
    });

    return dest.stream;
  }

  async stopRecordingCapture() {
    if (window.__TAURI__ && window.__TAURI__.core) {
      const { invoke } = window.__TAURI__.core;
      await invoke("set_recording_active", { active: false });
    }
    if (this._recordingUnlisten) {
      this._recordingUnlisten();
      this._recordingUnlisten = null;
    }
    if (this._recordingWorklet) {
      this._recordingWorklet.disconnect();
      this._recordingWorklet = null;
    }
    if (this._recordingCtx) {
      await this._recordingCtx.close();
      this._recordingCtx = null;
    }
    this._recordingDest = null;
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
    if (this.tauriNative && window.__TAURI__) {
      await this.stopRecordingCapture();
      const { invoke } = window.__TAURI__.core;
      await invoke("stop_system_audio_capture");
      if (this._unlisten) {
        this._unlisten();
        this._unlisten = null;
      }
      this.tauriNative = false;
      this.initialized = false;
      return new Promise(resolver || (() => {}));
    }
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
   * @returns {Promise<void>}
   */
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

  /**
   * Get the audio stream for recording.
   * @returns {MediaStream|null}
   */
  getStream() {
    if (this.tauriNative) {
      if (this._recordingDest) {
        return this._recordingDest.stream;
      }
      return null;
    }
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

  /**
   *
   * @returns {null}
   */
  getFtt() {
    if (this.tauriNative) {
      return this.fft;
    }
    this.getFrequency();
    return this.fft;
  }
}

export default Audio;
