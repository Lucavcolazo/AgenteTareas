// Cliente de Supabase para rutas API (lado servidor) utilizando cookies
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/database";

export async function supabaseServer() {
  // Crear un contexto que tenga el método cookies() que retorne el cookieStore
  const cookieStore = await cookies();
  const context = {
    cookies: () => cookieStore
  };
  return createRouteHandlerClient<Database>(context);
}


