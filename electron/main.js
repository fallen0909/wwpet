import { app, BrowserWindow, Menu, ipcMain, screen } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const useDevServer = process.env.DESKTOP_PET_DEV === "1";

let mainWindow;
let dragState = null;

const config = {
  width: 340,
  height: 380,
  alwaysOnTop: true,
  startMargin: 28
};

function getRendererUrl() {
  if (useDevServer) {
    return "http://127.0.0.1:5173";
  }
  return `file://${path.join(__dirname, "../dist/index.html")}`;
}

function createWindow() {
  const display = screen.getPrimaryDisplay();
  const workArea = display.workArea;

  mainWindow = new BrowserWindow({
    width: config.width,
    height: config.height,
    x: workArea.x + workArea.width - config.width - config.startMargin,
    y: workArea.y + workArea.height - config.height - config.startMargin,
    frame: false,
    transparent: true,
    resizable: false,
    hasShadow: false,
    skipTaskbar: false,
    alwaysOnTop: config.alwaysOnTop,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.setAlwaysOnTop(config.alwaysOnTop, "floating");
  mainWindow.loadURL(getRendererUrl());

  const menu = Menu.buildFromTemplate([
    {
      label: "汪汪Q版",
      submenu: [
        { label: "置顶", type: "checkbox", checked: true, click: toggleAlwaysOnTop },
        { type: "separator" },
        { label: "退出", role: "quit" }
      ]
    }
  ]);
  Menu.setApplicationMenu(menu);
}

function toggleAlwaysOnTop(item) {
  if (!mainWindow) return;
  mainWindow.setAlwaysOnTop(item.checked, "floating");
}

ipcMain.on("window:drag-start", (_event, point) => {
  if (!mainWindow) return;
  dragState = {
    point,
    bounds: mainWindow.getBounds()
  };
});

ipcMain.on("window:drag-move", (_event, point) => {
  if (!mainWindow || !dragState) return;
  const dx = Math.round(point.x - dragState.point.x);
  const dy = Math.round(point.y - dragState.point.y);
  mainWindow.setBounds({
    ...dragState.bounds,
    x: dragState.bounds.x + dx,
    y: dragState.bounds.y + dy
  });
});

ipcMain.on("window:drag-end", () => {
  dragState = null;
});

ipcMain.on("window:minimize", () => {
  mainWindow?.minimize();
});

ipcMain.on("window:close", () => {
  mainWindow?.close();
});

app.whenReady().then(createWindow);

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
