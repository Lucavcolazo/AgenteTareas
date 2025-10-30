'use client'

import { supabase } from '@/app/lib/supabaseClient'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'

export default function UpdatePasswordPage() {
	return (
		<div className="flex min-h-screen items-center justify-center p-6">
			<div className="w-full max-w-md">
				<h1 className="mb-4 text-xl font-semibold">Actualizar contraseña</h1>
				<Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} theme="dark" view="update_password" />
			</div>
		</div>
	)
}
