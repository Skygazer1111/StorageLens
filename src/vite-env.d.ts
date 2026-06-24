/// <reference types="vite/client" />

declare global {
  interface Window {
    MonacoEnvironment?: {
      getWorker: (workerId: string, label: string) => Worker
    }
  }
}

declare const self: Window & typeof globalThis

export {}