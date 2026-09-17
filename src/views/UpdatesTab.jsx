import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  UploadCloud, RefreshCw, Send, Server, HardDrive, Zap, FileUp,
  X, Loader2, CheckCircle2, AlertTriangle, Download, Clock, Link, Package
} from 'lucide-react'
import {
  fetchUpdatesFromSupabase,
  publishUpdateToSupabase,
  revokeUpdateInSupabase,
  uploadUpdateFileToSupabase,
  getSupabaseClient
} from '../utils/supabaseClient'
import { useToast } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'

const MAX_FILE_SIZE_MB = 500

export default function UpdatesTab({ devices = [] }) {
  const toast = useToast()
  const fileInputRef = useRef(null)

  // Form state
  const [version, setVersion] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState('')
  const [targetType, setTargetType] = useState('all')
  const [selectedHardwareId, setSelectedHardwareId] = useState('')
  const [isMandatory, setIsMandatory] = useState(false)
  const [releaseNotes, setReleaseNotes] = useState('')

  // UI state
  const [loading, setLoading] = useState(false)
  const [uploadStage, setUploadStage] = useState(null) // null | 'uploading' | 'publishing' | 'done'
  const [uploadProgress, setUploadProgress] = useState(0) // 0-100 simulated

  // Data
  const [updatesList, setUpdatesList] = useState([])
  const [listLoading, setListLoading] = useState(true)

  // Confirm dialog
  const [revokeConfirm, setRevokeConfirm] = useState({ open: false, id: null, version: '' })

  // ─── Load updates list ────────────────────────────────────────
  const loadUpdates = useCallback(async () => {
    setListLoading(true)
    try {
      const data = await fetchUpdatesFromSupabase()
      setUpdatesList(data)
    } catch {
      toast.error('خطأ في تحميل قائمة التحديثات من السيرفر')
    } finally {
      setListLoading(false)
    }
  }, [])

  useEffect(() => { loadUpdates() }, [])

  // ─── File validation ─────────────────────────────────────────
  const validateAndSetFile = (file) => {
    if (!file) return
    const allowedTypes = ['.exe', '.zip', '.rar', '.7z', '.msi', '.dmg']
    const ext = '.' + file.name.split('.').pop().toLowerCase()
    if (!allowedTypes.includes(ext)) {
      toast.error(`نوع الملف غير مدعوم. المسموح: ${allowedTypes.join(', ')}`)
      return
    }
    const sizeMB = file.size / (1024 * 1024)
    if (sizeMB > MAX_FILE_SIZE_MB) {
      toast.error(`حجم الملف كبير جداً (${sizeMB.toFixed(1)} MB). الحد الأقصى: ${MAX_FILE_SIZE_MB} MB`)
      return
    }
    setSelectedFile(file)
    toast.info(`تم تحديد الملف: ${file.name} (${sizeMB.toFixed(2)} MB)`)
  }

  // ─── Drag & Drop handlers ─────────────────────────────────────
  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) validateAndSetFile(file)
  }, [])

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = () => setIsDragging(false)

  // ─── Simulate upload progress ─────────────────────────────────
  const simulateProgress = (start, end, duration) => {
    return new Promise((resolve) => {
      const steps = 20
      const increment = (end - start) / steps
      const interval = duration / steps
      let current = start
      const timer = setInterval(() => {
        current += increment
        setUploadProgress(Math.min(Math.round(current), end))
        if (current >= end) {
          clearInterval(timer)
          resolve()
        }
      }, interval)
    })
  }

  // ─── Check connection before upload ──────────────────────────
  const checkConnectionBeforeUpload = async () => {
    const client = getSupabaseClient()
    if (!client) return false
    try {
      const { error } = await client.from('updates').select('id').limit(1)
      return !error
    } catch {
      return false
    }
  }

  // ─── Submit handler ───────────────────────────────────────────
  const handlePublishUpdate = async (e) => {
    e.preventDefault()

    if (!version.trim()) {
      toast.warning('يرجى كتابة رقم الإصدار (مثل 1.2.0)')
      return
    }
    if (!selectedFile && !downloadUrl.trim()) {
      toast.warning('يرجى رفع ملف التحديث أو إدخال رابط التحميل المباشر')
      return
    }
    if (targetType === 'specific' && !selectedHardwareId) {
      toast.warning('يرجى اختيار المطعم المستهدف')
      return
    }

    setUploadStage('checking')
    setUploadProgress(0)
    setLoading(true)

    const connected = await checkConnectionBeforeUpload()
    if (!connected) {
      toast.error('لا يوجد اتصال بـ Supabase — تحقق من الإعدادات أولاً')
      setLoading(false)
      setUploadStage(null)
      return
    }

    let finalDownloadUrl = downloadUrl.trim()

    try {
      if (selectedFile) {
        setUploadStage('uploading')
        setUploadProgress(5)

        const progressPromise = simulateProgress(5, 85, 3000)

        const [uploadedUrl] = await Promise.all([
          uploadUpdateFileToSupabase(selectedFile, version),
          progressPromise
        ])

        finalDownloadUrl = uploadedUrl
        setUploadProgress(90)
      }

      setUploadStage('publishing')
      setUploadProgress(95)

      const targetHw = targetType === 'all' ? '*' : selectedHardwareId
      const matchedDev = devices.find((d) => d.hardwareId === selectedHardwareId)
      const targetName = targetType === 'all'
        ? 'جميع المطاعم (*)'
        : (matchedDev ? matchedDev.restaurantName : selectedHardwareId)

      await publishUpdateToSupabase({
        version: version.trim(),
        targetHardwareId: targetHw,
        targetName,
        downloadUrl: finalDownloadUrl,
        mandatory: isMandatory,
        notes: releaseNotes.trim() || 'تحديث أداء وتحسينات عامة',
        status: 'active',
      })

      setUploadProgress(100)
      setUploadStage('done')

      toast.success(`تم نشر التحديث v${version} بنجاح! سيصله التطبيق عند أول اتصال`)

      setVersion('')
      setSelectedFile(null)
      setDownloadUrl('')
      setReleaseNotes('')
      setIsMandatory(false)
      setTargetType('all')
      setSelectedHardwareId('')
      if (fileInputRef.current) fileInputRef.current.value = ''

      await loadUpdates()

      setTimeout(() => {
        setUploadStage(null)
        setUploadProgress(0)
      }, 2000)

    } catch (err) {
      toast.error('فشل النشر: ' + err.message)
      setUploadStage(null)
      setUploadProgress(0)
    } finally {
      setLoading(false)
    }
  }

  // ─── Revoke update ────────────────────────────────────────────
  const handleRevokeUpdate = async () => {
    const { id, version: ver } = revokeConfirm
    setRevokeConfirm({ open: false, id: null, version: '' })
    try {
      const ok = await revokeUpdateInSupabase(id)
      if (ok) {
        setUpdatesList((prev) => prev.map((u) => u.id === id ? { ...u, status: 'revoked' } : u))
        toast.warning(`تم إلغاء التحديث v${ver} — لن يُرسل لأي جهاز`)
      } else {
        toast.error('فشل إلغاء التحديث من السيرفر')
      }
    } catch (err) {
      toast.error('خطأ بإلغاء التحديث: ' + err.message)
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────
  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const getStageLabel = () => {
    switch (uploadStage) {
      case 'checking': return 'جارٍ التحقق من الاتصال...'
      case 'uploading': return `جارٍ رفع الملف إلى Supabase Storage... ${uploadProgress}%`
      case 'publishing': return 'جارٍ نشر بيانات التحديث في قاعدة البيانات...'
      case 'done': return 'تم النشر بنجاح!'
      default: return ''
    }
  }

  const activeUpdates = updatesList.filter((u) => u.status === 'active')
  const revokedUpdates = updatesList.filter((u) => u.status !== 'active')

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Confirm Revoke */}
      <ConfirmDialog
        isOpen={revokeConfirm.open}
        title="إلغاء نشر التحديث"
        message={`هل تريد إلغاء نشر التحديث v${revokeConfirm.version}؟ لن يُرسل لأي جهاز بعد الآن، لكن الملف سيبقى في السيرفر.`}
        confirmLabel="نعم، إلغاء النشر"
        cancelLabel="تراجع"
        danger={false}
        onConfirm={handleRevokeUpdate}
        onCancel={() => setRevokeConfirm({ open: false, id: null, version: '' })}
      />

      {/* Header */}
      <div className="bg-[#0c1427] p-6 rounded-2xl border border-slate-800/80 shadow-sm flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">نظام التحديثات الموجهة عن بُعد (OTA)</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              رفع ونشر تحديثات التطبيق تلقائياً لجميع المطاعم أو لمطعم محدد
            </p>
          </div>
        </div>
        {/* Stats */}
        <div className="flex items-center gap-4 text-xs">
          <div className="text-center">
            <div className="font-bold text-blue-400 text-lg font-mono-custom">{activeUpdates.length}</div>
            <div className="text-slate-400">نشط</div>
          </div>
          <div className="w-px h-8 bg-slate-800" />
          <div className="text-center">
            <div className="font-bold text-slate-500 text-lg font-mono-custom">{revokedUpdates.length}</div>
            <div className="text-slate-500">ملغى</div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left: Publish Form */}
        <div className="lg:col-span-5 bg-[#0c1427] p-6 rounded-2xl border border-slate-800/80 space-y-5">
          <h3 className="text-xs font-bold text-white flex items-center gap-2 border-b border-slate-800/80 pb-3">
            <Send className="w-4 h-4 text-blue-400" />
            <span>نشر تحديث جديد</span>
          </h3>

          <form onSubmit={handlePublishUpdate} className="space-y-4 text-xs">
            {/* Version */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                رقم الإصدار <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="مثال: 1.3.0"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white font-mono focus:border-blue-500 focus:outline-none transition"
              />
            </div>

            {/* Target */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">التوجيه</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setTargetType('all'); setSelectedHardwareId('') }}
                  className={`py-2 px-3 rounded-xl border font-semibold transition flex items-center justify-center gap-2 ${
                    targetType === 'all'
                      ? 'bg-blue-600/15 border-blue-500/40 text-blue-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Server className="w-3.5 h-3.5" />
                  <span>جميع المطاعم</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('specific')}
                  className={`py-2 px-3 rounded-xl border font-semibold transition flex items-center justify-center gap-2 ${
                    targetType === 'specific'
                      ? 'bg-blue-600/15 border-blue-500/40 text-blue-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>مطعم محدد</span>
                </button>
              </div>
              {targetType === 'specific' && (
                <select
                  value={selectedHardwareId}
                  onChange={(e) => setSelectedHardwareId(e.target.value)}
                  className="w-full mt-2 bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white font-mono focus:border-blue-500 focus:outline-none transition"
                >
                  <option value="">-- اختر المطعم --</option>
                  {devices.map((d) => (
                    <option key={d.id} value={d.hardwareId}>
                      {d.restaurantName} ({d.hardwareId})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* File Upload Drop Zone */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                ملف التحديث (.exe, .zip, .msi...) <span className="text-slate-400">(حد أقصى {MAX_FILE_SIZE_MB} MB)</span>
              </label>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`p-5 border-2 border-dashed rounded-xl transition-all cursor-pointer text-center space-y-2 ${
                  isDragging
                    ? 'border-blue-400 bg-blue-500/10'
                    : selectedFile
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : 'border-slate-800 hover:border-blue-500/50 bg-slate-900/50 hover:bg-slate-900'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".exe,.zip,.rar,.7z,.msi,.dmg"
                  onChange={(e) => validateAndSetFile(e.target.files?.[0])}
                  className="hidden"
                />
                {selectedFile ? (
                  <div className="space-y-1.5">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                    <p className="font-semibold text-emerald-400 text-xs">{selectedFile.name}</p>
                    <p className="text-slate-400 text-[10px] font-mono">{formatSize(selectedFile.size)}</p>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                      className="text-[10px] text-rose-400 hover:text-rose-300 transition flex items-center gap-1 mx-auto"
                    >
                      <X className="w-3 h-3" /> إزالة الملف
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <FileUp className={`w-8 h-8 mx-auto ${isDragging ? 'text-blue-400' : 'text-slate-500'}`} />
                    <p className={`font-semibold ${isDragging ? 'text-blue-300' : 'text-slate-400'}`}>
                      {isDragging ? 'أفلت الملف هنا' : 'اسحب وأفلت الملف أو اضغط للاختيار'}
                    </p>
                    <p className="text-[10px] text-slate-500">.exe .zip .msi .rar .7z .dmg</p>
                  </div>
                )}
              </div>
            </div>

            {/* OR: Direct URL */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1 flex items-center gap-1.5">
                <Link className="w-3.5 h-3.5" />
                أو رابط تحميل مباشر (اختياري إذا رفعت ملف)
              </label>
              <input
                type="url"
                placeholder="https://example.com/downloads/setup.exe"
                value={downloadUrl}
                onChange={(e) => setDownloadUrl(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-slate-300 font-mono focus:border-blue-500 focus:outline-none transition dir-ltr"
              />
            </div>

            {/* Mandatory */}
            <label className="flex items-center gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700 transition">
              <input
                type="checkbox"
                checked={isMandatory}
                onChange={(e) => setIsMandatory(e.target.checked)}
                className="w-4 h-4 rounded accent-blue-500"
              />
              <div>
                <div className="font-semibold text-slate-200">تحديث إجباري</div>
                <div className="text-[10px] text-slate-400 mt-0.5">يُوقف التطبيق حتى يُحدَّث</div>
              </div>
            </label>

            {/* Notes */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">ملاحظات الإصدار (Release Notes)</label>
              <textarea
                rows={3}
                placeholder="اكتب التغييرات والمميزات الجديدة في هذا الإصدار..."
                value={releaseNotes}
                onChange={(e) => setReleaseNotes(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-slate-200 focus:border-blue-500 focus:outline-none transition resize-none"
              />
            </div>

            {/* Progress Bar */}
            {uploadStage && (
              <div className="space-y-2 animate-fade-in">
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>{getStageLabel()}</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      uploadStage === 'done'
                        ? 'bg-emerald-500'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-semibold transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /><span>جارٍ النشر...</span></>
              ) : (
                <><Zap className="w-4 h-4" /><span>رفع ونشر التحديث فوراً</span></>
              )}
            </button>
          </form>
        </div>

        {/* Right: Updates History */}
        <div className="lg:col-span-7 bg-[#0c1427] p-6 rounded-2xl border border-slate-800/80 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-400" />
              <span>سجل التحديثات المنشورة</span>
            </h3>
            <button
              onClick={loadUpdates}
              disabled={listLoading}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition flex items-center gap-1 disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${listLoading ? 'animate-spin' : ''}`} />
              <span>تحديث</span>
            </button>
          </div>

          <div className="space-y-3 max-h-[560px] overflow-y-auto">
            {listLoading ? (
              <div className="py-12 text-center">
                <Loader2 className="w-7 h-7 text-blue-400 animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-400">جارٍ التحميل...</p>
              </div>
            ) : updatesList.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <UploadCloud className="w-12 h-12 text-slate-600 mx-auto" />
                <p className="text-slate-400 font-semibold text-sm">لا توجد تحديثات منشورة بعد</p>
                <p className="text-slate-500 text-xs">أنشئ أول تحديث من النموذج على اليسار</p>
              </div>
            ) : (
              <>
                {/* Active */}
                {activeUpdates.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse inline-block" />
                      نشط ({activeUpdates.length})
                    </div>
                    {activeUpdates.map((item) => (
                      <UpdateCard
                        key={item.id}
                        item={item}
                        onRevoke={() => setRevokeConfirm({ open: true, id: item.id, version: item.version })}
                      />
                    ))}
                  </div>
                )}

                {/* Revoked */}
                {revokedUpdates.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">
                      ملغى ({revokedUpdates.length})
                    </div>
                    {revokedUpdates.map((item) => (
                      <UpdateCard key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── UpdateCard Sub-component ──────────────────────────────────────
function UpdateCard({ item, onRevoke }) {
  const isActive = item.status === 'active'
  return (
    <div className={`p-4 rounded-xl border transition space-y-3 ${
      isActive
        ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
        : 'bg-slate-950/40 border-slate-800/40 opacity-50'
    }`}>
      {/* Header */}
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 bg-blue-500/15 border border-blue-500/25 text-blue-300 font-mono text-xs font-bold rounded-md">
            v{item.version}
          </span>
          {item.mandatory && (
            <span className="px-2 py-0.5 bg-rose-500/15 text-rose-400 text-[10px] font-semibold rounded border border-rose-500/25">
              إجباري
            </span>
          )}
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
            isActive ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-800 text-slate-500'
          }`}>
            {isActive ? 'نشط' : 'ملغى'}
          </span>
        </div>
        {isActive && onRevoke && (
          <button
            onClick={onRevoke}
            className="shrink-0 px-3 py-1.5 bg-rose-600/15 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/25 rounded-lg text-[11px] font-semibold transition"
          >
            إلغاء النشر
          </button>
        )}
      </div>

      {/* Target & Notes */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-[11px]">
          <Server className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="text-slate-400">المستهدف:</span>
          <span className="font-semibold text-white">{item.targetName}</span>
        </div>
        {item.notes && (
          <p className="text-[11px] text-slate-400 leading-relaxed">{item.notes}</p>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-2 border-t border-slate-800/60 gap-2">
        {item.downloadUrl ? (
          <a
            href={item.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[10px] text-blue-400 hover:text-blue-300 transition font-mono truncate max-w-[240px]"
            title={item.downloadUrl}
          >
            <Download className="w-3 h-3 shrink-0" />
            <span className="truncate">{item.downloadUrl.split('/').pop() || 'رابط التحميل'}</span>
          </a>
        ) : <div />}
        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono shrink-0">
          <Clock className="w-3 h-3" />
          {item.createdAt}
        </div>
      </div>
    </div>
  )
}

