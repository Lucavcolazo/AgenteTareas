# 📊 Estado del Proyecto y Plan de Mejoras

Este documento evalúa el estado actual del proyecto según los criterios del profesor y propone mejoras.

## ✅ Lo que YA está implementado

### 1. Tool Calling Implementation
- ✅ Schema de tools definido correctamente (líneas 54-162 en `app/api/agent/route.ts`)
- ✅ Ejecución asíncrona de tools (for loop en línea 220)
- ✅ Validación básica de parámetros (en cada función de `lib/agent/tools.ts`)
- ✅ Manejo de errores con try-catch (líneas 233-236)
- ✅ Encadenamiento de tools (el prompt instruye sobre esto, línea 196)

### 2. Database Operations
- ✅ Queries básicas implementadas
- ✅ Soft deletes implementados (usando `deleted_at`)
- ✅ Filtros por `user_id` para seguridad

### 3. Features Básicas
- ✅ CRUD completo de tareas
- ✅ Sistema de carpetas
- ✅ Prioridades y categorías
- ✅ Fechas de vencimiento
- ✅ Descripciones
- ✅ UI funcional y responsiva
- ✅ Autenticación con Supabase

### 4. Seguridad
- ✅ API keys solo en backend
- ✅ Validación de inputs básica
- ✅ Ownership de tareas (user_id)
- ✅ RLS implementado (Row Level Security)

## ⚠️ Lo que FALTA o necesita MEJORA

### 1. Tool Calling - MEJORAS NECESARIAS

#### ❌ Validación más robusta de parámetros
**Problema actual:** Validación básica, falta validar tipos y rangos.

**Mejora necesaria:**
```typescript
// Agregar en lib/agent/tools.ts
function validateCreateTaskArgs(args: unknown): asserts args is CreateTaskArgs {
  if (!args || typeof args !== 'object') throw new Error("Parámetros inválidos");
  const a = args as Record<string, unknown>;
  if (!a.title || typeof a.title !== 'string' || !a.title.trim()) {
    throw new Error("El título es requerido y debe ser un string no vacío");
  }
  // Validar prioridad
  if (a.priority && !["low", "medium", "high"].includes(a.priority as string)) {
    throw new Error("Prioridad debe ser: low, medium o high");
  }
  // Validar fecha
  if (a.dueDate && typeof a.dueDate === 'string') {
    const date = new Date(a.dueDate);
    if (isNaN(date.getTime())) throw new Error("Fecha inválida");
  }
}
```

#### ❌ Mejor manejo de errores en tool execution
**Problema actual:** Errores genéricos, no hay logging estructurado.

**Mejora necesaria:** Agregar logging y errores más descriptivos.

#### ⚠️ Mejorar encadenamiento de tools
**Estado actual:** El prompt menciona encadenar, pero no hay validación automática.

**Mejora:** El prompt ya lo instruye bien, pero se puede mejorar con ejemplos más específicos.

### 2. Natural Language Understanding - MEJORAS

#### ⚠️ Referencias ambiguas ("esa tarea", "la primera")
**Estado:** Parcialmente cubierto por el prompt, pero puede mejorarse.

**Mejora necesaria:**
```typescript
// Agregar al prompt del sistema (línea 192):
"- Cuando el usuario diga 'esa tarea', 'la primera', 'la última', primero usa searchTasks para obtener la lista actual de tareas y luego identifica cuál se refiere.",
"- Para 'la primera' usa el primer resultado ordenado por created_at o due_date.",
"- Para 'la última' usa el último resultado ordenado.",
"- Para 'esa tarea' intenta hacer match por título o descripción mencionada anteriormente.",
```

#### ⚠️ Comandos complejos múltiples
**Estado:** Funciona básicamente, pero puede mejorar.

**Mejora:** El prompt ya instruye sobre esto, pero agregar más ejemplos.

### 3. Database Operations - MEJORAS

#### ❌ Búsqueda full-text mejorada
**Problema actual:** Solo búsqueda ILIKE básica en `searchTasksTool`.

**Mejora necesaria:**
```typescript
// En lib/agent/tools.ts, línea 164-166:
// Actual:
if (args.query && args.query.trim()) {
  const qtext = args.query.trim();
  q = q.or(`title.ilike.%${qtext}%,details.ilike.%${qtext}%`);
}

// Mejorado (si Supabase tiene full-text search):
// Usar to_tsvector para búsqueda más inteligente
// O al menos mejorar el matching con múltiples palabras
```

#### ❌ Cálculo optimizado de estadísticas
**Problema actual:** `getTaskStatsTool` carga todas las tareas y calcula en memoria.

**Mejora necesaria:**
```typescript
// Usar agregaciones SQL en lugar de cargar todo:
const { data: stats } = await supabase
  .from("tasks")
  .select("completada, priority, category")
  .eq("user_id", userId);
// Luego calcular con agregaciones en la query si es posible
```

#### ⚠️ Índices en base de datos
**Mejora necesaria:** Agregar índices para mejorar performance:
```sql
-- En Supabase SQL Editor:
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_completada ON tasks(completada);
CREATE INDEX IF NOT EXISTS idx_tasks_deleted_at ON tasks(deleted_at);
CREATE INDEX IF NOT EXISTS idx_tasks_user_completada ON tasks(user_id, completada) WHERE deleted_at IS NULL;
```

### 4. Search & Filter Logic - MEJORAS

#### ⚠️ Lógica AND/OR mejorada
**Estado actual:** Soporta OR básico para búsqueda de texto, pero falta AND/OR explícito.

