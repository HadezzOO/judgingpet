// @ts-nocheck
'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { T, Lang } from '@/lib/translations'

interface LicenseData {
  credits_remaining: number
  credits_total: number
  package_name: string
}

const TIMEZONES = ['CET (Europa Środkowa)', 'UTC', 'GMT+1', 'GMT+2', 'GMT+3', 'EST', 'PST', 'BST']

export default function Dashboard() {
  const router = useRouter()
  const [licenseData, setLicenseData] = useState<LicenseData | null>(null)
  const [licenseKey, setLicenseKey] = useState('')
  const [lang, setLang] = useState<Lang>('pl')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState('')
  const [matchDate, setMatchDate] = useState('')
  const [matchTime, setMatchTime] = useState('')
  const [matchTimezone, setMatchTimezone] = useState('CET (Europa Środkowa)')
  const [result, setResult] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const [agreed, setAgreed] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const key = sessionStorage.getItem('license_key')
    const data = sessionStorage.getItem('license_data')
    const savedLang = sessionStorage.getItem('lang') as Lang
    if (!key || !data) { router.push('/'); return }
    setLicenseKey(key)
    setLicenseData(JSON.parse(data))
    if (savedLang) setLang(savedLang)
  }, [router])

  const t = T[lang]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setScreenshot(file)
    setScreenshotPreview(URL.createObjectURL(file))
    setAgreed(false)
  }

  const handleAnalyze = async () => {
    if (!screenshot) { setError(String(t.errNoScreenshot)); return }
if (!matchDate || !matchTime) { setError(String(t.errNoDate)); return }
if (!agreed) { setError(String(t.errNoAgree)); return }
if (!licenseData || licenseData.credits_remaining <= 0) { setError(String(t.errNoCredits)); return }
    setAnalyzing(true); setError(''); setResult('')
    try {
      const formData = new FormData()
      formData.append('license_key', licenseKey)
      formData.append('screenshot', screenshot)
      formData.append('match_date', matchDate)
      formData.append('match_time', matchTime)
      formData.append('match_timezone', matchTimezone)
      formData.append('lang', lang)
      const res = await fetch('/api/analyze', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Błąd'); return }
      setResult(data.result)
      const updated = { ...licenseData, credits_remaining: licenseData.credits_remaining - 1 }
      setLicenseData(updated)
      sessionStorage.setItem('license_data', JSON.stringify(updated))
      setAgreed(false)
   } catch { setError(String(t.errConnection)) }
    finally { setAnalyzing(false) }
  }

  if (!licenseData) return (
    <div className="min-h-screen flex items-center justify-center" style={{background: '#0a0a0a'}}>
      <div className="text-white">{t.loading}</div>
    </div>
  )

  const usedCredits = licenseData.credits_total - licenseData.credits_remaining
  const progressPct = licenseData.credits_total > 0 ? (licenseData.credits_remaining / licenseData.credits_total) * 100 : 0

  return (
    <div className="min-h-screen text-white" style={{background: 'radial-gradient(ellipse at top, #1a1a1a 0%, #0a0a0a 100%)'}}>
      <header style={{borderBottom: '1px solid rgba(255,140,0,0.2)', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50}}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Image src="/logo.png" alt="JudgingPet" width={110} height={44} style={{height: '40px', width: 'auto', objectFit: 'contain'}} />
          <div className="flex items-center gap-3">
            <span className="text-xs px-2 py-1 rounded" style={{color: 'rgba(255,140,0,0.8)', background: 'rgba(255,140,0,0.08)', border: '1px solid rgba(255,140,0,0.15)'}}>{licenseData.package_name || 'Standard'}</span>
            <span className="text-xs hidden sm:block text-white opacity-40">{licenseKey}</span>
            <button onClick={() => { sessionStorage.clear(); router.push('/') }} className="text-xs px-3 py-1.5 rounded-lg" style={{color: '#ff8c00', border: '1px solid rgba(255,140,0,0.3)'}}>{t.logout}</button>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 pb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{background: licenseData.credits_remaining > 0 ? '#ff8c00' : '#555', boxShadow: licenseData.credits_remaining > 0 ? '0 0 8px #ff8c00' : 'none'}}/>
              <span className="text-sm font-bold" style={{color: '#ff8c00'}}>{licenseData.credits_remaining} {t.available}</span>
            </div>

          </div>
          <div className="w-full rounded-full overflow-hidden" style={{height: '3px', background: 'rgba(255,255,255,0.06)'}}>
            <div style={{width: `${progressPct}%`, height: '100%', background: 'linear-gradient(90deg, #ff6000, #ff8c00)', boxShadow: '0 0 8px rgba(255,140,0,0.5)', borderRadius: '999px', transition: 'width 0.5s'}}/>
          </div>
          <p className="text-xs mt-1.5 text-white opacity-60">{t.used} {usedCredits} {t.of} {licenseData.credits_total} {t.inPackage}</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="rounded-2xl p-6 space-y-6" style={{background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,140,0,0.12)'}}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{background: 'rgba(255,140,0,0.1)', border: '1px solid rgba(255,140,0,0.2)'}}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ff8c00" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <h2 className="text-lg font-semibold text-white">{t.newAnalysis}</h2>
          </div>

          {/* Screenshot */}
          <div>
            <label className="block text-sm font-medium mb-2 text-white">{t.addScreenshot}</label>
            <div onClick={() => fileRef.current?.click()} className="rounded-xl p-5 text-center cursor-pointer transition-all" style={{border: `2px dashed ${screenshot ? 'rgba(255,140,0,0.4)' : 'rgba(255,255,255,0.1)'}`, background: screenshot ? 'rgba(255,140,0,0.03)' : 'transparent'}}>
              {screenshotPreview ? (
                <div className="space-y-2">
                  <img src={screenshotPreview} alt="Preview" className="max-h-40 mx-auto rounded-lg" />
                  <p className="text-xs" style={{color: 'rgba(255,140,0,0.6)'}}>{t.clickToChange}</p>
                </div>
              ) : (
                <div className="space-y-2 py-2">
                  <svg className="mx-auto" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <p className="text-white opacity-40">{t.clickToAdd}</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </div>

          {/* Date/Time */}
          <div>
            <label className="block text-sm font-medium mb-3 text-white">{t.dateTime}</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: t.date, node: <input type="date" value={matchDate} onChange={e => setMatchDate(e.target.value)} className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none" style={{background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,140,0,0.2)', colorScheme: 'dark'}} /> },
                { label: t.time, node: <input type="time" value={matchTime} onChange={e => setMatchTime(e.target.value)} className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none" style={{background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,140,0,0.2)', colorScheme: 'dark'}} /> },
                { label: t.timezone, node: <select value={matchTimezone} onChange={e => setMatchTimezone(e.target.value)} className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none" style={{background: 'rgba(20,20,20,0.95)', border: '1px solid rgba(255,140,0,0.2)'}}>{TIMEZONES.map(tz => <option key={tz} value={tz} style={{background: '#1a1a1a'}}>{tz}</option>)}</select> },
              ].map((item, i) => (
                <div key={i}>
                  <label className="block text-xs mb-1.5 text-white opacity-50">{item.label}</label>
                  {item.node}
                </div>
              ))}
            </div>
          </div>

          {/* Checkbox */}
          {screenshot && (
            <div onClick={() => setAgreed(!agreed)} className="rounded-xl p-4 cursor-pointer transition-all" style={{background: agreed ? 'rgba(255,140,0,0.05)' : 'rgba(255,255,255,0.02)', border: `1px solid ${agreed ? 'rgba(255,140,0,0.25)' : 'rgba(255,255,255,0.07)'}`}}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded flex items-center justify-center transition-all" style={{background: agreed ? '#ff8c00' : 'transparent', border: `2px solid ${agreed ? '#ff8c00' : 'rgba(255,255,255,0.25)'}`}}>
                  {agreed && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <p className="text-xs leading-relaxed text-white opacity-70">{t.confirm}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl px-4 py-3 text-sm flex items-center gap-2" style={{background: 'rgba(255,60,60,0.08)', border: '1px solid rgba(255,60,60,0.2)', color: '#ff8080'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={analyzing || !screenshot || !agreed || !matchDate || !matchTime || licenseData.credits_remaining <= 0}
            className="w-full text-white font-bold rounded-xl py-4 text-base flex items-center justify-center gap-2 transition-all disabled:opacity-40"
            style={{background: 'linear-gradient(135deg, #ff8c00, #ff6000)', boxShadow: (!screenshot || !agreed || analyzing) ? 'none' : '0 4px 24px rgba(255,140,0,0.25)'}}
          >
            {analyzing ? (
              <><svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>{t.analyzing}</>
            ) : (
              <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>{t.analyzeBtn} <span className="opacity-60 text-sm">({t.minusOne})</span></>
            )}
          </button>

          {/* Tips */}
          <div className="rounded-xl p-4" style={{background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)'}}>
            <div className="flex items-center gap-2 mb-3">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,140,0,0.7)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span className="text-xs font-medium" style={{color: 'rgba(255,140,0,0.8)'}}>{t.howTo}</span>
            </div>
            {(t.tips as unknown as string[]).map((tip: string, i: number) => (
              <div key={i} className="flex items-start gap-2 mb-1.5">
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{background: 'rgba(255,140,0,0.4)'}}/>
                <p className="text-xs text-white opacity-60">{tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="rounded-2xl overflow-hidden" style={{border: '1px solid rgba(255,140,0,0.2)'}}>
            <div className="px-6 py-4 flex items-center gap-3" style={{background: 'rgba(255,140,0,0.08)', borderBottom: '1px solid rgba(255,140,0,0.15)'}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff8c00" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              <h3 className="font-semibold text-white">{t.result}</h3>
            </div>
            <div className="p-6 space-y-5" style={{background: 'rgba(255,140,0,0.03)'}}>
              {result.split('\n\n').map((block, i) => {
                const isPlace = block.includes('MIEJSCE') || block.includes('LOCATION') || block.includes('ORT') || block.includes('MÍSTO') || block.includes('HELYSZÍN') || block.includes('МІСЦЕ') || block.includes('МЕСТО') || block.includes('📍')
                const isMath = block.includes('ANALIZ') || block.includes('MATH') || block.includes('STATIST') || block.includes('📊')
                const isVerdict = block.includes('WERDYKT') || block.includes('VERDICT') || block.includes('ERGEBNIS') || block.includes('ZÁVĚR') || block.includes('EREDMÉNY') || block.includes('ВЕРДИКТ') || block.includes('🎯')
                const color = isVerdict ? '#fbbf24' : isMath ? '#4ade80' : isPlace ? '#ff8c00' : 'white'
                const lines = block.split('\n')
                const hasHeader = isPlace || isMath || isVerdict
                return (
                  <div key={i}>
                    {hasHeader && (
                      <div className="flex items-center gap-2 mb-2">
                        {isPlace && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>}
                        {isMath && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>}
                        {isVerdict && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>}
                        <span className="text-sm font-semibold" style={{color}}>{lines[0].replace(/[📍📊🎯]/g, '').trim()}</span>
                      </div>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-white" style={{opacity: 0.9, paddingLeft: hasHeader ? '22px' : '0'}}>
                      {hasHeader ? lines.slice(1).join('\n') : block}
                    </p>
                  </div>
                )
              })}
              <div className="flex items-start gap-2 pt-3" style={{borderTop: '1px solid rgba(255,255,255,0.05)'}}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" className="mt-0.5 flex-shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <p className="text-xs text-white opacity-40">{t.disclaimer}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}