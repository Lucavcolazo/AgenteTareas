'use client'

import { getSupabaseBrowser } from '@/app/lib/supabaseClient'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'

export default function ForgotPasswordPage() {
	return (
		<div className="flex min-h-screen items-center justify-center p-6">
			<div className="w-full max-w-md">
				<h1 className="mb-4 text-xl font-semibold">Recuperar contraseña</h1>
				<Auth 
					supabaseClient={getSupabaseBrowser()} 
					appearance={{ theme: ThemeSupa }} 
					theme="dark" 
					view="forgotten_password"
					localization={{
						variables: {
							forgotten_password: {
								email_label: 'Correo electrónico',
								email_input_placeholder: 'tu@correo.com',
								button_label: 'Enviar enlace de recuperación',
								loading_button_label: 'Enviando...',
								link_text: 'Volver al inicio de sesión',
							}
						}
					}}
				/>
			</div>
		</div>
	)
}
