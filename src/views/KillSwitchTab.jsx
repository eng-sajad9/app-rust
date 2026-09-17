import React, { useState } from 'react'
import { Skull, AlertTriangle, ShieldCheck, Zap, PlusCircle, Loader2, MonitorOff } from 'lucide-react'
import { useToast } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'
import { toggleKillSwitchInSupabase } from '../utils/supabaseClient'

export default function KillSwitchTab({ devices = [], onRefresh }) {
  const toast = useToast()
  const [targetHwId, setTargetHwId] = useState('')
  const [loading, setLoading] = useState(null) // hardwareId being toggled

  // Confirm dialog state
  const [confirmState, setConfirmState] = useState({ open: false, hardwareId: null, currentStatus: false, name: '' })

  const requestToggle = (hardwareId, currentStatus, name) => {
    setConfirmState({ open: true, hardwareId, currentStatus, name })
  }

  const executeToggle = async () => {
    const { hardwareId, currentStatus } = confirmState
    const nextState = !currentStatus
    setConfirmState({ open: false, hardwareId: null, currentStatus: false, name: '' })
    setLoading(hardwareId)

    // Instant optimistic notification
    if (nextState) {
      toast.error(`تم حظر الجهاز (${hardwareId}) فوراً!`)
    } else {
      toast.success(`تم إلغاء الحظر عن الجهاز (${hardwareId})`)
    }

    try {
      const ok = await toggleKillSwitchInSupabase(hardwareId, nextState)
      if (ok) {
        if (onRefresh) await onRefresh()
      } else {
        toast.error('تحذير: قد يكون هناك تأخير في وصول الحظر للشبكة')
      }
    } catch (err) {
      toast.error('خطأ أثناء التحديث: ' + err.message)
    } finally {
      setLoading(null)
    }
  }

  const handleManualBlock = async (e) => {
    e.preventDefault()
    if (!targetHwId.trim()) return
    const id = targetHwId.trim().toUpperCase()
    setLoading(id)
    toast.error(`تم إرسال أمر الحظر الفوري للجهاز (${id})`)
    setTargetHwId('')
    try {
      const ok = await toggleKillSwitchInSupabase(id, true, true)
      if (ok && onRefresh) await onRefresh()
    } catch (err) {
      toast.error('خطأ بالحظر: ' + err.message)
    } finally {
      setLoading(null)
    }
  }

  const blockedDevices = devices.filter((d) => d.killSwitch || d.status === 'revoked')
  const safeDevices = devices.filter((d) => !d.killSwitch && d.status !== 'revoked')

  return (
    <div className="space-y-6">
      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmState.open}
        title={confirmState.currentStatus ? 'إلغاء حظر الجهاز' : 'تفعيل Kill Switch'}
        message={
          confirmState.currentStatus
            ? `هل تريد إلغاء الحظر عن جهاز "${confirmState.name}"؟ سيعود التطبيق للعمل بشكل طبيعي عند أول اتصال.`
            : `هل أنت متأكد من تفعيل Kill Switch على جهاز "${confirmState.name}" (${confirmState.hardwareId})؟ سيُوقف هذا التطبيق ويحذف الترخيص المحلي عند أول اتصال بالإنترنت.`
        }
        confirmLabel={confirmState.currentStatus ? 'نعم، إلغاء الحظر' : 'نعم، تفعيل الإيقاف'}
        cancelLabel="تراجع"
        danger={!confirmState.currentStatus}
        onConfirm={executeToggle}
        onCancel={() => setConfirmState({ open: false, hardwareId: null, currentStatus: false, name: '' })}
      />

      {/* Title */}
      <div className="bg-[#0c1427] p-6 rounded-2xl border border-slate-800/80 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
            <Skull className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">غرفة تحكم زر التعطيل عن بعد</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              عند التفعيل: يُحذف ملف الترخيص فوراً عند أول اتصال بالإنترنت ويُنقل لشاشة التفعيل
            </p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#0c1427] p-4 rounded-2xl border border-slate-800/80 text-center">
          <div className="text-2xl font-bold font-mono-custom text-white">{devices.length}</div>
          <div className="text-xs text-slate-400 mt-1">إجمالي الأجهزة</div>
        </div>
        <div className="bg-[#0c1427] p-4 rounded-2xl border border-slate-800/80 text-center">
          <div className="text-2xl font-bold font-mono-custom text-emerald-400">{safeDevices.length}</div>
          <div className="text-xs text-slate-400 mt-1">آمن ونشط</div>
        </div>
        <div className="bg-[#0c1427] p-4 rounded-2xl border border-slate-800/80 text-center">
          <div className="text-2xl font-bold font-mono-custom text-rose-400">{blockedDevices.length}</div>
          <div className="text-xs text-slate-400 mt-1">Kill Switch نشط</div>
        </div>
      </div>

      {/* Manual Block Box */}
      <div className="bg-[#0c1427] p-5 rounded-2xl border border-slate-800/80 space-y-3">
        <h3 className="text-xs font-bold text-white flex items-center gap-2">
          <PlusCircle className="w-4 h-4 text-rose-400" />
          <span>حظر جهاز جديد مباشرةً بالـ Hardware ID</span>
        </h3>
        <form onSubmit={handleManualBlock} className="flex gap-3">
          <input
            type="text"
            placeholder="ألصق الـ Hardware ID هنا (مثال: A1B2-C3D4-E5F6-G7H8)..."
            value={targetHwId}
            onChange={(e) => setTargetHwId(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-blue-300 font-mono focus:border-rose-500 focus:outline-none transition uppercase"
            required
          />
          <button
            type="submit"
            disabled={loading !== null}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition whitespace-nowrap flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            حظر فوراً
          </button>
        </form>
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] font-medium flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>ملاحظة: حظر الـ Hardware ID يتم إرساله فوراً للسيرفر ويتم تنفيذه على التطبيق عند أول اتصال صامت بالإنترنت.</span>
        </div>
      </div>

      {/* Global Emergency Kill Switch Box */}
      <div className="bg-[#0c1427] p-5 rounded-2xl border border-rose-600/30 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center font-bold text-lg">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white">زر التعطيل الشامل (Global Emergency Kill Switch (*))</h3>
            <p className="text-xs text-slate-400">حظر جميع الأجهزة بلا استثناء حتى وإن مسحت البيانات أو لم تكن تملك الـ Hardware ID الخاص بهم!</p>
          </div>
        </div>
        <button
          onClick={() => requestToggle('*', false, 'جميع الأجهزة في العالم (*)')}
          disabled={loading !== null}
          className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-xs transition flex items-center gap-2"
        >
          <Zap className="w-4 h-4" />
          <span>تفعيل الحظر الشامل (*)</span>
        </button>
      </div>

      {/* Devices Grid */}
      {devices.length === 0 ? (
        <div className="bg-[#0c1427] p-16 rounded-2xl border border-slate-800/80 text-center space-y-3">
          <MonitorOff className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-slate-400 font-semibold text-sm">لا توجد أجهزة مسجلة بعد</p>
          <p className="text-slate-500 text-xs">أضف تراخيص من تاب "مولد التراخيص" لتظهر هنا</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Blocked Devices */}
          {blockedDevices.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider px-1 mb-3 flex items-center gap-2">
                <Skull className="w-3.5 h-3.5" />
                أجهزة محظورة — Kill Switch نشط ({blockedDevices.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {blockedDevices.map((dev) => (
                  <DeviceCard
                    key={dev.id}
                    dev={dev}
                    isKillActive={true}
                    loading={loading === dev.hardwareId}
                    onToggle={() => requestToggle(dev.hardwareId, true, dev.restaurantName)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Safe Devices */}
          {safeDevices.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1 mb-3 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                أجهزة آمنة ونشطة ({safeDevices.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {safeDevices.map((dev) => (
                  <DeviceCard
                    key={dev.id}
                    dev={dev}
                    isKillActive={false}
                    loading={loading === dev.hardwareId}
                    onToggle={() => requestToggle(dev.hardwareId, false, dev.restaurantName)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function DeviceCard({ dev, isKillActive, loading, onToggle }) {
  return (
    <div className={`p-5 rounded-2xl space-y-4 border transition bg-[#0c1427] ${
      isKillActive ? 'border-rose-500/50 bg-rose-950/10' : 'border-slate-800/80'
    }`}>
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-xs truncate">{dev.restaurantName}</h3>
          <div className="text-[11px] font-mono text-blue-300 font-bold mt-1 truncate dir-ltr">
            {dev.hardwareId}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 truncate">
            {dev.ownerName || 'غير محدد'} — {dev.phone || 'بدون هاتف'}
          </div>
        </div>
        <span className={`shrink-0 px-2.5 py-1 rounded-md text-[10px] font-semibold ${
          isKillActive
            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
        }`}>
          {isKillActive ? 'محظور' : 'آمن'}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
        <div className="text-[11px] text-slate-400 font-mono">
          ينتهي: <span className="text-slate-200 font-bold">{dev.expiryDate}</span>
        </div>
        <button
          onClick={onToggle}
          disabled={loading}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
            isKillActive
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              : 'bg-rose-600 hover:bg-rose-500 text-white'
          }`}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Zap className="w-4 h-4" />
          )}
          <span>{isKillActive ? 'إلغاء الحظر' : 'تفعيل Kill Switch'}</span>
        </button>
      </div>
    </div>
  )
}

