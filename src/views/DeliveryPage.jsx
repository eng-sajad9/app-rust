import React, { useState, useEffect, useRef } from 'react'
import { redeemDeliveryToken, markTokenAsUsed } from '../utils/supabaseClient'
import {
  KeyRound, Copy, Check, AlertTriangle, Clock, Loader2,
  ShieldCheck, ChevronLeft, RefreshCw, Info
} from 'lucide-react'

export default function DeliveryPage({ token: urlToken }) {
  const [stage, setStage] = useState('enter') // 'enter' | 'loading' | 'ready' | 'copied' | 'error'
  const [inputToken, setInputToken] = useState(urlToken ? formatToken(urlToken) : '')
  const [licenseData, setLicenseData] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [countdown, setCountdown] = useState(null)
  const [copied, setCopied] = useState(false)
  const inputRef = useRef(null)
  const timerRef = useRef(null)

  // Auto-fetch if token came from URL
  useEffect(() => {
    if (urlToken) {
      handleFetchLicense(urlToken)
    } else {
      inputRef.current?.focus()
    }
  }, [])

  // Expiry countdown
  useEffect(() => {
    if (!licenseData?.expiresAt) return
    const tick = () => {
      const diff = new Date(licenseData.expiresAt) - new Date()
      if (diff <= 0) {
        setStage('error')
        setErrorMsg('انتهت صلاحية الرمز')
        clearInterval(timerRef.current)
        return
      }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setCountdown(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
    }
    tick()
    timerRef.current = setInterval(tick, 1000)
    return () => clearInterval(timerRef.current)
  }, [licenseData])

  function formatToken(raw) {
    const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (clean.length >= 4) return clean.slice(0, 4) + '-' + clean.slice(4)
    return clean
  }

  const handleInputChange = (e) => {
    const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '')
    let formatted = raw.replace(/-/g, '')
    if (formatted.length > 4) {
      formatted = formatted.slice(0, 4) + '-' + formatted.slice(4, 8)
    }
    setInputToken(formatted)
  }

  const handleFetchLicense = async (rawToken) => {
    const tokenToUse = rawToken || inputToken
    if (!tokenToUse || tokenToUse.replace('-', '').length < 8) {
      setErrorMsg('يرجى إدخال الرمز كاملاً (8 أحرف)')
      return
    }
    setStage('loading')
    setErrorMsg('')
    try {
      const data = await redeemDeliveryToken(tokenToUse)
      setLicenseData(data)
      setStage('ready')
    } catch (err) {
      setStage('error')
      setErrorMsg(err.message)
    }
  }

  const handleCopy = async () => {
    if (!licenseData?.licenseKey) return
    try {
      await navigator.clipboard.writeText(licenseData.licenseKey)
      setCopied(true)
      setStage('copied')
      await markTokenAsUsed(licenseData.token)
      setTimeout(() => setCopied(false), 3000)
    } catch {
      const el = document.createElement('textarea')
      el.value = licenseData.licenseKey
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setStage('copied')
      await markTokenAsUsed(licenseData.token)
    }
  }

  const handleReset = () => {
    setStage('enter')
    setInputToken('')
    setLicenseData(null)
    setErrorMsg('')
    setCopied(false)
    setCountdown(null)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  return (
    <div
      className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center p-4"
      dir="rtl"
    >
      <div className="relative w-full max-w-lg space-y-4">
        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto shadow-md">
            <KeyRound className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">بوابة استلام رمز التفعيل</h1>
          <p className="text-xs text-slate-400">
            أدخل الرمز الذي أعطاك إياه فريق الدعم الفني
          </p>
        </div>

        {/* Stage: Enter Token */}
        {(stage === 'enter' || stage === 'error') && (
          <div className="bg-[#0c1427] p-6 rounded-2xl border border-slate-800/80 space-y-5">
            <div className="space-y-3">
              <label className="block text-slate-300 font-semibold text-xs text-center">
                رمز الاستلام (8 أحرف)
              </label>

              <input
                ref={inputRef}
                type="text"
                value={inputToken}
                onChange={handleInputChange}
                placeholder="XXXX-XXXX"
                maxLength={9}
                className="w-full text-center text-3xl font-bold font-mono tracking-[0.3em] bg-slate-900 border border-slate-700/80 focus:border-blue-500 rounded-xl px-4 py-4 text-blue-300 uppercase outline-none transition-all placeholder:text-slate-700 dir-ltr"
                onKeyDown={(e) => e.key === 'Enter' && handleFetchLicense()}
                autoComplete="off"
                spellCheck="false"
              />

              {stage === 'error' && errorMsg && (
                <div className="flex items-center gap-2 p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold animate-fade-in">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                onClick={() => handleFetchLicense()}
                disabled={inputToken.replace('-', '').length < 8}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" />
                استلام رمز التفعيل
              </button>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-start gap-2">
              <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-400 leading-relaxed">
                الرمز مكوّن من 8 أحرف وأرقام (مثال: <span className="font-mono text-slate-300 font-bold">XKPQ-R7MN</span>). أحرف كبيرة فقط. صالح لمدة 24 ساعة واستخدام واحد فقط.
              </p>
            </div>
          </div>
        )}

        {/* Stage: Loading */}
        {stage === 'loading' && (
          <div className="bg-[#0c1427] p-10 rounded-2xl text-center border border-slate-800/80 space-y-4">
            <Loader2 className="w-10 h-10 text-blue-400 animate-spin mx-auto" />
            <p className="text-white font-bold text-base">جارٍ التحقق من الرمز...</p>
            <p className="text-slate-400 text-xs">يتم التواصل مع السيرفر</p>
          </div>
        )}

        {/* Stage: Ready / Copied */}
        {(stage === 'ready' || stage === 'copied') && licenseData && (
          <div className="space-y-4 animate-fade-in">
            {/* Restaurant Info */}
            <div className="bg-[#0c1427] p-5 rounded-2xl border border-slate-800/80 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm leading-tight">{licenseData.restaurantName}</p>
                <p className="text-[11px] font-mono text-slate-400 truncate mt-0.5 dir-ltr text-right">{licenseData.hardwareId}</p>
              </div>
              {countdown && (
                <div className="text-right shrink-0">
                  <div className="text-[10px] text-slate-400 font-semibold">تنتهي خلال</div>
                  <div className="font-mono text-amber-400 font-bold text-xs tabular-nums">{countdown}</div>
                </div>
              )}
            </div>

            {/* License Key Box */}
            <div className="bg-[#0c1427] p-6 rounded-2xl border border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-blue-400" />
                  رمز التفعيل الخاص بكم
                </h2>
                <span className="text-[10px] text-slate-400 font-mono">
                  {stage === 'copied' ? 'تم النسخ' : 'اضغط لنسخه'}
                </span>
              </div>

              {/* Key Display */}
              <div
                onClick={handleCopy}
                className={`relative cursor-pointer select-all bg-slate-950 rounded-xl p-4 border transition-all ${
                  stage === 'copied'
                    ? 'border-emerald-500/60 bg-emerald-950/20'
                    : 'border-slate-800 hover:border-blue-500/50'
                }`}
              >
                <p className="font-mono text-blue-300 text-xs break-all leading-loose dir-ltr text-left select-all">
                  {licenseData.licenseKey}
                </p>
              </div>

              {/* Copy Button */}
              <button
                onClick={handleCopy}
                className={`w-full py-3.5 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 ${
                  stage === 'copied'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
              >
                {stage === 'copied' ? (
                  <><Check className="w-5 h-5" /><span>تم النسخ بنجاح!</span></>
                ) : (
                  <><Copy className="w-5 h-5" /><span>انسخ رمز التفعيل</span></>
                )}
              </button>

              {stage === 'copied' && (
                <div className="p-4 bg-emerald-950/40 border border-emerald-500/25 rounded-xl text-xs text-emerald-400 font-semibold text-center animate-fade-in space-y-1">
                  <p>تم نسخ الرمز إلى الحافظة</p>
                  <p className="text-[11px] text-emerald-400/80 font-normal">الآن افتح تطبيق إدارة المطعم وألصق الرمز في حقل التفعيل</p>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-[#0c1427] p-5 rounded-2xl border border-slate-800/80 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-400" />
                كيفية استخدام رمز التفعيل:
              </h3>
              <ol className="space-y-2">
                {[
                  'اضغط على زر "انسخ رمز التفعيل" أعلاه',
                  'افتح تطبيق إدارة المطعم على هذا الجهاز',
                  'في شاشة التفعيل، الصق الرمز في الخانة المخصصة (Ctrl+V)',
                  'اضغط تفعيل واستمتع بالنظام!',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-slate-400">
                    <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {/* Reset */}
            <button
              onClick={handleReset}
              className="w-full text-xs text-slate-500 hover:text-slate-300 transition py-2 flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              إدخال رمز مختلف
            </button>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-[10px] text-slate-500 pb-4">
          بوابة تسليم التراخيص الآمنة — مدعومة بـ Supabase
        </p>
      </div>
    </div>
  )
}

