'use client'

import { getSupabaseBrowser } from '@/app/lib/supabaseClient'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'

export default function AuthPage() {
	return (
		<div className="flex justify-center items-center min-h-screen">
			<Auth
				supabaseClient={getSupabaseBrowser()}
				appearance={{ theme: ThemeSupa }}
				theme="dark"
				providers={['google']}
				localization={{
					variables: {
						sign_in: {
							email_label: 'Correo electrónico',
							password_label: 'Contraseña',
							email_input_placeholder: 'tu@correo.com',
							password_input_placeholder: 'Tu contraseña',
							button_label: 'Iniciar sesión',
							loading_button_label: 'Iniciando sesión...',
							social_provider_text: 'Continuar con {{provider}}',
						},
						sign_up: {
							email_label: 'Correo electrónico',
							password_label: 'Contraseña',
							email_input_placeholder: 'tu@correo.com',
							password_input_placeholder: 'Tu contraseña',
							button_label: 'Crear cuenta',
							loading_button_label: 'Creando cuenta...',
							social_provider_text: 'Continuar con {{provider}}',
							link_text: '¿No tienes cuenta? Regístrate',
						}
					}
				}}
			/>
		</div>
	)
}
