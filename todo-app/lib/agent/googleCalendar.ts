// Integración con Google Calendar usando OAuth
import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type GoogleCalendarEvent = {
  title: string;
  description?: string;
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  location?: string;
};

/**
 * Obtiene el token de acceso de Google desde Supabase
 * Los tokens se almacenan en user_metadata.google_calendar_tokens después de la autorización
 */
async function getGoogleAccessToken(userId: string): Promise<string | null> {
  try {
    const supabase = supabaseAdmin();
    const { data: { user } } = await supabase.auth.admin.getUserById(userId);
    if (!user) return null;

    // Obtener tokens desde user_metadata
    const metadata = user.user_metadata as Record<string, unknown> | undefined;
    const calendarTokens = metadata?.google_calendar_tokens as
      | { access_token?: string; refresh_token?: string; expiry_date?: number }
      | undefined;

    if (!calendarTokens?.access_token) return null;

    // Verificar si el token expiró
    const expiryDate = calendarTokens.expiry_date;
    if (expiryDate && expiryDate < Date.now()) {
      // Token expirado, intentar refrescar
      if (calendarTokens.refresh_token) {
        const newTokens = await refreshGoogleToken(calendarTokens.refresh_token);
        if (newTokens?.access_token) {
          // Actualizar tokens en Supabase
          await supabase.auth.admin.updateUserById(userId, {
            user_metadata: {
              ...metadata,
              google_calendar_tokens: {
                access_token: newTokens.access_token,
                refresh_token: newTokens.refresh_token || calendarTokens.refresh_token,
                expiry_date: newTokens.expiry_date,
              },
            },
          });
          return newTokens.access_token;
        }
      }
      return null;
    }

    return calendarTokens.access_token;
  } catch (error) {
    console.error("Error obteniendo token de Google:", error);
    return null;
  }
}

/**
 * Refresca un token de Google usando el refresh token
 */
async function refreshGoogleToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expiry_date: number;
} | null> {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET no configurados");
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const { credentials } = await oauth2Client.refreshAccessToken();
    
    return {
      access_token: credentials.access_token || "",
      refresh_token: credentials.refresh_token || refreshToken,
      expiry_date: credentials.expiry_date || Date.now() + 3600 * 1000,
    };
  } catch (error) {
    console.error("Error refrescando token de Google:", error);
    return null;
  }
}

/**
 * Configura el cliente OAuth2 de Google
 */
function getOAuth2Client(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace("/rest/v1", "")}/api/google-calendar/callback`;

  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET deben estar configurados");
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Agrega un evento a Google Calendar automáticamente usando la API
 */
export async function addEventToGoogleCalendar(
  userId: string,
  event: GoogleCalendarEvent
): Promise<{ success: boolean; eventId?: string; url?: string; error?: string }> {
  try {
    // Intentar obtener token de acceso desde Supabase
    const accessToken = await getGoogleAccessToken(userId);
    
    // Si no hay token, generar URL para que el usuario autorice manualmente
    if (!accessToken) {
      const calendarUrl = generateGoogleCalendarUrl(event);
      return {
        success: false,
        url: calendarUrl,
        error: "No hay token de acceso de Google. Autoriza la app primero.",
      };
    }

    // Configurar cliente OAuth con el token
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    // Crear cliente de Calendar API
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // Usar la zona horaria local del sistema en lugar de UTC forzado
    // Esto preserva la hora que el usuario ingresó
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Crear evento con notificaciones por defecto: 1 día antes y 3 horas antes
    const calendarEvent = {
      summary: event.title,
      description: event.description || "",
      start: {
        dateTime: event.startDate,
        timeZone: timeZone, // Usar zona horaria local en lugar de UTC
      },
      end: {
        dateTime: event.endDate,
        timeZone: timeZone, // Usar zona horaria local en lugar de UTC
      },
      location: event.location || "",
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 }, // 1 día antes (1440 minutos)
          { method: "popup", minutes: 24 * 60 }, // 1 día antes
          { method: "email", minutes: 3 * 60 }, // 3 horas antes (180 minutos)
          { method: "popup", minutes: 3 * 60 }, // 3 horas antes
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: calendarEvent,
    });

    return {
      success: true,
      eventId: response.data.id || undefined,
      url: response.data.htmlLink || generateGoogleCalendarUrl(event),
    };
  } catch (error) {
    console.error("Error agregando evento a Google Calendar:", error);
    
    // Si el token expiró o no es válido, generar URL manual
    const calendarUrl = generateGoogleCalendarUrl(event);
    return {
      success: false,
      url: calendarUrl,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Genera URL de Google Calendar para crear un evento manualmente
 * Fallback cuando OAuth no está disponible
 * IMPORTANTE: Usa la zona horaria local del usuario, no UTC
 * Nota: Las notificaciones en la URL manual no se pueden configurar, solo en la API
 */
export function generateGoogleCalendarUrl(event: GoogleCalendarEvent): string {
  // Convertir fecha ISO a fecha local y formatear correctamente
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    // Calcular offset de zona horaria local en minutos
    const offset = -date.getTimezoneOffset();
    const offsetHours = Math.floor(Math.abs(offset) / 60);
    const offsetMinutes = Math.abs(offset) % 60;
    const sign = offset >= 0 ? "+" : "-";
    
    // Usar métodos locales para preservar la hora que el usuario ingresó
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");
    
    // Formato: YYYYMMDDTHHmmss+offset (ej: 20251101T120000-0300)
    return `${year}${month}${day}T${hour}${minute}00${sign}${String(offsetHours).padStart(2, "0")}${String(offsetMinutes).padStart(2, "0")}`;
  };

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${formatDate(event.startDate)}/${formatDate(event.endDate)}`,
    details: event.description || "",
    location: event.location || "",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
