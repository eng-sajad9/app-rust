import React, { useState } from 'react'
import { KeyRound, Copy, Check, ShieldCheck, Sparkles, AlertCircle, AlertTriangle, X, Share2, QrCode, Loader2, ExternalLink, PhoneCall } from 'lucide-react'
import { generateLicenseKey, parseLicenseKey } from '../utils/cryptoLicense'
import { useToast } from '../components/Toast'
import { createDeliveryToken } from '../utils/supabaseClient'

export default function KeyGeneratorTab({ onAddDevice }) {
  const toast = useToast()
  const [hardwareId, setHardwareId] = useState('')
  const [restaurantName, setRestaurantName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [phone, setPhone] = useState('')
  const [duration, setDuration] = useState('1year')

  const [generatedKey, setGeneratedKey] = useState('')
  const [copied, setCopied] = useState(false)
  const [justGenerated, setJustGenerated] = useState(null)

  // Delivery Token
  const [deliveryModal, setDeliveryModal] = useState(false)
  const [deliveryToken, setDeliveryToken] = useState(null)
  const [deliveryLoading, setDeliveryLoading] = useState(false)
  const [deliveryCopied, setDeliveryCopied] = useState(false)
  const [deliveryUrlCopied, setDeliveryUrlCopied] = useState(false)

  // Token Decoder
  const [testKeyInput, setTestKeyInput] = useState('')
  const [testResult, setTestResult] = useState(null)
  const [testError, setTestError] = useState(false)

  const calculateExpiryDate = (dur) => {
    const now = new Date()
    if (dur === '1month') { now.setMonth(now.getMonth() + 1); return now.toISOString().split('T')[0] }
    if (dur === '6months') { now.setMonth(now.getMonth() + 6); return now.toISOString().split('T')[0] }
    if (dur === '1year') { now.setFullYear(now.getFullYear() + 1); return now.toISOString().split('T')[0] }
    if (dur === '2years') { now.setFullYear(now.getFullYear() + 2); return now.toISOString().split('T')[0] }
    if (dur === 'unlimited') return '2035-12-31'
    return '2030-12-31'
  }

  const handleGenerate = async (e) => {
    e.preventDefault()
    if (!hardwareId.trim()) {
      toast.warning('يرجى إدخال الـ Hardware ID')
      return
    }

    const expiry = calculateExpiryDate(duration)
    const key = generateLicenseKey({ restaurantName, expiryDate: expiry, hardwareId })
    setGeneratedKey(key)
    setJustGenerated({ restaurantName, expiryDate: expiry, hardwareId, ownerName, phone })

    if (onAddDevice) {
      onAddDevice({
        restaurantName,
        hardwareId: hardwareId.trim().toUpperCase(),
        ownerName,
        phone,
        expiryDate: expiry,
        status: 'active',
        killSwitch: false,
        employeesCount: 0,
        driversCount: 0,
        lastPing: 'تم الإصدار الآن',
      })
    }
    toast.success(`تم إصدار مفتاح تفعيل لـ "${restaurantName}"`)
  }

  const handleCopy = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey)
      setCopied(true)
      toast.info('تم نسخ مفتاح التفعيل إلى الحافظة')
      setTimeout(() => setCopied(false), 2500)
    }
  }

  const handleCreateDeliveryToken = async () => {
    if (!generatedKey || !justGenerated) {
      toast.warning('يرجى توليد المفتاح أولاً قبل إنشاء رمز التسليم')
      return
    }
    setDeliveryLoading(true)
    try {
      const token = await createDeliveryToken(generatedKey, justGenerated.hardwareId, justGenerated.restaurantName)
      setDeliveryToken(token)
      setDeliveryModal(true)
      toast.success(`تم إنشاء رمز التسليم: ${token}`)
    } catch (err) {
      toast.error('فشل إنشاء رمز التسليم: ' + err.message)
    } finally {
      setDeliveryLoading(false)
    }
  }

  const [customDomain, setCustomDomain] = useState(() => localStorage.getItem('delivery_custom_domain') || '')

  const handleCustomDomainChange = (e) => {
    const val = e.target.value
    setCustomDomain(val)
    localStorage.setItem('delivery_custom_domain', val)
  }

  const getDeliveryUrl = (token) => {
    let base = window.location.origin + window.location.pathname
    if (customDomain.trim()) {
      base = customDomain.trim().replace(/\/+$/, '')
    }
    return `${base}?deliver=${token}`
  }

  const handleCopyDeliveryUrl = () => {
    navigator.clipboard.writeText(getDeliveryUrl(deliveryToken))
    setDeliveryUrlCopied(true)
    setTimeout(() => setDeliveryUrlCopied(false), 2500)
  }

  const handleCopyTokenOnly = () => {
    navigator.clipboard.writeText(deliveryToken)
    setDeliveryCopied(true)
    toast.info('تم نسخ الرمز')
    setTimeout(() => setDeliveryCopied(false), 2500)
  }

  const getQrUrl = (token) => {
    const url = encodeURIComponent(getDeliveryUrl(token))
    return `https://api.qrserver.com/v1/create-qr-code/?data=${url}&size=200x200&bgcolor=020617&color=818cf8&format=png&qzone=2`
  }

  const handleTestKey = () => {
    if (!testKeyInput.trim()) return
    try {
      const res = parseLicenseKey(testKeyInput.trim())
      if (res && res.restaurantName) {
        setTestResult(res)
        setTestError(false)
      } else {
        setTestResult(null)
        setTestError(true)
      }
    } catch {
      setTestResult(null)
      setTestError(true)
    }
  }

  const durations = [
    { id: '1month', label: 'شهر' },
    { id: '6months', label: '6 أشهر' },
    { id: '1year', label: 'سنة' },
    { id: '2years', label: 'سنتان' },
    { id: 'unlimited', label: 'دائم' },
  ]

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-[#0c1427] p-6 rounded-2xl border border-slate-800/80 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">مولد مفاتيح التفعيل المشفرة</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              إصدار ترخيص مشفر مربوط بـ Hardware ID الجهاز — يُضاف تلقائياً لقاعدة البيانات
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-[#0c1427] p-6 rounded-2xl border border-slate-800/80 space-y-5">
          <h3 className="text-xs font-bold text-white pb-3 border-b border-slate-800/80 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>بيانات الترخيص والجهاز</span>
          </h3>

          <form onSubmit={handleGenerate} className="space-y-4 text-xs">
            {/* Hardware ID */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                Hardware ID الجهاز <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={hardwareId}
                onChange={(e) => setHardwareId(e.target.value.toUpperCase())}
                placeholder="مثال: E213-7924-1806-B6BD"
                className="w-full bg-slate-900 border border-slate-700/80 focus:border-blue-500 rounded-xl px-4 py-3 font-mono text-blue-300 font-bold text-sm dir-ltr focus:outline-none"
                required
              />
              <p className="text-[10px] text-slate-400 mt-1 font-mono">
                يمكن الحصول عليه من التطبيق في شاشة التفعيل أو إعدادات النظام
              </p>
            </div>

            {/* Restaurant Name */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">اسم المطعم <span className="text-rose-400">*</span></label>
              <input
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                placeholder="اسم المطعم أو المنشأة..."
                className="w-full bg-slate-900 border border-slate-700/80 focus:border-blue-500 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none"
                required
              />
            </div>

            {/* Owner & Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">اسم المالك</label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="اسم صاحب المطعم"
                  className="w-full bg-slate-900 border border-slate-700/80 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">رقم الهاتف</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07XXXXXXXXX"
                  className="w-full bg-slate-900 border border-slate-700/80 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-mono focus:outline-none"
                />
              </div>
            </div>

            {/* Duration Selector */}
            <div>
              <label className="block font-semibold text-slate-300 mb-2">مدة الصلاحية</label>
              <div className="grid grid-cols-5 gap-1.5">
                {durations.map((dur) => (
                  <button
                    key={dur.id}
                    type="button"
                    onClick={() => setDuration(dur.id)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition ${
                      duration === dur.id
                        ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {dur.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Computed Date */}
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400 text-xs">تاريخ الانتهاء:</span>
              <span className="font-mono text-amber-400 font-bold text-sm">{calculateExpiryDate(duration)}</span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm"
            >
              <KeyRound className="w-4 h-4" />
              <span>توليد مفتاح التفعيل المشفر وإضافته للسيرفر</span>
            </button>
          </form>
        </div>

        {/* Output Side */}
        <div className="space-y-5">
          {/* Key Output */}
          <div className="bg-[#0c1427] p-6 rounded-2xl border border-slate-800/80 space-y-4">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <ShieldCheck className={`w-4 h-4 ${generatedKey ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>مفتاح التفعيل الناتج</span>
            </h3>

            {generatedKey ? (
              <div className="space-y-3 animate-fade-in">
                {/* Key Details */}
                {justGenerated && (
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">المطعم:</span>
                      <span className="font-bold text-white">{justGenerated.restaurantName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">ينتهي في:</span>
                      <span className="font-mono font-bold text-amber-400">{justGenerated.expiryDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Hardware ID:</span>
                      <span className="font-mono text-blue-300 text-[11px]">{justGenerated.hardwareId}</span>
                    </div>
                  </div>
                )}

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-blue-300 break-all leading-relaxed select-all max-h-32 overflow-y-auto dir-ltr">
                  {generatedKey}
                </div>

                <button
                  type="button"
                  onClick={handleCopy}
                  className={`w-full py-2.5 font-semibold rounded-xl text-xs transition flex items-center justify-center gap-2 ${
                    copied
                      ? 'bg-emerald-700 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {copied ? <><Check className="w-4 h-4" /><span>تم النسخ!</span></> : <><Copy className="w-4 h-4" /><span>نسخ المفتاح مباشرةً</span></>}
                </button>

                {/* Delivery Token Button */}
                <div className="pt-2 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={handleCreateDeliveryToken}
                    disabled={deliveryLoading}
                    className="w-full py-2.5 font-semibold rounded-xl text-xs transition flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50"
                  >
                    {deliveryLoading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /><span>جارٍ إنشاء الرمز...</span></>
                    ) : (
                      <><Share2 className="w-4 h-4" /><span>إنشاء رمز تسليم آمن للمطعم</span></>
                    )}
                  </button>
                  <p className="text-[10px] text-slate-400 text-center mt-1.5">
                    رمز 8 أحرف صالح 24 ساعة — للمطاعم التي لا تملك وسيلة تواصل مباشر
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-10 text-center bg-slate-900/40 rounded-xl border border-dashed border-slate-800 text-slate-500 text-xs space-y-2">
                <KeyRound className="w-8 h-8 mx-auto opacity-40" />
                <p>عبّئ البيانات واضغط على توليد المفتاح</p>
              </div>
            )}
          </div>

          {/* Key Inspector */}
          <div className="bg-[#0c1427] p-6 rounded-2xl border border-slate-800/80 space-y-4">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-blue-400" />
              <span>فحص وتشخيص أي مفتاح (Key Inspector)</span>
            </h3>

            <div className="flex gap-2">
              <input
                type="text"
                value={testKeyInput}
                onChange={(e) => { setTestKeyInput(e.target.value); setTestResult(null); setTestError(false) }}
                placeholder="ألصق مفتاح التفعيل هنا للفحص..."
                className="flex-1 bg-slate-900 border border-slate-700/80 focus:border-blue-500 rounded-xl px-3.5 py-2.5 font-mono text-xs text-slate-200 dir-ltr focus:outline-none"
              />
              <button
                type="button"
                onClick={handleTestKey}
                disabled={!testKeyInput.trim()}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-500 transition disabled:opacity-40"
              >
                فحص
              </button>
              {(testResult || testError) && (
                <button
                  type="button"
                  onClick={() => { setTestResult(null); setTestError(false); setTestKeyInput('') }}
                  className="px-3 py-2 bg-slate-800 text-slate-400 rounded-xl hover:bg-slate-700 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {testResult && !testError && (
              <div className="p-4 bg-emerald-950/40 rounded-xl border border-emerald-500/25 text-xs space-y-1.5 font-mono animate-fade-in">
                <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  المفتاح صالح ومعتمد
                </div>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <div className="text-slate-400">المطعم:</div>
                  <div className="text-white font-bold">{testResult.restaurantName}</div>
                  <div className="text-slate-400">Hardware ID:</div>
                  <div className="text-blue-300">{testResult.hardwareId}</div>
                  <div className="text-slate-400">ينتهي في:</div>
                  <div className="text-amber-400 font-bold">{testResult.expiryDate}</div>
                </div>
              </div>
            )}

            {testError && (
              <div className="p-4 bg-rose-950/40 rounded-xl border border-rose-500/25 text-xs animate-fade-in flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="text-rose-400 font-bold">المفتاح غير صالح أو تالف — لا يمكن فك تشفيره</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delivery Token Modal */}
      {deliveryModal && deliveryToken && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center"><Share2 className="w-4 h-4" /></div>
                <div>
                  <h3 className="text-xs font-bold text-white">رمز التسليم الآمن</h3>
                  <p className="text-[10px] text-slate-400">صالح 24 ساعة — استخدام واحد فقط</p>
                </div>
              </div>
              <button onClick={() => setDeliveryModal(false)} className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-800 rounded-lg transition"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-center text-xs text-slate-400">ترخيص: <span className="text-white font-bold">{justGenerated?.restaurantName}</span></p>
              <div className="text-center space-y-1">
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">اقرأ هذا الرمز بصوت عالٍ للعميل عبر الهاتف</p>
                <div className="inline-flex items-center gap-3 cursor-pointer group" onClick={handleCopyTokenOnly}>
                  <span className="text-4xl font-bold font-mono tracking-[0.2em] text-blue-400 select-all">{deliveryToken}</span>
                  {deliveryCopied
                    ? <Check className="w-5 h-5 text-emerald-400" />
                    : <Copy className="w-5 h-5 text-slate-500 group-hover:text-slate-300 transition" />
                  }
                </div>
                <p className="text-[10px] text-slate-400">اضغط على الرمز لنسخه</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center gap-2">
                  <p className="text-[10px] text-slate-400 font-semibold">QR للمسح السريع</p>
                  <div className="w-32 h-32 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
                    <img src={getQrUrl(deliveryToken)} alt="QR Code" className="w-32 h-32" />
                  </div>
                  <p className="text-[9px] text-slate-400 text-center">المطعم يمسحه بهاتفه</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-400 font-semibold">خطوات التسليم</p>
                  {['اتصل بالمطعم هاتفياً', 'اقرأ الرمز: ' + deliveryToken, 'المطعم يفتح أي متصفح', 'يكتب الرابط ويدخل الرمز', 'يضغط نسخ ويفعّل التطبيق'].map((s, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 font-bold text-[9px] flex items-center justify-center shrink-0">{i+1}</span>
                      <span className="text-[10px] text-slate-300 leading-tight">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-slate-400 font-semibold">رابط بوابة الاستلام (Public Domain / IP):</p>
                  <span className="text-[9px] text-blue-400">لعمل الـ QR على الهاتف</span>
                </div>
                <input
                  type="text"
                  placeholder="مثال: https://my-dashboard.vercel.app أو IP الشبكة"
                  value={customDomain}
                  onChange={handleCustomDomainChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-[10px] font-mono text-blue-300 placeholder-slate-600 focus:outline-none focus:border-blue-500 dir-ltr"
                />
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-950 rounded-xl px-3 py-2 font-mono text-[10px] text-blue-300 border border-slate-800 truncate dir-ltr">{getDeliveryUrl(deliveryToken)}</div>
                  <button
                    onClick={handleCopyDeliveryUrl}
                    className={'shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1 ' + (deliveryUrlCopied ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300')}
                  >
                    {deliveryUrlCopied ? <><Check className="w-3 h-3" /><span>تم</span></> : <><Copy className="w-3 h-3" /><span>نسخ</span></>}
                  </button>
                  <a href={getDeliveryUrl(deliveryToken)} target="_blank" rel="noopener noreferrer"
                    className="shrink-0 p-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 border border-blue-500/25 rounded-xl transition" title="فتح للاختبار">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-blue-950/30 border border-blue-500/20 rounded-xl">
                <PhoneCall className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-300">اتصل وقل: <strong>افتح المتصفح واكتب الرابط ثم اكتب الرمز: {deliveryToken}</strong></p>
              </div>
              <button onClick={() => setDeliveryModal(false)} className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-xs transition">إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

