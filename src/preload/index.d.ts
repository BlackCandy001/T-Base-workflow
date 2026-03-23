import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      saveProject: (data: any) => Promise<boolean>
      loadProject: () => Promise<any>
    }
  }
}
