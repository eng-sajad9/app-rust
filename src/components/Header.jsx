import React, { useState, useEffect } from 'react'
import { ShieldAlert, RefreshCw, Wifi, WifiOff, Loader2, Clock } from 'lucide-react'

export default function Header({ devicesCount, activeCount, onRefresh, isRefreshing, connectionStatus, lastRefreshed }) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (date) =>
    date.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  const formatDate = (date) =>
    date.toLocaleDateString('ar-IQ', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })

  const formatLastRefresh = (date) => {
    if (!date) return 'لم يتم بعد'
    const diff = Math.floor((new Date() - date) / 1000)
    if (diff < 60) return `منذ ${diff} ثانية`
    if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`
    return date.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <header className="glass-panel sticky top-0 z-40 border-b border-slate-800 px-5 py-3 flex flex-wrap justify-between items-center gap-3">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white tracking-tight leading-tight flex items-center gap-2">
            مركز السيطرة والتراخيص عن بُعد
            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-mono border border-slate-700">
              v2.0 Pro
            </span>
          </h1>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            لوحة الإدارة المركزية — Hardware-Bound License System
          </p>
        </div>
      </div>

      {/* Center: Live Clock */}
      <div className="hidden lg:flex flex-col items-center">
        <div className="text-sm font-bold font-mono text-white tabular-nums tracking-wider">
          {formatTime(currentTime)}
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5">{formatDate(currentTime)}</div>
      </div>

      {/* Right Side Controls */}
      <div className="flex items-center gap-2.5">
        {/* Devices Quick Stats */}
        <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
          <div className="text-center">
            <div className="font-bold text-white tabular-nums">{devicesCount}</div>
            <div className="text-[9px] text-slate-400 font-medium">إجمالي</div>
          </div>
          <div className="w-px h-5 bg-slate-800" />
          <div className="text-center">
            <div className="font-bold text-emerald-400 tabular-nums">{activeCount}</div>
            <div className="text-[9px] text-slate-400 font-medium">نشط</div>
          </div>
        </div>

        {/* Connection Badge */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
          connectionStatus === 'online'
            ? 'bg-slate-900 border-slate-700 text-emerald-400'
            : connectionStatus === 'checking'
            ? 'bg-slate-900 border-slate-800 text-slate-400'
            : 'bg-red-950/40 border-red-800/60 text-red-400'
        }`}>
          {connectionStatus === 'online' ? (
            <Wifi className="w-3.5 h-3.5 text-emerald-400 status-dot-online" />
          ) : connectionStatus === 'checking' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <WifiOff className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">
            {connectionStatus === 'online' ? 'Supabase متصل' : connectionStatus === 'checking' ? 'جارٍ الاتصال...' : 'غير متصل'}
          </span>
        </div>

        {/* Last refresh */}
        {lastRefreshed && (
          <div className="hidden lg:flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>{formatLastRefresh(lastRefreshed)}</span>
          </div>
        )}

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-lg transition disabled:opacity-50"
          title="تحديث البيانات"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>

        {/* Admin Avatar */}
        <div className="flex items-center gap-2.5 ps-3 border-s border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center">
            مـ
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-white leading-tight">المدير العام</div>
            <div className="text-[10px] text-slate-400 font-mono">admin@restaurant.app</div>
          </div>
        </div>
      </div>
    </header>
  )
}
