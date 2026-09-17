import React from 'react'
import {
  ShieldCheck, MonitorCheck, Skull, Users, ArrowUpRight, KeyRound, Radio,
  AlertCircle, TrendingUp, Clock, Loader2
} from 'lucide-react'

export default function OverviewTab({ devices, telemetryLogs, onNavigate, isLoading }) {
  const activeDevices = devices.filter((d) => d.status === 'active' && !d.killSwitch)
  const revokedDevices = devices.filter((d) => d.killSwitch || d.status === 'revoked')
  const expiredDevices = devices.filter((d) => d.status === 'expired')
  const totalStaff = devices.reduce((sum, d) => sum + (d.employeesCount || 0) + (d.driversCount || 0), 0)
  const totalEmployees = devices.reduce((sum, d) => sum + (d.employeesCount || 0), 0)
  const totalDrivers = devices.reduce((sum, d) => sum + (d.driversCount || 0), 0)

  const expiringIn30Days = devices.filter((d) => {
    if (!d.expiryDate || d.status === 'revoked' || d.killSwitch) return false
    const diff = (new Date(d.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
    return diff >= 0 && diff <= 30
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
        <p className="text-slate-400 font-medium text-sm">جارٍ تحميل البيانات من السيرفر...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-[#0c1427] p-6 rounded-2xl border border-slate-800/80 flex flex-wrap justify-between items-center gap-4 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            نظرة عامة على التراخيص والأداء
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            متابعة حالة التراخيص النشطة، الأجهزة المعطلة، والإحصاءات الحية من تطبيقات المطاعم.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {expiringIn30Days.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-400 font-semibold">
              <AlertCircle className="w-4 h-4" />
              <span>{expiringIn30Days.length} ترخيص ينتهي خلال 30 يوماً</span>
            </div>
          )}
          <button
            onClick={() => onNavigate('generator')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition shadow-sm flex items-center gap-2"
          >
            <KeyRound className="w-4 h-4" />
            <span>إصدار ترخيص جديد</span>
          </button>
        </div>
      </div>

      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active */}
        <div className="bg-[#0b1325] p-5 rounded-2xl border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition cursor-pointer" onClick={() => onNavigate('licenses')}>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">نشط وساري</span>
            <p className="text-3xl font-bold text-white mt-1 font-mono-custom">{activeDevices.length}</p>
            <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
              <ShieldCheck className="w-3 h-3" /> يعمل بكفاءة
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <MonitorCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Revoked */}
        <div className="bg-[#0b1325] p-5 rounded-2xl border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition cursor-pointer" onClick={() => onNavigate('killswitch')}>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Kill Switch</span>
            <p className="text-3xl font-bold text-rose-400 mt-1 font-mono-custom">{revokedDevices.length}</p>
            <span className="text-[10px] text-rose-400 font-medium flex items-center gap-1 mt-1">
              <Skull className="w-3 h-3" /> محظور عن بُعد
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0">
            <Skull className="w-5 h-5" />
          </div>
        </div>

        {/* Expiring */}
        <div className="bg-[#0b1325] p-5 rounded-2xl border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition cursor-pointer" onClick={() => onNavigate('licenses')}>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">ينتهي قريباً</span>
            <p className="text-3xl font-bold text-amber-400 mt-1 font-mono-custom">{expiringIn30Days.length}</p>
            <span className="text-[10px] text-amber-400 font-medium flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3" /> خلال 30 يوماً
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Staff */}
        <div className="bg-[#0b1325] p-5 rounded-2xl border border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">إجمالي الكادر</span>
            <p className="text-3xl font-bold text-blue-400 mt-1 font-mono-custom">{totalStaff}</p>
            <span className="text-[10px] text-slate-400 font-medium mt-1 block">
              {totalEmployees} موظف | {totalDrivers} سائق
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Devices Table Preview */}
        <div className="lg:col-span-2 bg-[#0c1427] p-6 rounded-2xl border border-slate-800/80 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">الأجهزة والمطاعم المسجلة</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">معاينة سريعة لآخر التراخيص المسجلة</p>
            </div>
            <button
              onClick={() => onNavigate('licenses')}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
            >
              <span>عرض الكل ({devices.length})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {devices.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <MonitorCheck className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-slate-400 text-xs font-medium">لا توجد أجهزة مسجلة بعد</p>
              <button
                onClick={() => onNavigate('generator')}
                className="text-xs text-blue-400 hover:text-blue-300 transition underline"
              >
                أضف أول ترخيص الآن
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {devices.slice(0, 5).map((dev) => {
                const isRevoked = dev.killSwitch || dev.status === 'revoked'
                const isExpired = dev.status === 'expired'
                return (
                  <div key={dev.id} className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800/80 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs text-white truncate">{dev.restaurantName}</h4>
                        <span className={`shrink-0 px-2 py-0.5 rounded-md text-[9px] font-semibold ${
                          isRevoked ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                          : isExpired ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                        }`}>
                          {isRevoked ? 'محظور' : isExpired ? 'منتهٍ' : 'نشط'}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 truncate">{dev.hardwareId}</div>
                    </div>
                    <div className="text-left text-[11px] font-mono shrink-0 space-y-0.5">
                      <div className="text-amber-400">{dev.expiryDate}</div>
                      <div className="text-slate-400">{dev.employeesCount} موظف | {dev.driversCount} سائق</div>
                    </div>
                  </div>
                )
              })}
              {devices.length > 5 && (
                <button
                  onClick={() => onNavigate('licenses')}
                  className="w-full py-2.5 text-xs text-blue-400 hover:text-blue-300 font-semibold transition flex items-center justify-center gap-1"
                >
                  <span>+ {devices.length - 5} أجهزة أخرى</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          {/* Live Radar Preview */}
          <div className="bg-[#0c1427] p-5 rounded-2xl border border-slate-800/80 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>آخر إشارات الرادار</span>
              </h3>
              <button
                onClick={() => onNavigate('telemetry')}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition flex items-center gap-1"
              >
                السجل الكامل
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            {telemetryLogs.length === 0 ? (
              <div className="py-8 text-center">
                <Radio className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 text-xs">لا توجد إشارات بعد</p>
              </div>
            ) : (
              <div className="space-y-2">
                {telemetryLogs.slice(0, 4).map((log) => (
                  <div key={log.id} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-200 font-medium text-[11px] truncate">{log.restaurantName}</span>
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                        log.status.includes('REVOKED')
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {log.status.includes('REVOKED') ? 'محظور' : 'نشط'}
                      </span>
                    </div>
                    <div className="text-[9px] font-mono text-slate-400">{log.timestamp}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-[#0c1427] p-5 rounded-2xl border border-slate-800/80 space-y-3">
            <h3 className="text-xs font-bold text-white border-b border-slate-800/80 pb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              إجراءات سريعة
            </h3>
            <div className="space-y-2">
              {[
                { label: 'إصدار ترخيص جديد', tab: 'generator', icon: KeyRound },
                { label: 'إدارة التراخيص', tab: 'licenses', icon: MonitorCheck },
                { label: 'Kill Switch Control', tab: 'killswitch', icon: Skull },
                { label: 'رادار التتبع', tab: 'telemetry', icon: Radio },
              ].map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.tab}
                    onClick={() => onNavigate(action.tab)}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700 transition text-left group"
                  >
                    <Icon className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-medium text-slate-300 group-hover:text-white transition">{action.label}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 mr-auto transition" />
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

