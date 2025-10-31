import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
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

type ToolDefinition = {
  type: "function";
  function: {
    name:
      | "createTask"
      | "updateTask"
      | "deleteTask"
      | "deleteTasksBulk"
      | "searchTasks"
      | "getTaskStats";
    description: string;
    parameters: unknown;
  };
};

type ChatRole = "system" | "user" | "assistant" | "tool";
type ToolCall = { id: string; function?: { name: string; arguments?: string } };
type ChatMessage = { role: ChatRole; content: string; tool_calls?: ToolCall[]; tool_call_id?: string };

async function getDisplayName(): Promise<string> {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return "Usuario";
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const fullName = typeof meta.full_name === "string" ? meta.full_name : undefined;
  const name = typeof meta.name === "string" ? meta.name : undefined;
  const email = typeof user.email === "string" ? user.email : undefined;
  return fullName || name || (email ? email.split("@")[0] : "Usuario");
}

export async function POST(req: Request) {
  if (!OPENROUTER_API_KEY) return NextResponse.json({ error: "Falta OPENROUTER_API_KEY" }, { status: 500 });
  const body = await req.json();
  const messages = (body.messages as ChatMessage[]) ?? [];
  if (!Array.isArray(messages)) return NextResponse.json({ error: "Formato inválido" }, { status: 400 });

  // Definición de tools (OpenAI-compatible)
  const tools: ToolDefinition[] = [
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
        description: "Actualizar campos de una tarea existente. IMPORTANTE: Cuando el usuario pida 'agregar' items a una descripción (ej: 'agrega queso crema a la tarea X'), primero busca la tarea con searchTasks, lee el campo 'details' actual, y luego COMBINA el contenido existente con los nuevos items. NUNCA reemplaces toda la descripción a menos que el usuario lo solicite explícitamente. Si el usuario dice 'agrega', 'añade', 'suma', interpreta como AGREGAR al contenido existente, no reemplazar.",
        parameters: {
          type: "object",
          properties: {
            taskId: { type: "string", description: "ID único de la tarea a actualizar" },
            title: { type: "string", description: "Nuevo título (solo si el usuario quiere cambiar el título)" },
            completed: { type: "boolean", description: "Estado de completitud: true=completada, false=pendiente" },
            priority: { type: "string", enum: ["low", "medium", "high"], description: "Nueva prioridad" },
            dueDate: { type: "string", description: "Nueva fecha límite (ISO)" },
            category: { type: "string", enum: ["work", "personal", "shopping", "health", "other"], description: "Nueva categoría" },
            details: { type: "string", nullable: true, description: "Nueva descripción. Si el usuario dice 'agrega X', combina el 'details' actual con X. Si dice 'cambia a X' o 'pon X', reemplaza." },
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
        description: "OBLIGATORIO: Usa esta herramienta para obtener las tareas REALES del usuario desde la base de datos. NUNCA inventes tareas. Si el usuario pregunta 'qué tareas tengo', 'muéstrame mis tareas', etc., DEBES usar esta herramienta primero. Devuelve un objeto con 'items' (array de tareas) y 'total' (número). Solo menciona tareas que estén en el array 'items' del resultado.",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "Texto de búsqueda en título/descripción (opcional)" },
            completed: { type: "boolean", description: "Filtrar por estado completado: true=completadas, false=pendientes, omitir=todas (opcional)" },
            priority: { type: "string", enum: ["low", "medium", "high"], description: "Filtrar por prioridad (opcional)" },
            category: { type: "string", enum: ["work", "personal", "shopping", "health", "other"], description: "Filtrar por categoría (opcional)" },
            dueDateFrom: { type: "string", description: "Fecha mínima (ISO, opcional)" },
            dueDateTo: { type: "string", description: "Fecha máxima (ISO, opcional)" },
            sortBy: { type: "string", enum: ["createdAt", "dueDate", "priority", "title"], description: "Campo de ordenamiento (opcional)" },
            sortOrder: { type: "string", enum: ["asc", "desc"], description: "Orden ascendente o descendente (opcional)" },
            limit: { type: "number", description: "Número máximo de resultados (opcional, por defecto hasta 1000)" },
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

  const callOpenRouter = async (msgs: ChatMessage[]) => {
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
  const displayName = await getDisplayName();
  const system: ChatMessage = {
    role: "system",
    content: [
      // Importante: mantener respuestas y comentarios en español
      "Eres un agente de To‑Do en español. Gestionas tareas del usuario usando herramientas.",
      `Llama al usuario por su nombre: ${displayName}.`,
      "REGLA CRÍTICA #1: NUNCA inventes, asumas, crees o menciones tareas que no existen en la base de datos. SIEMPRE debes usar searchTasks para obtener información real.",
      "REGLA CRÍTICA #2: Si no ejecutas searchTasks y obtienes su resultado, NO PUEDES mencionar ninguna tarea. Está estrictamente prohibido inventar nombres de tareas.",
      "SIEMPRE que el usuario pida crear, listar, actualizar o eliminar tareas, debes usar las tools correspondientes.",
      "Reglas:",
      "- Cuando el usuario pregunte '¿qué tareas tengo?', 'muéstrame mis tareas', 'lista mis tareas', 'qué tareas pendientes tengo', 'dame una lista de tareas', etc., DEBES OBLIGATORIAMENTE ejecutar searchTasks primero. Si el usuario pregunta por pendientes, usa completed=false. Si pregunta por todas, usa searchTasks sin filtros.",
      "- NUNCA mencionar tareas que no estén en el resultado.items de searchTasks. Si no ejecutas searchTasks, NO mencionar ninguna tarea.",
      "- Después de ejecutar searchTasks, lee el campo 'items' del resultado. Lista SOLO las tareas que están en ese array.",
      "- Si searchTasks devuelve items vacío [], di exactamente: 'No tienes tareas' o 'No tienes tareas pendientes' según el caso.",
      "- Al listar tareas, muestra el campo 'title' de cada objeto en items. Puedes incluir otros campos como 'priority', 'category', 'due_date' si están disponibles en el objeto.",
      "- Confirmar acciones destructivas (borrados masivos) si el usuario no es explícito.",
      "- Si el usuario se refiere a una tarea por título pero no por ID, primero usa searchTasks para localizarla.",
      "- Para referencias ambiguas: 'esa tarea' = busca por contexto de conversación anterior; 'la primera' = primer resultado ordenado por created_at; 'la última' = último resultado ordenado; 'la urgente' = filtrar por priority='high'.",
      "- Cuando el usuario mencione 'todas las tareas [filtro]', primero usa searchTasks con ese filtro para obtener la lista completa antes de aplicar acciones.",
      "- ACTUALIZACIÓN INTELIGENTE DE DESCRIPCIONES: Cuando el usuario pida agregar items a una descripción (ej: 'agrega queso crema a la lista', 'añade jamón a la compra'), haz lo siguiente:",
      "  1. Busca la tarea con searchTasks para obtener el campo 'details' actual.",
      "  2. Si el usuario dice 'agrega', 'añade', 'suma', 'incluye': COMBINA el contenido existente con lo nuevo. Formatea la nueva descripción de forma natural y legible.",
      "  3. Si el usuario dice 'cambia', 'reemplaza', 'pon', 'escribe': REEMPLAZA toda la descripción.",
      "  4. Si el usuario dice 'borra', 'quita', 'elimina' items específicos: quita solo esos items de la descripción, mantén el resto.",
      "  5. Si hay ambigüedad o necesitas más contexto, haz preguntas antes de actualizar. Por ejemplo: '¿Quieres que agregue estos items a la lista actual o que reemplace todo?'",
      "  6. Para listas de compras: mantén un formato claro y organizado (ej: 'Comprar: bananas, manzanas, queso crema, jamón crudo, etc.').",
      "- Valida parámetros: título no vacío; dueDate futura; prioridad en {low, medium, high}; categoría en {work, personal, shopping, health, other}.",
      "- Responde de forma breve y clara. Cuando ejecutes una tool, resume el resultado en español con un tono natural.",
      "- Al listar tareas o resultados, usa un formato de lista con viñetas o numerado, una por línea, mostrando el título de cada tarea del resultado.",
      "- Si la búsqueda devuelve múltiples posibles coincidencias, enumera opciones con números y pide precisión.",
      "- Para comandos múltiples en un mensaje (ej: 'crea tarea X y marca Y como completada'), ejecuta todas las tools necesarias en secuencia.",
      "- Si creas una tarea con fecha/hora y la respuesta incluye 'calendarResult':",
      "  * Si success=true: menciona que se agregó automáticamente a Google Calendar y proporciona el enlace (url).",
      "  * Si success=false: menciona que no se pudo agregar automáticamente pero proporciona el enlace (url) para que el usuario lo haga manualmente.",
      "Ejemplos de uso (no los muestres al usuario):",
      "Usuario: '¿Qué tareas tengo?' -> EJECUTA searchTasks {} -> Recibes { items: [{ title: 'Tarea 1', ... }, { title: 'Tarea 2', ... }], total: 2 } -> Responde: 'Tienes 2 tareas: 1) Tarea 1, 2) Tarea 2' (solo las que están en items).",
      "Usuario: 'dame una lista de tareas que tengo que hacer todavía' -> EJECUTA searchTasks { completed:false } -> Recibes { items: [{ title: 'Ir al super', ... }], total: 1 } -> Responde: 'Tienes 1 tarea pendiente: 1) Ir al super' (solo la que está en items).",
      "Usuario: 'Muéstrame mis tareas pendientes' -> EJECUTA searchTasks { completed:false } -> Si items=[], responde 'No tienes tareas pendientes'. Si items tiene elementos, lista cada title.",
      "Usuario: 'Agrega tarea comprar leche mañana' -> createTask -> Si calendarResult.success=true: 'Agregada y añadida a Google Calendar: [url]'. Si success=false: 'Agregada. Puedes añadirla a Google Calendar: [url]'",
      "Usuario: 'Marca como completada la tarea del informe' -> searchTasks { query:'informe' } -> updateTask { taskId:<id>, completed:true }",
      "Usuario: 'agrega queso crema a la lista de compras' -> searchTasks { query:'compra' o 'super' } -> Lee details actual: 'Comprar bananas y manzanas' -> updateTask { taskId:<id>, details:'Comprar bananas, manzanas, queso crema' } -> COMBINAR, no reemplazar",
      "Usuario: 'añade jamón a la tarea de ir al super' -> searchTasks { query:'super' } -> Lee details actual: 'Comprar bananas, queso' -> updateTask { taskId:<id>, details:'Comprar bananas, queso, jamón' } -> AGREGAR, mantener lo existente",
      "Usuario: 'cambia la descripción a solo comprar leche' -> searchTasks -> updateTask { taskId:<id>, details:'Comprar leche' } -> REEMPLAZAR todo",
      "Usuario: 'Elimina todas las tareas completadas' -> searchTasks { completed:true } -> (si confirma) deleteTasksBulk { taskIds:[...], confirm:true }",
    ].join("\n"),
  };

  const convo: ChatMessage[] = [system, ...messages];

  for (let i = 0; i < 4; i++) {
    const resp = await callOpenRouter(convo);
    const choice = resp?.choices?.[0] as
      | { message?: { content?: string; tool_calls?: ToolCall[] } }
      | undefined;
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
      const args = tc.function?.arguments ? JSON.parse(tc.function.arguments) : {} as unknown;
      try {
        let result: unknown;
        if (name === "createTask") result = await createTaskTool(args as never);
        else if (name === "updateTask") result = await updateTaskTool(args as never);
        else if (name === "deleteTask") result = await deleteTaskTool(args as never);
        else if (name === "searchTasks") result = await searchTasksTool(args as never);
        else if (name === "getTaskStats") result = await getTaskStatsTool(args as never);
        else if (name === "deleteTasksBulk") result = await deleteTasksBulkTool(args as never);
        else result = { error: `Tool desconocida: ${name}` } as unknown;
        convo.push({ role: "tool", content: JSON.stringify(result), tool_call_id: tc.id });
      } catch (e: unknown) {
        const errMsg = e instanceof Error ? e.message : "Error";
        convo.push({ role: "tool", content: JSON.stringify({ error: errMsg }), tool_call_id: tc.id });
      }
    }
  }

  return NextResponse.json({ message: "No se pudo completar la operación" });
}


