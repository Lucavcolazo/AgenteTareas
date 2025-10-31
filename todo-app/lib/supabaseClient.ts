"use client";

// Cliente de Supabase para componentes del lado del cliente
// Comentarios en español como solicitaste

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../types/database";

export const supabaseClient = () =>
  createClientComponentClient<Database>();


