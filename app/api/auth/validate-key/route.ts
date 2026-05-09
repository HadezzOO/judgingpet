import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const { key } = await request.json()

  if (!key) {
    return NextResponse.json({ error: 'Brak klucza' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('license_keys')
    .select('*')
    .eq('key', key.trim().toUpperCase())
    .single()

  if (error || !data) {
    return NextResponse.json({ error: `Błąd: ${error?.message || 'Nie znaleziono'}` }, { status: 401 })
  }

  if (!data.is_active) {
    return NextResponse.json({ error: 'Klucz nieaktywny' }, { status: 403 })
  }

  if (data.credits_remaining <= 0) {
    return NextResponse.json({ error: 'Brak analiz' }, { status: 403 })
  }

  return NextResponse.json({
    credits_remaining: data.credits_remaining,
    credits_total: data.credits_total,
    package_name: data.package_name,
    email: data.email,
  })
}