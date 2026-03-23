class ExtensionService {
  private static instance: ExtensionService;

  private constructor() {}

  public static getInstance(): ExtensionService {
    if (!ExtensionService.instance) {
      ExtensionService.instance = new ExtensionService();
    }
    return ExtensionService.instance;
  }

  public postMessage(message: any): void {
    console.log("ExtensionService postMessage:", message);
    if (message.command && (window as any).api?.[message.command]) {
       // Optional: Auto-handle some commands if they match API methods
    }
  }

  public getStorage(): any {
    return {
      get: (key: string) => Promise.resolve((window as any).api?.storageGet?.(key)),
      set: (key: string, value: string) => Promise.resolve((window as any).api?.storageSet?.(key, value)),
      delete: (key: string) => Promise.resolve((window as any).api?.storageDelete?.(key)),
      list: (prefix?: string) => Promise.resolve((window as any).api?.storageList?.(prefix)),
    };
  }

  public async getSystemInfo(): Promise<any> {
    return (window as any).api?.getSystemInfo?.();
  }
}

export const extensionService = ExtensionService.getInstance();
