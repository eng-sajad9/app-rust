import React from 'react'
import { AlertTriangle, X } from 'lucide-react'

export default function ConfirmDialog({ isOpen, title, message, confirmLabel = 'تأكيد', cancelLabel = 'إلغاء', onConfirm, onCancel, danger = true }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className={`p-5 border-b border-slate-800 flex items-center gap-3 ${danger ? 'bg-red-950/30' : 'bg-indigo-950/30'}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${danger ? 'bg-red-500/20 text-red-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-extrabold text-white">{title}</h3>
          </div>
          <button onClick={onCancel} className="text-slate-500 hover:text-slate-300 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          <p className="text-xs text-slate-300 leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl font-bold text-xs transition shadow-lg ${
              danger
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
            }`}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
