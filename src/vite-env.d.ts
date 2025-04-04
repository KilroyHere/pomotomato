/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SPOTIFY_CLIENT_ID: string;
  // add more env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
