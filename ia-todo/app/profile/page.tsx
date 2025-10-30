import { supabaseServer } from '@/app/lib/supabaseServer'

export default async function ProfilePage() {
	const supabase = await supabaseServer()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	if (!user) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<p className="text-zinc-600 dark:text-zinc-400">No has iniciado sesión.</p>
			</div>
		)
	}

	return (
		<div className="mx-auto max-w-xl p-6">
			<h1 className="mb-4 text-2xl font-semibold text-black dark:text-zinc-50">Perfil</h1>
			<div className="space-y-2 text-sm">
				<p><span className="font-medium">ID:</span> {user.id}</p>
				<p><span className="font-medium">Email:</span> {user.email}</p>
				<p><span className="font-medium">Nombre:</span> {(user.user_metadata as any)?.full_name || '-'}</p>
			</div>
			<div className="mt-6">
				<a href="/" className="rounded-md border px-3 py-2 text-sm">Volver</a>
			</div>
		</div>
	)
}
