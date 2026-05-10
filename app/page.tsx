// @ts-nocheck
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { T, LANG_NAMES, Lang } from '@/lib/translations'

export default function Home() {
  const [key, setKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lang, setLang] = useState<Lang | null>(null)
  const router = useRouter()

  const handleLogin = async () => {
    const trimmed = key.trim().toUpperCase()
    if (!trimmed || !lang) return
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Invalid key'); return }
      sessionStorage.setItem('license_key', trimmed)
      sessionStorage.setItem('license_data', JSON.stringify(data))
      sessionStorage.setItem('lang', lang)
      router.push('/dashboard')
    } catch { setError('Connection error.') }
    finally { setLoading(false) }
  }

  const t = lang ? T[lang] : null

  // STEP 1: Language selection popup
  if (!lang) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{background: 'radial-gradient(ellipse at top, #1a1a1a 0%, #0a0a0a 100%)'}}>
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <Image src="/logo.png" alt="JudgingPet" width={140} height={140} className="mx-auto mb-3" />
          </div>
          <div className="rounded-2xl p-6" style={{background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,140,0,0.2)'}}>
            <h2 className="text-white font-semibold text-center mb-1">Select your language</h2>
            <p className="text-center text-sm mb-5" style={{color: 'rgba(255,255,255,0.4)'}}>Wybierz język / Choose language</p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(LANG_NAMES) as Lang[]).map(l => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className="rounded-xl py-3 px-4 text-sm font-medium text-white transition-all text-left"
                  style={{background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,140,0,0.15)'}}
                >
                  {LANG_NAMES[l]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // STEP 2: Login
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{background: 'radial-gradient(ellipse at top, #1a1a1a 0%, #0a0a0a 100%)'}}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image src="/logo.png" alt="JudgingPet" width={160} height={160} className="mx-auto mb-2" />
          <p className="text-sm" style={{color: 'rgba(255,255,255,0.4)'}}>{t!.tagline}</p>
        </div>
        <div className="rounded-2xl p-8" style={{background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,140,0,0.2)'}}>
          <h2 className="text-xl font-semibold text-white mb-1">{t!.enterKey}</h2>
          <p className="text-sm mb-6" style={{color: 'rgba(255,255,255,0.5)'}}>{t!.keyDesc}</p>
          <div className="space-y-4">
            <input
              type="text"
              value={key}
              onChange={e => setKey(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder={t!.keyPlaceholder}
              className="w-full rounded-xl px-4 py-3 text-center text-lg tracking-widest text-white focus:outline-none"
              style={{background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,140,0,0.25)'}}
            />
            {error && (
              <div className="rounded-xl px-4 py-3 text-sm text-center" style={{background: 'rgba(255,60,60,0.08)', border: '1px solid rgba(255,60,60,0.2)', color: '#ff8080'}}>
                {error}
              </div>
            )}
            <button
              onClick={handleLogin}
              disabled={loading || !key.trim()}
              className="w-full text-white font-bold rounded-xl py-3 transition disabled:opacity-40"
              style={{background: 'linear-gradient(135deg, #ff8c00, #ff6000)'}}
            >
              {loading ? t!.verifying : t!.enter}
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm" style={{color: 'rgba(255,255,255,0.3)'}}>
            {t!.noKey}{' '}
            <a href="https://judgingpet.com/" style={{color: '#ff8c00'}} target="_blank">{t!.buyPackage}</a>
          </p>
          <button onClick={() => setLang(null)} className="text-xs px-3 py-1.5 rounded-lg" style={{color: 'rgba(255,140,0,0.6)', border: '1px solid rgba(255,140,0,0.15)'}}>
            {LANG_NAMES[lang]}
          </button>
        </div>
      </div>
    </div>
  )
}