const fs = require('fs')
const content = fs.readFileSync('src/views/KeyGeneratorTab.jsx', 'utf8')
const lines = content.split('\n')

// Remove last 4 lines (closing div, ), }, empty)
const withoutEnd = lines.slice(0, -4).join('\n')

const modal = `

      {/* Delivery Token Modal */}
      {deliveryModal && deliveryToken && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(2,6,23,0.92)', backdropFilter: 'blur(12px)' }}>
          <div className="w-full max-w-lg bg-slate-900 border border-violet-500/30 rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-5 bg-gradient-to-r from-violet-950/60 to-indigo-950/60 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-violet-500/20 text-violet-400 flex items-center justify-center"><Share2 className="w-5 h-5" /></div>
                <div>
                  <h3 className="text-sm font-black text-white">رمز التسليم الآمن</h3>
                  <p className="text-[11px] text-violet-300/70">صالح 24 ساعة — استخدام واحد فقط</p>
                </div>
              </div>
              <button onClick={() => setDeliveryModal(false)} className="text-slate-500 hover:text-white p-1.5 hover:bg-slate-800 rounded-xl transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-center text-xs text-slate-400">ترخيص: <span className="text-white font-bold">{justGenerated?.restaurantName}</span></p>
              <div className="text-center space-y-1">
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">اقرأ هذا الرمز بصوت عالٍ للعميل عبر الهاتف</p>
                <div className="inline-flex items-center gap-3 cursor-pointer group" onClick={handleCopyTokenOnly}>
                  <span className="text-5xl font-black font-mono tracking-[0.2em] text-violet-300 select-all">{deliveryToken}</span>
                  {deliveryCopied
                    ? <Check className="w-5 h-5 text-emerald-400" />
                    : <Copy className="w-5 h-5 text-slate-600 group-hover:text-slate-400 transition" />
                  }
                </div>
                <p className="text-[10px] text-slate-600">اضغط على الرمز لنسخه</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center gap-2">
                  <p className="text-[10px] text-slate-500 font-bold">QR للمسح السريع</p>
                  <div className="w-36 h-36 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
                    <img src={getQrUrl(deliveryToken)} alt="QR Code" className="w-36 h-36" />
                  </div>
                  <p className="text-[9px] text-slate-600 text-center">المطعم يمسحه بهاتفه</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-500 font-bold">خطوات التسليم</p>
                  {['اتصل بالمطعم هاتفياً', 'اقرأ الرمز: ' + deliveryToken, 'المطعم يفتح أي متصفح', 'يكتب الرابط ويدخل الرمز', 'يضغط نسخ ويفعّل التطبيق'].map((s, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-violet-500/20 text-violet-400 font-black text-[9px] flex items-center justify-center shrink-0">{i+1}</span>
                      <span className="text-[10px] text-slate-300 leading-tight">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] text-slate-500 font-bold">رابط بوابة الاستلام:</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-950 rounded-xl px-3 py-2 font-mono text-[10px] text-indigo-300 border border-slate-800 truncate dir-ltr">{getDeliveryUrl(deliveryToken)}</div>
                  <button
                    onClick={handleCopyDeliveryUrl}
                    className={'shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 ' + (deliveryUrlCopied ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300')}
                  >
                    {deliveryUrlCopied ? <><Check className="w-3 h-3" /><span>تم</span></> : <><Copy className="w-3 h-3" /><span>نسخ</span></>}
                  </button>
                  <a href={getDeliveryUrl(deliveryToken)} target="_blank" rel="noopener noreferrer"
                    className="shrink-0 p-2 bg-violet-600/20 text-violet-400 hover:bg-violet-600/40 border border-violet-500/25 rounded-xl transition" title="فتح للاختبار">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-violet-950/30 border border-violet-500/20 rounded-xl">
                <PhoneCall className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-violet-300">اتصل وقل: <strong>افتح المتصفح واكتب الرابط ثم اكتب الرمز: {deliveryToken}</strong></p>
              </div>
              <button onClick={() => setDeliveryModal(false)} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition">إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
`

const final = withoutEnd + '\n' + modal
fs.writeFileSync('src/views/KeyGeneratorTab.jsx', final, 'utf8')
console.log('Done! Lines:', final.split('\n').length)