**Mejora necesaria:** 
- Agregar parámetro `logic: "and" | "or"` en `SearchTasksArgs` (ya existe pero no se usa)
- Implementar la lógica en `searchTasksTool`

#### ⚠️ Ordenamiento flexible
**Estado actual:** Soporta sortBy básico, pero falta ordenamiento por múltiples campos.

**Mejora:** Agregar ordenamiento secundario (ej: por prioridad luego por fecha).

### 5. Statistics Calculation - MEJORAS

#### ❌ Cálculos de rachas (streaks)
**Falta implementar:** El prompt menciona "Racha actual: 4 días consecutivos" pero no está implementado.

**Mejora necesaria:**
```typescript
// Agregar cálculo de streaks en getTaskStatsTool:
async function calculateStreak(tasks: Task[]): Promise<number> {
  // Ordenar tareas completadas por fecha descendente
  const completed = tasks
    .filter(t => t.completada)
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  
  // Calcular días consecutivos desde hoy hacia atrás
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  for (const task of completed) {
    const taskDate = new Date(task.created_at || 0);
    taskDate.setHours(0, 0, 0, 0);
    if (taskDate.getTime() === currentDate.getTime()) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (taskDate.getTime() < currentDate.getTime()) {
      break;
    }
  }
  return streak;
}
```

#### ⚠️ Detección de tendencias
**Falta implementar:** Comparación con períodos anteriores.

**Mejora:** Comparar semana actual vs semana anterior.

### 6. Security - MEJORAS

#### ❌ Rate limiting
**Falta implementar:** No hay rate limiting por usuario.

**Mejora necesaria:**
```typescript
// Agregar en app/api/agent/route.ts:
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(50, "1 h"), // 50 requests por hora
});

// Antes de procesar la request:
const { success } = await ratelimit.limit(userId);
if (!success) {
  return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
}
```

#### ⚠️ Sanitización de responses del LLM
**Estado:** Básico, pero falta sanitizar HTML/script tags si se renderiza.

### 7. Performance - MEJORAS

#### ❌ Optimistic UI Updates
**Estado actual:** Parcialmente implementado (en algunos lugares), pero falta consistencia.

**Mejora:** Implementar en todas las operaciones.

#### ❌ Caché de estadísticas
**Falta:** Cachear estadísticas si son costosas (especialmente getTaskStats).

**Mejora:** Usar React Query o similar para cachear resultados.

#### ⚠️ Paginación en searchTasks
**Estado actual:** Soporta limit/offset, pero falta paginación automática para listas grandes.

### 8. UX - MEJORAS

#### ⚠️ Loading states
**Estado:** Parcialmente implementado, pero falta en algunas operaciones.

#### ⚠️ Feedback de acciones
**Estado:** Implementado con toasts, pero se puede mejorar.

#### ❌ Deshacer acciones
**Falta:** No hay opción de deshacer eliminaciones o actualizaciones.

**Mejora:** Agregar historial de acciones recientes con opción de deshacer.

## 🎯 Priorización de Mejoras

### Alta Prioridad (Hacer Primero)

1. **Validación robusta de parámetros** - Crítico para seguridad
2. **Índices de base de datos** - Mejora performance significativamente
3. **Mejor manejo de errores** - Mejor experiencia de usuario
4. **Rate limiting** - Seguridad básica
5. **Renombrar columna `completed` → `completada`** - Arreglar error 400 actual

### Media Prioridad

1. **Cálculo de rachas (streaks)** - Feature prometida en ejemplos
2. **Mejorar búsqueda full-text**
3. **Lógica AND/OR en filtros**
4. **Optimistic UI updates completos**
5. **Referencias ambiguas mejoradas**

### Baja Prioridad (Nice to Have)

1. **Detección de tendencias**
2. **Caché de estadísticas**
3. **Deshacer acciones**
4. **Ordenamiento por múltiples campos**

## 📝 Plan de Implementación Sugerido

### Fase 1: Arreglar Bugs y Seguridad (1-2 días)
1. Renombrar columna en BD
2. Agregar validación robusta
3. Implementar rate limiting básico
4. Agregar índices en BD

### Fase 2: Mejorar Core Features (2-3 días)
1. Mejorar búsqueda y filtros
2. Implementar cálculos de streaks
3. Optimizar queries de estadísticas
4. Mejorar referencias ambiguas en prompt

### Fase 3: UX y Performance (1-2 días)
1. Optimistic UI updates completos
2. Mejorar loading states
3. Caché de estadísticas
4. Deshacer acciones (opcional)

## 🔧 Comandos SQL Necesarios

```sql
-- 1. Renombrar columna (si aún no se hizo)
ALTER TABLE public.tasks RENAME COLUMN completed TO completada;

-- 2. Agregar índices para performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_completada ON public.tasks(completada);
CREATE INDEX IF NOT EXISTS idx_tasks_deleted_at ON public.tasks(deleted_at);
CREATE INDEX IF NOT EXISTS idx_tasks_user_completada ON public.tasks(user_id, completada) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_user_priority ON public.tasks(user_id, priority) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_user_category ON public.tasks(user_id, category) WHERE deleted_at IS NULL;

-- 3. Índice para búsqueda de texto (si Supabase lo soporta)
CREATE INDEX IF NOT EXISTS idx_tasks_title_search ON public.tasks USING gin(to_tsvector('spanish', title));
```

## 📚 Recursos Adicionales

- [OpenRouter Docs](https://openrouter.ai/docs)
- [Supabase Indexing](https://supabase.com/docs/guides/database/postgres/indexes)
- [Tool Calling Best Practices](https://platform.openai.com/docs/guides/function-calling)
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)

