interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_URL: string;
  readonly VITE_FIREBASE_CONFIG: string;
  readonly VITE_FIREBASE_VAPID_KEY?: string;
  // add more VITE_ variables here if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}