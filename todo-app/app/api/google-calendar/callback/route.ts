// Callback de OAuth de Google Calendar
import { NextResponse } from "next/server";
import { google } from "googleapis";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // user ID

    if (!code || !state) {
      return NextResponse.redirect(new URL("/?error=oauth_canceled", req.url));
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 
      `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace("/rest/v1", "")}/api/google-calendar/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(new URL("/?error=oauth_config", req.url));
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    const { tokens } = await oauth2Client.getToken(code);

    // Almacenar tokens en Supabase (en user_metadata)
    // Usar cliente admin con service_role para poder actualizar user_metadata
    const supabase = supabaseAdmin();
    
    // Obtener metadata actual del usuario para preservarlo
    const { data: { user } } = await supabase.auth.admin.getUserById(state);
    if (!user) {
      console.error("Usuario no encontrado:", state);
      return NextResponse.redirect(new URL("/?error=user_not_found", req.url));
    }
    
    const currentMetadata = (user.user_metadata as Record<string, unknown>) ?? {};

    const { error } = await supabase.auth.admin.updateUserById(state, {
      user_metadata: {
        ...currentMetadata,
        google_calendar_tokens: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expiry_date: tokens.expiry_date,
        },
      },
    });

    if (error) {
      console.error("Error guardando tokens:", error);
      return NextResponse.redirect(new URL("/?error=token_save", req.url));
    }

    return NextResponse.redirect(new URL("/profile?google_calendar_connected=true", req.url));
  } catch (error) {
    console.error("Error en callback de Google Calendar:", error);
    return NextResponse.redirect(new URL("/?error=oauth_error", req.url));
  }
}

