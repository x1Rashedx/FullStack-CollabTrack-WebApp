interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_URL: string;
  // add more VITE_ variables here if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}