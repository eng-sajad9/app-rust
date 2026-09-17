import React, { useState, useMemo } from 'react'
import { Radio, Activity, Search, RefreshCw, Download, AlertCircle, Loader2, Filter } from 'lucide-react'
import { useToast } from '../components/Toast'

export default function TelemetryTab({ telemetryLogs, onRefresh, isRefreshing }) {
  const toast = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('') // '' | 'ok' | 'revoked'

  const filtered = useMemo(() => {
    return telemetryLogs.filter((log) => {
      const matchSearch =
        (log.hardwareId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.restaurantName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.hostname || '').toLowerCase().includes(searchTerm.toLowerCase())
      const matchStatus =
        !statusFilter ||
        (statusFilter === 'revoked' && log.status.includes('REVOKED')) ||
        (statusFilter === 'ok' && !log.status.includes('REVOKED'))
      return matchSearch && matchStatus
    })
  }, [telemetryLogs, searchTerm, statusFilter])

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      toast.warning('لا توجد بيانات للتصدير')
      return
    }
    const headers = ['الوقت', 'Hardware ID', 'اسم المطعم', 'الموظفون', 'السائقون', 'المنصة', 'المضيف', 'الحالة']
    const rows = filtered.map((l) => [
      l.timestamp, l.hardwareId, l.restaurantName,
      l.employeesCount, l.driversCount, l.platform, l.hostname, l.status
    ])
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `telemetry-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`تم تصدير ${filtered.length} سجل بنجاح`)
  }

  const revokedCount = telemetryLogs.filter((l) => l.status.includes('REVOKED')).length
  const okCount = telemetryLogs.length - revokedCount

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-[#0c1427] p-6 rounded-2xl border border-slate-800/80 shadow-sm flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">رادار التتبع الخفي (Live Telemetry)</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              استقبال النبضات الحية من تطبيقات المطاعم — يتحدث كل 4 ساعات
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير CSV</span>
          </button>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>تحديث</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#0c1427] p-4 rounded-2xl border border-slate-800/80 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold">إجمالي الإشارات</div>
            <div className="text-2xl font-bold font-mono-custom text-white mt-0.5">{telemetryLogs.length}</div>
          </div>
          <Activity className="w-7 h-7 text-blue-400 opacity-50" />
        </div>
        <div className="bg-[#0c1427] p-4 rounded-2xl border border-slate-800/80 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold">نشط وسليم</div>
            <div className="text-2xl font-bold font-mono-custom text-emerald-400 mt-0.5">{okCount}</div>
          </div>
          <Activity className="w-7 h-7 text-emerald-400 opacity-50" />
        </div>
        <div className="bg-[#0c1427] p-4 rounded-2xl border border-slate-800/80 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold">محظور (Kill Switch)</div>
            <div className="text-2xl font-bold font-mono-custom text-rose-400 mt-0.5">{revokedCount}</div>
          </div>
          <AlertCircle className="w-7 h-7 text-rose-400 opacity-50" />
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-[#0c1427] p-4 rounded-2xl border border-slate-800/80 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            placeholder="البحث بالـ Hardware ID، اسم المطعم، أو المضيف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 focus:border-blue-500 pr-10 pl-4 py-2.5 rounded-xl text-xs text-slate-200 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 text-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 transition"
          >
            <option value="">جميع الحالات</option>
            <option value="ok">نشط فقط</option>
            <option value="revoked">محظور فقط</option>
          </select>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          {filtered.length} / {telemetryLogs.length} سجل
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0c1427] rounded-2xl border border-slate-800/80 overflow-hidden shadow-sm">
        {isRefreshing && telemetryLogs.length === 0 ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400">جارٍ تحميل إشارات الرادار...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <Radio className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-400">
              {searchTerm || statusFilter ? 'لا توجد نتائج للبحث' : 'لم تصل أي إشارات رادار بعد'}
            </p>
            <p className="text-xs text-slate-500">
              {searchTerm || statusFilter ? 'جرّب تغيير مصطلح البحث أو الفلتر' : 'سيتم استقبال الإشارات تلقائياً عند اتصال أجهزة المطاعم'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-4 w-40">الوقت والتاريخ</th>
                  <th className="p-4">اسم المطعم</th>
                  <th className="p-4">Hardware ID</th>
                  <th className="p-4 text-center">الموظفون / السائقون</th>
                  <th className="p-4">المنصة / المضيف</th>
                  <th className="p-4 text-center">حالة الاستجابة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((log) => {
                  const isRevoked = log.status.includes('REVOKED')
                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-slate-900/40 transition ${isRevoked ? 'bg-rose-950/10' : ''}`}
                    >
                      <td className="p-4 font-mono text-slate-400 text-[10px] whitespace-nowrap">{log.timestamp}</td>
                      <td className="p-4 font-bold text-white">{log.restaurantName}</td>
                      <td className="p-4 font-mono text-blue-300 font-bold text-[11px] tracking-wider dir-ltr">{log.hardwareId}</td>
                      <td className="p-4 text-center font-mono">
                        <span className="text-emerald-400 font-bold">{log.employeesCount}</span>
                        <span className="text-slate-500 mx-1">/</span>
                        <span className="text-blue-400 font-bold">{log.driversCount}</span>
                      </td>
                      <td className="p-4 text-slate-400 text-[11px]">
                        <div>{log.platform}</div>
                        <div className="text-slate-500 font-mono">{log.hostname}</div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold ${
                          isRevoked
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isRevoked ? 'bg-rose-500' : 'bg-emerald-400 animate-pulse'}`} />
                          {isRevoked ? 'محظور' : 'نشط'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

