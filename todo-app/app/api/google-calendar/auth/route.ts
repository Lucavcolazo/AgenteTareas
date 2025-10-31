// Endpoint para autorizar Google Calendar OAuth
import { NextResponse } from "next/server";
import { google } from "googleapis";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(req: Request) {
  try {
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 
      `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace("/rest/v1", "")}/api/google-calendar/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET no configurados" },
        { status: 500 }
      );
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    // Scope necesario para leer y escribir en Google Calendar
    const scopes = [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
    ];

    // Generar URL de autorización
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent", // Forzar consent para obtener refresh token
      state: user.id, // Pasar user ID en state para recuperarlo en el callback
    });

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error("Error en auth de Google Calendar:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

