const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  getMonitors: () => ipcRenderer.invoke("get-monitors"),
  spawnVisualizer: (opts) => ipcRenderer.invoke("spawn-visualizer", opts),
  closeVisualizer: () => ipcRenderer.invoke("close-visualizer"),
  isVisualizerOpen: () => ipcRenderer.invoke("is-visualizer-open"),
  toggleVisualizerFullscreen: () =>
    ipcRenderer.invoke("toggle-visualizer-fullscreen"),
  getSystemAudioSources: () => ipcRenderer.invoke("get-system-audio-sources"),

  onVisualizerUpdate: (callback) => {
    ipcRenderer.on("visualizer-update", (event, data) => callback(data));
  },
});
