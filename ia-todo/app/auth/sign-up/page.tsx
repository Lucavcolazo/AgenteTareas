'use client'

import { getSupabaseBrowser } from '@/app/lib/supabaseClient'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'

export default function SignUpPage() {
	return (
		<div className="flex min-h-screen items-center justify-center p-6">
			<div className="w-full max-w-md">
				<h1 className="mb-4 text-xl font-semibold">Crear cuenta</h1>
				<Auth 
					supabaseClient={getSupabaseBrowser()} 
					appearance={{ theme: ThemeSupa }} 
					theme="dark" 
					view="sign_up" 
					providers={['google']}
					localization={{
						variables: {
							sign_up: {
								email_label: 'Correo electrónico',
								password_label: 'Contraseña',
								email_input_placeholder: 'tu@correo.com',
								password_input_placeholder: 'Tu contraseña',
								button_label: 'Crear cuenta',
								loading_button_label: 'Creando cuenta...',
								social_provider_text: 'Continuar con {{provider}}',
								link_text: '¿Ya tienes una cuenta? Inicia sesión',
							}
						}
					}}
				/>
			</div>
		</div>
	)
}
