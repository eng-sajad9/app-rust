import React from 'react'
import { LayoutDashboard, KeyRound, MonitorCheck, Skull, Radio, Database, UploadCloud, ChevronLeft } from 'lucide-react'

export default function Sidebar({ activeTab, setActiveTab, revokedCount, devicesCount, activeCount, connectionStatus }) {
  const menuItems = [
    {
      id: 'overview',
      label: 'نظرة عامة',
      sublabel: 'التحليلات والإحصاء',
      icon: LayoutDashboard,
      color: 'blue',
    },
    {
      id: 'generator',
      label: 'مولد التراخيص',
      sublabel: 'إصدار مفاتيح التفعيل',
      icon: KeyRound,
      color: 'indigo',
    },
    {
      id: 'licenses',
      label: 'إدارة التراخيص',
      sublabel: `${devicesCount} جهاز مسجل`,
      icon: MonitorCheck,
      color: 'sky',
    },
    {
      id: 'updates',
      label: 'التحديثات عن بُعد',
      sublabel: 'OTA Targeted Updates',
      icon: UploadCloud,
      color: 'cyan',
    },
    {
      id: 'killswitch',
      label: 'Kill Switch',
      sublabel: 'التعطيل عن بُعد',
      icon: Skull,
      color: 'rose',
      badge: revokedCount,
    },
    {
      id: 'telemetry',
      label: 'رادار التتبع',
      sublabel: 'Live Telemetry Stream',
      icon: Radio,
      color: 'emerald',
    },
    {
      id: 'supabase',
      label: 'إعداد السيرفر',
      sublabel: 'Supabase SQL Setup',
      icon: Database,
      color: 'amber',
    },
  ]

  return (
    <aside className="w-64 shrink-0 bg-[#0b1329] border-l border-slate-800/80 flex flex-col" style={{ minHeight: 'calc(100vh - 60px)' }}>
      {/* Menu Section Label */}
      <div className="px-4 pt-4 pb-2">
        <div className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          قائمة التحكم والسيطرة
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto pb-4">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-right transition-all group relative border ${
                isActive
                  ? 'bg-blue-600/10 border-blue-500/30 text-blue-400 font-semibold shadow-sm'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {/* Active Indicator Strip */}
              {isActive && (
                <div className="absolute right-0 top-2 bottom-2 w-1 bg-blue-500 rounded-l-full" />
              )}

              {/* Icon */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                isActive
                  ? 'bg-blue-500/15 text-blue-400'
                  : 'bg-slate-900/60 text-slate-400 group-hover:bg-slate-800 group-hover:text-slate-200'
              }`}>
                <Icon className="w-4 h-4" />
              </div>

              {/* Labels */}
              <div className="flex-1 min-w-0 text-right">
                <div className={`text-xs font-medium leading-tight ${isActive ? 'text-blue-300 font-bold' : 'text-slate-300'}`}>
                  {item.label}
                </div>
                <div className={`text-[10px] truncate mt-0.5 ${isActive ? 'text-blue-400/80' : 'text-slate-500'}`}>
                  {item.sublabel}
                </div>
              </div>

              {/* Badge */}
              {item.badge > 0 && (
                <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full shrink-0 ${
                  isActive
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {item.badge}
                </span>
              )}

              {/* Active Arrow */}
              {isActive && (
                <ChevronLeft className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-[#090e1f]">
        <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
          {/* Connection indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'online' ? 'bg-emerald-400 shadow-sm shadow-emerald-500/50' :
                connectionStatus === 'checking' ? 'bg-amber-400 animate-pulse' :
                'bg-rose-500'
              }`} />
              <span className="text-[10px] font-semibold text-slate-300">
                {connectionStatus === 'online' ? 'Supabase: متصل' :
                 connectionStatus === 'checking' ? 'جارٍ الاتصال...' :
                 'غير متصل'}
              </span>
            </div>
            <div className="text-[9px] text-slate-400 font-mono">
              {activeCount}/{devicesCount} نشط
            </div>
          </div>

          <div className="text-[10px] text-slate-500 font-mono text-center border-t border-slate-800/80 pt-2">
            Restaurant Admin System v2.0
          </div>
        </div>
      </div>
    </aside>
  )
}

