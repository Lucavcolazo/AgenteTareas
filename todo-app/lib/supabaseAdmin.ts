// Cliente de Supabase con service_role para operaciones admin
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar configurados");
}

// Cliente con permisos de administrador (service_role)
export function supabaseAdmin() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY no está configurada en las variables de entorno");
  }
  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

