/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  readonly VITE_GOOGLE_MAPS_MAP_ID: string;
  readonly VITE_GOOGLE_MAPS_MASTER_MAP_ID: string;
  readonly VITE_LOGO_DEV_TOKEN: string;
  readonly VITE_USE_LOGO_DEV_MARKERS: string;
  readonly VITE_BRANDFETCH_CLIENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace JSX {
  interface IntrinsicElements {
    "dotlottie-wc": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    > & {
      src?: string;
      autoplay?: boolean;
      loop?: boolean;
      style?: React.CSSProperties;
    };
  }
}
