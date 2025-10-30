'use client'

import { supabase } from '@/app/lib/supabaseClient'

export default function LogoutButton() {
	async function handleLogout() {
		await supabase.auth.signOut()
		window.location.href = '/auth'
	}
	return (
		<button
			onClick={handleLogout}
			className="rounded-md border px-3 py-2 text-sm text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
		>
			Cerrar sesión
		</button>
	)
}
