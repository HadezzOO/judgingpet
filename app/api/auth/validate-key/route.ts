import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const { key } = await request.json()

  if (!key) {
    return NextResponse.json({ error: 'Brak klucza' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('license_keys')
    .select('*')
    .eq('key', key.toUpperCase())
    .eq('is_active', true)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Nieprawidłowy klucz licencyjny' }, { status: 401 })
  }

  if (data.credits_remaining <= 0) {
    return NextResponse.json({ error: 'Brak dostępnych analiz. Kup kolejny pakiet.' }, { status: 403 })
  }

  return NextResponse.json({
    credits_remaining: data.credits_remaining,
    credits_total: data.credits_total,
    package_name: data.package_name,
    email: data.email,
  })
}