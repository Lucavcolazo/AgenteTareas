import { NextResponse } from "next/server";

// Genera una URL de "Add to Google Calendar" con título y fecha/hora
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, startISO, details, timeZone } = body as {
      title?: string;
      startISO?: string;
      details?: string;
      timeZone?: string;
    };
    if (!title || !startISO) {
      return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
    }
    const start = new Date(startISO);
    const end = new Date(start.getTime() + 30 * 60 * 1000); // 30 minutos por defecto
    const fmt = (d: Date) =>
      d
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}Z$/, "Z");
    const dates = `${fmt(start)}/${fmt(end)}`;
    const params = new URLSearchParams({ action: "TEMPLATE", text: title, dates });
    if (details) params.set("details", details);
    if (timeZone) params.set("ctz", timeZone);
    const url = `https://calendar.google.com/calendar/render?${params.toString()}`;
    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}


