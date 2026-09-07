const { app, BrowserWindow, ipcMain, screen, desktopCapturer } = require("electron");
const path = require("path");

const isDev = !app.isPackaged;

let mainWindow = null;
let visualizerWindow = null;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    resizable: true,
    center: true,
    title: "Noterender",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:8080");
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
    if (visualizerWindow) {
      visualizerWindow.close();
      visualizerWindow = null;
    }
  });
}

app.whenReady().then(createMainWindow);

app.on("window-all-closed", () => {
  app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

// --- IPC Handlers ---

ipcMain.handle("get-monitors", () => {
  const displays = screen.getAllDisplays();
  return displays.map((d, i) => ({
    id: d.id,
    name: d.label || `Monitor ${i + 1}`,
    isPrimary: d.id === screen.getPrimaryDisplay().id,
    width: d.size.width,
    height: d.size.height,
    x: d.bounds.x,
    y: d.bounds.y,
  }));
});

ipcMain.handle("spawn-visualizer", (event, { monitorId, templateName, config }) => {
  if (visualizerWindow && !visualizerWindow.isDestroyed()) {
    visualizerWindow.focus();
    visualizerWindow.webContents.send("visualizer-update", { templateName, config });
    return;
  }

  const displays = screen.getAllDisplays();
  const target = displays.find((d) => d.id === monitorId) || screen.getPrimaryDisplay();

  visualizerWindow = new BrowserWindow({
    x: target.bounds.x,
    y: target.bounds.y,
    width: target.size.width,
    height: target.size.height,
    fullscreen: true,
    frame: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    visualizerWindow.loadURL("http://localhost:8080/#/visualizer");
  } else {
    visualizerWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"), {
      hash: "/visualizer",
    });
  }

  visualizerWindow.webContents.on("did-finish-load", () => {
    visualizerWindow.webContents.send("visualizer-update", { templateName, config });
  });

  visualizerWindow.on("closed", () => {
    visualizerWindow = null;
  });
});

ipcMain.handle("close-visualizer", () => {
  if (visualizerWindow && !visualizerWindow.isDestroyed()) {
    visualizerWindow.close();
    visualizerWindow = null;
  }
});

ipcMain.handle("is-visualizer-open", () => {
  return visualizerWindow !== null && !visualizerWindow.isDestroyed();
});

ipcMain.handle("toggle-visualizer-fullscreen", () => {
  if (visualizerWindow && !visualizerWindow.isDestroyed()) {
    visualizerWindow.setFullScreen(!visualizerWindow.isFullScreen());
  }
});

ipcMain.handle("get-system-audio-sources", async () => {
  const sources = await desktopCapturer.getSources({
    types: ["screen", "window"],
    thumbnailSize: { width: 0, height: 0 },
  });
  return sources.map((s) => ({
    id: s.id,
    name: s.name,
    thumbnailDataURL: s.thumbnail.toDataURL(),
  }));
});
