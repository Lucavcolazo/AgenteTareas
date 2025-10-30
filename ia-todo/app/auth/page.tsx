'use client'

import { supabase } from '@/app/lib/supabaseClient'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'

export default function AuthPage() {
	return (
		<div className="flex justify-center items-center min-h-screen">
			<Auth
				supabaseClient={supabase}
				appearance={{ theme: ThemeSupa }}
				theme="dark"
				providers={['github', 'google']}
			/>
		</div>
	)
}
