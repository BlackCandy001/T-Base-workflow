import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  saveProject: (data: any) => ipcRenderer.invoke('save-project', data),
  loadProject: () => ipcRenderer.invoke('load-project'),
  saveProjectSilent: (data: any) => ipcRenderer.invoke('save-project-silent', data),
  loadProjectSilent: () => ipcRenderer.invoke('load-project-silent'),
  
  // Storage for Zen
  storageGet: (key: string) => ipcRenderer.invoke('storage-get', key),
  storageSet: (key: string, value: string) => ipcRenderer.invoke('storage-set', key, value),
  storageDelete: (key: string) => ipcRenderer.invoke('storage-delete', key),
  storageList: (prefix?: string) => ipcRenderer.invoke('storage-list', prefix),
  
  // System Info
  getSystemInfo: () => ipcRenderer.invoke('get-system-info')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
