import { NextResponse } from 'next/server'
import { supabaseServer } from '@/app/lib/supabaseServer'

export async function GET() {
	const supabase = await supabaseServer()
	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser()
	if (userError || !user) return NextResponse.json([], { status: 200 })

	const { data, error } = await supabase
		.from('tasks')
		.select('*')
		.eq('user_id', user.id)
		.order('created_at', { ascending: false })

	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
	const { title } = await request.json()
	if (!title || typeof title !== 'string') {
		return NextResponse.json({ error: 'Título requerido' }, { status: 400 })
	}
	const supabase = await supabaseServer()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

	const { data, error } = await supabase
		.from('tasks')
		.insert({ title, user_id: user.id, completed: false })
		.select()
		.single()

	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json(data, { status: 201 })
}

export async function PATCH(request: Request) {
	const body = await request.json()
	const { id, completed, title } = body
	if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
	const supabase = await supabaseServer()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

	const update: Record<string, any> = {}
	if (typeof completed !== 'undefined') update.completed = Boolean(completed)
	if (typeof title === 'string') update.title = title
	if (Object.keys(update).length === 0) {
		return NextResponse.json({ error: 'Nada para actualizar' }, { status: 400 })
	}

	const { data, error } = await supabase
		.from('tasks')
		.update(update)
		.eq('id', id)
		.eq('user_id', user.id)
		.select()
		.single()

	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json(data)
}

export async function DELETE(request: Request) {
	const { searchParams } = new URL(request.url)
	const id = searchParams.get('id')
	if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
	const supabase = await supabaseServer()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

	const { error } = await supabase
		.from('tasks')
		.delete()
		.eq('id', id)
		.eq('user_id', user.id)

	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ ok: true })
}
