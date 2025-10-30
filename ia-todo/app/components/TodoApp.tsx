'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

type Todo = {
	id: string
	title: string
	completed: boolean
	created_at?: string
}

async function fetchTasks(): Promise<Todo[]> {
	const res = await fetch('/api/todos', { cache: 'no-store' })
	if (!res.ok) throw new Error('Error al cargar tareas')
	return res.json()
}

export default function TodoApp() {
	const queryClient = useQueryClient()
	const [title, setTitle] = useState('')
	const [editingId, setEditingId] = useState<string | null>(null)
	const [editingTitle, setEditingTitle] = useState('')

	const tasksQuery = useQuery({
		queryKey: ['tasks'],
		queryFn: fetchTasks,
		staleTime: 10_000,
	})

	const addMutation = useMutation({
		mutationFn: async (t: string) => {
			const res = await fetch('/api/todos', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: t }),
			})
			if (!res.ok) throw new Error('No se pudo crear la tarea')
			return res.json()
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
	})

	const toggleMutation = useMutation({
		mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
			const res = await fetch('/api/todos', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id, completed }),
			})
			if (!res.ok) throw new Error('No se pudo actualizar la tarea')
			return res.json()
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
	})

	const editMutation = useMutation({
		mutationFn: async ({ id, title }: { id: string; title: string }) => {
			const res = await fetch('/api/todos', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id, title }),
			})
			if (!res.ok) throw new Error('No se pudo editar la tarea')
			return res.json()
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
	})

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			const res = await fetch(`/api/todos?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
			if (!res.ok) throw new Error('No se pudo eliminar la tarea')
			return res.json()
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
	})

	async function addTodo(e: React.FormEvent) {
		e.preventDefault()
		if (!title.trim()) return
		await addMutation.mutateAsync(title.trim())
		setTitle('')
	}

	function startEdit(todo: Todo) {
		setEditingId(todo.id)
		setEditingTitle(todo.title)
	}

	async function saveEdit(id: string) {
		if (!editingTitle.trim()) return
		await editMutation.mutateAsync({ id, title: editingTitle.trim() })
		setEditingId(null)
		setEditingTitle('')
	}

	return (
		<div className="flex flex-col gap-6">
			<form onSubmit={addTodo} className="flex gap-2">
				<input
					type="text"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					placeholder="Nueva tarea"
					className="flex-1 rounded-md border px-3 py-2 text-sm outline-none dark:bg-black"
				/>
				<button
					disabled={addMutation.isPending}
					className="rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-black"
				>
					Agregar
				</button>
			</form>

			{tasksQuery.isLoading ? (
				<p className="text-sm text-zinc-500">Cargando...</p>
			) : tasksQuery.isError ? (
				<p className="text-sm text-red-600">Error al cargar las tareas</p>
			) : (
				<ul className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
					{tasksQuery.data!.map((t) => (
						<li key={t.id} className="flex items-center justify-between py-3">
							<div className="flex items-center gap-3">
								<input
									type="checkbox"
									checked={t.completed}
									onChange={(e) => toggleMutation.mutate({ id: t.id, completed: e.target.checked })}
								/>
								{editingId === t.id ? (
									<input
										value={editingTitle}
										onChange={(e) => setEditingTitle(e.target.value)}
										className="rounded-md border px-2 py-1 text-sm dark:bg-black"
									/>
								) : (
									<span className={t.completed ? 'line-through text-zinc-500' : ''}>{t.title}</span>
								)}
							</div>
							<div className="flex gap-2">
								{editingId === t.id ? (
									<>
										<button onClick={() => saveEdit(t.id)} className="rounded-md border px-2 py-1 text-xs">Guardar</button>
										<button onClick={() => { setEditingId(null); setEditingTitle('') }} className="rounded-md border px-2 py-1 text-xs">Cancelar</button>
									</>
								) : (
									<button onClick={() => startEdit(t)} className="rounded-md border px-2 py-1 text-xs">Editar</button>
								)}
								<button onClick={() => deleteMutation.mutate(t.id)} className="rounded-md border px-2 py-1 text-xs text-red-600">Eliminar</button>
							</div>
						</li>
					))}
					{tasksQuery.data!.length === 0 && (
						<li className="py-6 text-sm text-zinc-500">Sin tareas aún</li>
					)}
				</ul>
			)}
		</div>
	)
}
