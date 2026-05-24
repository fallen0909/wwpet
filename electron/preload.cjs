const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("petWindow", {
  dragStart: (point) => ipcRenderer.send("window:drag-start", point),
  dragMove: (point) => ipcRenderer.send("window:drag-move", point),
  dragEnd: () => ipcRenderer.send("window:drag-end"),
  minimize: () => ipcRenderer.send("window:minimize"),
  close: () => ipcRenderer.send("window:close")
});
