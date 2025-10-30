'use client'

import { supabase } from '@/app/lib/supabaseClient'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'

export default function LoginPage() {
	return (
		<div className="flex min-h-screen items-center justify-center p-6">
			<div className="w-full max-w-md">
				<h1 className="mb-4 text-xl font-semibold">Iniciar sesión</h1>
				<Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} theme="dark" view="sign_in" providers={['github', 'google']} />
			</div>
		</div>
	)
}
