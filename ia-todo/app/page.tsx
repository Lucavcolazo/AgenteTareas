import { supabaseServer } from '@/app/lib/supabaseServer'
import LogoutButton from './components/LogoutButton'
import TodoApp from './components/TodoApp'

export default async function Home() {
	const supabase = await supabaseServer()
	const {
		data: { session },
	} = await supabase.auth.getSession()

	if (!session) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
				<main className="flex w-full max-w-2xl flex-col items-center gap-6 py-24 px-6 text-center">
					<h1 className="text-3xl font-semibold text-black dark:text-zinc-50">Bienvenido a tu gestor de tareas</h1>
					<p className="text-zinc-600 dark:text-zinc-400">La mejor opción para manejar tus tareas. Inicia sesión desde la pestaña Auth para comenzar.</p>
				</main>
			</div>
		)
	}

	const {
		data: { user },
	} = await supabase.auth.getUser()
	const userName = (user?.user_metadata as any)?.full_name || user?.email || 'Usuario'

	return (
		<div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
			<main className="flex min-h-screen w-full max-w-2xl flex-col gap-8 py-10 px-6">
				<nav className="flex items-center justify-between">
					<div>
						<h1 className="text-xl font-semibold text-black dark:text-zinc-50">Mis tareas</h1>
						<p className="text-sm text-zinc-600 dark:text-zinc-400">{userName}</p>
					</div>
					<div className="flex gap-2">
						<a href="/profile" className="rounded-md border px-3 py-2 text-sm text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900">Perfil</a>
						<LogoutButton />
					</div>
				</nav>
				<TodoApp />
			</main>
		</div>
	)
}
