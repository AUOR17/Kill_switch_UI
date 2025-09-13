/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WS_URL: string;
  // agrega aquí más VITE_* si las necesitas
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
