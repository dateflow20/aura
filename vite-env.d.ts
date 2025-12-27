/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string;
    readonly VITE_SUPABASE_ANON_KEY: string;
    readonly VITE_GEMINI_API_KEY: string;
    readonly VITE_DEEPSEEK_API_KEY: string;
    readonly VITE_OPENROUTER_API_KEY_1: string;
    readonly VITE_OPENROUTER_API_KEY_2: string;
    readonly VITE_GUEST_MODE: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
