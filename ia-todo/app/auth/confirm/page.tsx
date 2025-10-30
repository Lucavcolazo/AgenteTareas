'use client'

import { useEffect, useState } from 'react'
import { getSupabaseBrowser } from '@/app/lib/supabaseClient'

export default function ConfirmPage() {
	const [message, setMessage] = useState('Confirmando, por favor espera...')
	useEffect(() => {
		async function run() {
			try {
				// Algunos flujos necesitan intercambiar el código por sesión
				await getSupabaseBrowser().auth.getSession()
				setMessage('¡Listo! Tu cuenta fue confirmada. Ya puedes cerrar esta pestaña.')
			} catch {
				setMessage('Revisa tu correo y sigue el enlace de confirmación.')
			}
		}
		run()
	}, [])
	return (
		<div className="flex min-h-screen items-center justify-center p-6 text-center">
			<p className="text-zinc-200">{message}</p>
		</div>
	)
}
