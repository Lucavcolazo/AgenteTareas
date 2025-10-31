import { NextResponse } from "next/server";
import {
  createTaskTool,
  updateTaskTool,
  deleteTaskTool,
  searchTasksTool,
  getTaskStatsTool,
  deleteTasksBulkTool,
} from "@/lib/agent/tools";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL ?? "anthropic/claude-3-haiku";

export async function POST(req: Request) {
  if (!OPENROUTER_API_KEY) return NextResponse.json({ error: "Falta OPENROUTER_API_KEY" }, { status: 500 });
  const body = await req.json();
  const messages = body.messages as any[];
  if (!Array.isArray(messages)) return NextResponse.json({ error: "Formato inválido" }, { status: 400 });

  // Definición de tools (OpenAI-compatible)
  const tools = [
    {
      type: "function",
      function: {
        name: "createTask",
        description: "Crear una nueva tarea",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string" },
            priority: { type: "string", enum: ["low", "medium", "high"] },
            dueDate: { type: "string", description: "ISO date" },
            category: { type: "string", enum: ["work", "personal", "shopping", "health", "other"] },
            details: { type: "string" },
            folderId: { type: "string", nullable: true },
            folderName: { type: "string", nullable: true },
          },
          required: ["title"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "updateTask",
        description: "Actualizar campos de una tarea existente",
        parameters: {
          type: "object",
          properties: {
            taskId: { type: "string" },
            title: { type: "string" },
            completed: { type: "boolean" },
            priority: { type: "string", enum: ["low", "medium", "high"] },
            dueDate: { type: "string" },
            category: { type: "string", enum: ["work", "personal", "shopping", "health", "other"] },
            details: { type: "string", nullable: true },
            folderId: { type: "string", nullable: true },
            folderName: { type: "string", nullable: true },
          },
          required: ["taskId"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "deleteTask",
        description: "Eliminar una tarea por id",
        parameters: {
          type: "object",
          properties: {
            taskId: { type: "string" },
            confirm: { type: "boolean" },
          },
          required: ["taskId"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "deleteTasksBulk",
        description: "Eliminar múltiples tareas por id con confirmación",
        parameters: {
          type: "object",
          properties: {
            taskIds: { type: "array", items: { type: "string" } },
            confirm: { type: "boolean" },
          },
          required: ["taskIds", "confirm"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "searchTasks",
        description: "Buscar y filtrar tareas",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string" },
            completed: { type: "boolean" },
            priority: { type: "string", enum: ["low", "medium", "high"] },
            category: { type: "string", enum: ["work", "personal", "shopping", "health", "other"] },
            dueDateFrom: { type: "string" },
            dueDateTo: { type: "string" },
            sortBy: { type: "string", enum: ["createdAt", "dueDate", "priority", "title"] },
            sortOrder: { type: "string", enum: ["asc", "desc"] },
            limit: { type: "number" },
          },
        },
      },
    },
    {
      type: "function",
      function: {
        name: "getTaskStats",
        description: "Obtener estadísticas de productividad",
        parameters: {
          type: "object",
          properties: {
            period: { type: "string", enum: ["today", "week", "month", "year", "all-time"] },
            groupBy: { type: "string", enum: ["category", "priority", "date"] },
          },
        },
      },
    },
  ];

  const callOpenRouter = async (msgs: any[]) => {
    const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
      },
      body: JSON.stringify({ model: OPENROUTER_MODEL, messages: msgs, tools, tool_choice: "auto" }),
    });
    const json = await res.json();
    return json;
  };

  // Conversación inicial (system con instrucciones de uso de tools)
  const system = {
    role: "system",
    content: [
      "Eres un agente de To‑Do en español. Tu objetivo es gestionar tareas del usuario usando herramientas.",
      "SIEMPRE que el usuario pida crear, listar, actualizar o eliminar tareas, debes usar las tools correspondientes.",
      "Reglas:",
      "- Confirmar acciones destructivas (borrados masivos) si el usuario no es explícito.",
      "- Si el usuario se refiere a una tarea por título pero no por ID, primero usa searchTasks para localizarla.",
      "- Valida parámetros: título no vacío; dueDate futura; prioridad en {low, medium, high}; categoría en {work, personal, shopping, health, other}.",
      "- Responde de forma breve y clara. Cuando ejecutes una tool, resume el resultado en español.",
      "- Si la búsqueda devuelve múltiples posibles coincidencias, enumera opciones y pide precisión.",
      "Ejemplos de uso (no los muestres al usuario):",
      "Usuario: 'Agrega tarea comprar leche mañana' -> createTask { title:'comprar leche', dueDate:'YYYY-MM-DDT09:00:00Z' }",
      "Usuario: 'Marca como completada la tarea del informe' -> searchTasks { query:'informe', completed:null } -> updateTask { taskId:<id>, completed:true }",
      "Usuario: 'Elimina todas las tareas completadas' -> searchTasks { completed:true } -> (si usuario confirma) deleteTask por cada id",
    ].join("\n"),
  } as const;

  let convo: any[] = [system, ...(messages ?? [])];

  for (let i = 0; i < 4; i++) {
    const resp = await callOpenRouter(convo);
    const choice = resp?.choices?.[0];
    const toolCalls = choice?.message?.tool_calls;
    if (!toolCalls || toolCalls.length === 0) {
      // Respuesta final del asistente
      return NextResponse.json({ message: choice?.message?.content ?? "" });
    }
    // Anexar el mensaje del asistente que contiene las tool calls
    convo.push({
      role: "assistant",
      content: choice?.message?.content ?? "",
      tool_calls: toolCalls,
    });
    // Ejecutar herramientas y anexar resultados
    for (const tc of toolCalls) {
      const name = tc.function?.name;
      const args = tc.function?.arguments ? JSON.parse(tc.function.arguments) : {};
      try {
        let result: any;
        if (name === "createTask") result = await createTaskTool(args);
        else if (name === "updateTask") result = await updateTaskTool(args);
        else if (name === "deleteTask") result = await deleteTaskTool(args);
        else if (name === "searchTasks") result = await searchTasksTool(args);
        else if (name === "getTaskStats") result = await getTaskStatsTool(args);
        else if (name === "deleteTasksBulk") result = await deleteTasksBulkTool(args);
        else result = { error: `Tool desconocida: ${name}` };
        convo.push({ role: "tool", content: JSON.stringify(result), tool_call_id: tc.id });
      } catch (e: any) {
        convo.push({ role: "tool", content: JSON.stringify({ error: e.message ?? "Error" }), tool_call_id: tc.id });
      }
    }
  }

  return NextResponse.json({ message: "No se pudo completar la operación" });
}


