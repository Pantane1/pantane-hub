/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PAYSTACK_LIVE_PUBLIC_KEY: string
  readonly VITE_PAYPAL_LIVE_CLIENT_ID: string
  readonly VITE_MPESA_BACKEND_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}