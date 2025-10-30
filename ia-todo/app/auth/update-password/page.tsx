'use client'

import { getSupabaseBrowser } from '@/app/lib/supabaseClient'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'

export default function UpdatePasswordPage() {
	return (
		<div className="flex min-h-screen items-center justify-center p-6">
			<div className="w-full max-w-md">
				<h1 className="mb-4 text-xl font-semibold">Actualizar contraseña</h1>
				<Auth 
					supabaseClient={getSupabaseBrowser()} 
					appearance={{ theme: ThemeSupa }} 
					theme="dark" 
					view="update_password"
					localization={{
						variables: {
							update_password: {
								password_label: 'Nueva contraseña',
								password_input_placeholder: 'Tu nueva contraseña',
								button_label: 'Actualizar contraseña',
								loading_button_label: 'Actualizando...',
							}
						}
					}}
				/>
			</div>
		</div>
	)
}
