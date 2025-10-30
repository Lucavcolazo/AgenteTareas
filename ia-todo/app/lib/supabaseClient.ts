import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

/*
 * Necesitamos un tipo de cliente compatible con `@supabase/auth-ui-react`.
 * Ese paquete espera `SupabaseClient<any, 'public', 'public'>`.
 * Usamos este alias local para evitar `as any` en las páginas.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AuthUiSupabaseClient = SupabaseClient<any, 'public', 'public'>

let browserClient: AuthUiSupabaseClient | null = null

export function getSupabaseBrowser(): AuthUiSupabaseClient {
    if (browserClient) return browserClient
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anonKey) {
        throw new Error('Falta la configuración de Supabase: define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local')
    }
    browserClient = createBrowserClient(url, anonKey) as unknown as AuthUiSupabaseClient
    return browserClient
}