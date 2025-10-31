// Endpoint para agregar evento a Google Calendar desde el frontend
import { NextResponse } from "next/server";
import { addEventToGoogleCalendar } from "@/lib/agent/googleCalendar";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, startDate, endDate, location } = body;

    if (!title || !startDate || !endDate) {
      return NextResponse.json(
        { error: "title, startDate y endDate son requeridos" },
        { status: 400 }
      );
    }

    const result = await addEventToGoogleCalendar(user.id, {
      title,
      description,
      startDate,
      endDate,
      location,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error agregando evento:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

