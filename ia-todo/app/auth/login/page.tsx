'use client'

import { getSupabaseBrowser } from '@/app/lib/supabaseClient'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useEffect } from 'react'

export default function LoginPage() {
    useEffect(() => {
        const supabase = getSupabaseBrowser()
        let isMounted = true
        ;(async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!isMounted) return
            if (session) window.location.replace('/')
        })()
        const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_IN') {
                window.location.replace('/')
            }
        })
        return () => {
            isMounted = false
            subscription.subscription.unsubscribe()
        }
    }, [])
	return (
		<div className="flex min-h-screen items-center justify-center p-6">
			<div className="w-full max-w-md">
				<h1 className="mb-4 text-xl font-semibold">Iniciar sesión</h1>
				<Auth 
					supabaseClient={getSupabaseBrowser()} 
					appearance={{ theme: ThemeSupa }} 
					theme="dark" 
					view="sign_in" 
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
								link_text: '¿Ya tienes una cuenta? Inicia sesión',
							}
						}
					}}
				/>
			</div>
		</div>
	)
}
