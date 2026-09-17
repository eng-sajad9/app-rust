import React, { useState } from 'react'
import { MonitorCheck, Search, Filter, Skull, KeyRound, Copy, Check, Edit, Trash2, RefreshCw, Loader2, MonitorOff, Save, X, Trash } from 'lucide-react'
import { generateLicenseKey } from '../utils/cryptoLicense'
import { toggleKillSwitchInSupabase, saveLicenseToSupabase, getSupabaseClient, wipeAllDataFromSupabase } from '../utils/supabaseClient'
import { useToast } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'

export default function LicensesTab({ devices = [], setDevices, onRefresh }) {
  const toast = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [copiedId, setCopiedId] = useState(null)
  const [loading, setLoading] = useState(null)

  // Edit Modal State
  const [editingDevice, setEditingDevice] = useState(null)
  const [editForm, setEditForm] = useState({})

  // Delete Confirm
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, hardwareId: '', name: '' })
  const [wipeConfirm, setWipeConfirm] = useState(false)

  const handleWipeAllData = async () => {
    setWipeConfirm(false)
    setLoading('WIPING_ALL')
    try {
      const ok = await wipeAllDataFromSupabase()
      if (ok) {
        toast.success('تم مسح جميع الأجهزة والتراخيص وسجلات الاتصال من قاعدة البيانات بنجاح!')
        if (onRefresh) await onRefresh()
      } else {
        toast.error('فشل مسح البيانات من السيرفر')
      }
    } catch (err) {
      toast.error('خطأ في مسح البيانات: ' + err.message)
    } finally {
      setLoading(null)
    }
  }

  const handleToggleKillSwitch = async (hardwareId, currentStatus, name) => {
    const nextKill = !currentStatus
    setLoading(hardwareId)
    try {
      await toggleKillSwitchInSupabase(hardwareId, nextKill)
      if (nextKill) {
        toast.error(`تم تفعيل Kill Switch على "${name}"`)
      } else {
        toast.success(`تم إلغاء الحظر عن "${name}"`)
      }
      if (onRefresh) await onRefresh()
    } catch (err) {
      toast.error('خطأ أثناء تحديث حالة الحظر: ' + err.message)
    } finally {
      setLoading(null)
    }
  }

  const handleDeleteDevice = async () => {
    const { hardwareId, name } = deleteConfirm
    setDeleteConfirm({ open: false, hardwareId: '', name: '' })
    setLoading(hardwareId)
    try {
      const client = getSupabaseClient()
      if (client) {
        await client.from('licenses').delete().eq('hardware_id', hardwareId)
      }
      toast.success(`تم حذف ترخيص "${name}" من السيرفر`)
      if (onRefresh) await onRefresh()
    } catch (err) {
      toast.error('خطأ بالحذف: ' + err.message)
    } finally {
      setLoading(null)
    }
  }

  const handleCopyKeyForDevice = (dev) => {
    const key = generateLicenseKey({
      restaurantName: dev.restaurantName,
      expiryDate: dev.expiryDate,
      hardwareId: dev.hardwareId,
    })
    navigator.clipboard.writeText(key)
    setCopiedId(dev.id)
    toast.info('تم نسخ مفتاح التفعيل للحافظة')
    setTimeout(() => setCopiedId(null), 2500)
  }

  const openEdit = (dev) => {
    setEditingDevice(dev)
    setEditForm({
      expiryDate: dev.expiryDate,
      ownerName: dev.ownerName || '',
      phone: dev.phone || '',
      restaurantName: dev.restaurantName,
    })
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editingDevice) return
    setLoading(editingDevice.hardwareId)
    try {
      const updated = { ...editingDevice, ...editForm }
      await saveLicenseToSupabase(updated)
      toast.success(`تم تحديث بيانات "${editForm.restaurantName}" بنجاح`)
      setEditingDevice(null)
      if (onRefresh) await onRefresh()
    } catch (err) {
      toast.error('فشل حفظ التعديل: ' + err.message)
    } finally {
      setLoading(null)
    }
  }

  const filteredDevices = devices.filter((d) => {
    const matchesSearch =
      (d.restaurantName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.hardwareId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.ownerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.phone || '').includes(searchTerm)
    const matchesStatus = !statusFilter ||
      (statusFilter === 'revoked' ? (d.killSwitch || d.status === 'revoked') : d.status === statusFilter)
    return matchesSearch && matchesStatus
  })

  const activeCount = devices.filter((d) => d.status === 'active' && !d.killSwitch).length
  const revokedCount = devices.filter((d) => d.killSwitch || d.status === 'revoked').length
  const expiredCount = devices.filter((d) => d.status === 'expired').length

  return (
    <div className="space-y-6">
      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        title="حذف الترخيص نهائياً"
        message={`هل أنت متأكد من حذف ترخيص "${deleteConfirm.name}" (${deleteConfirm.hardwareId}) نهائياً من قاعدة البيانات؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmLabel="نعم، احذف نهائياً"
        cancelLabel="تراجع"
        danger={true}
        onConfirm={handleDeleteDevice}
        onCancel={() => setDeleteConfirm({ open: false, hardwareId: '', name: '' })}
      />

      {/* Wipe All Data Confirm */}
      <ConfirmDialog
        isOpen={wipeConfirm}
        title="مسح وتفريغ كافة البيانات نهائياً"
        message="هل أنت متأكد من حذف وإلغاء جميع التراخيص، الأجهزة المسجلة، وسجلات الاتصال والرموز من قاعدة البيانات؟ سيتم مسح السيرفر بالكامل وإعادة السجل لصفر!"
        confirmLabel="نعم، امسح كل البيانات نهائياً"
        cancelLabel="تراجع"
        danger={true}
        onConfirm={handleWipeAllData}
        onCancel={() => setWipeConfirm(false)}
      />

      {/* Header */}
      <div className="bg-[#0c1427] p-6 rounded-2xl border border-slate-800/80 flex flex-wrap justify-between items-center gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <MonitorCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">إدارة التراخيص والأجهزة</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              إجمالي: {devices.length} جهاز — {activeCount} نشط، {revokedCount} محظور، {expiredCount} منتهٍ
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setWipeConfirm(true)}
            disabled={loading !== null}
            className="px-4 py-2 bg-rose-950/40 border border-rose-800/40 hover:bg-rose-900/60 text-xs font-semibold text-rose-300 rounded-xl transition flex items-center gap-2 disabled:opacity-50"
            title="مسح وتفريغ جميع التراخيص والسجلات من قاعدة البيانات"
          >
            <Trash className="w-3.5 h-3.5" />
            <span>مسح جميع الأجهزة من السيرفر</span>
          </button>

          <button
            onClick={onRefresh}
            disabled={loading !== null}
            className="px-4 py-2 bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-xs font-semibold text-slate-300 rounded-xl transition flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>تحديث من السيرفر</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-[#0c1427] p-4 rounded-2xl border border-slate-800/80 flex flex-wrap justify-between items-center gap-3">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            placeholder="البحث باسم المطعم، Hardware ID، المالك، أو الهاتف..."
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
            <option value="active">نشط (ساري)</option>
            <option value="expired">منتهي الصلاحية</option>
            <option value="revoked">محظور (Kill Switch)</option>
          </select>
        </div>
        <div className="text-xs font-mono text-slate-400">
          {filteredDevices.length} / {devices.length} نتيجة
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0c1427] rounded-2xl border border-slate-800/80 overflow-hidden shadow-sm">
        {devices.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <MonitorOff className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-400">لا توجد تراخيص مسجلة بعد</p>
            <p className="text-xs text-slate-500">أضف ترخيصاً جديداً من تاب "مولد التراخيص"</p>
          </div>
        ) : filteredDevices.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Search className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-400">لا نتائج تطابق بحثك</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-4 w-8 text-center">#</th>
                  <th className="p-4">المطعم والمنشأة</th>
                  <th className="p-4">Hardware ID</th>
                  <th className="p-4">المالك / الهاتف</th>
                  <th className="p-4">تاريخ الانتهاء</th>
                  <th className="p-4 text-center">الحالة</th>
                  <th className="p-4 text-center">Kill Switch</th>
                  <th className="p-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredDevices.map((dev, idx) => {
                  const isRevoked = dev.killSwitch || dev.status === 'revoked'
                  const isExpired = dev.status === 'expired'
                  const isLoadingThis = loading === dev.hardwareId

                  return (
                    <tr
                      key={dev.id}
                      className={`hover:bg-slate-900/40 transition ${isRevoked ? 'bg-rose-950/10' : ''}`}
                    >
                      <td className="p-4 font-mono text-slate-500 text-center text-[11px]">{idx + 1}</td>
                      <td className="p-4">
                        <div className="font-bold text-white text-xs">{dev.restaurantName}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          آخر نبضة: {dev.lastPing}
                        </div>
                        <div className="text-[10px] text-blue-400 mt-0.5">
                          {dev.employeesCount} موظف | {dev.driversCount} سائق
                        </div>
                      </td>
                      <td className="p-4 font-mono text-blue-300 font-bold text-[11px] tracking-wider whitespace-nowrap dir-ltr">
                        {dev.hardwareId}
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-slate-200 text-xs">{dev.ownerName || 'غير محدد'}</div>
                        <div className="text-[11px] font-mono text-slate-400">{dev.phone || 'بدون هاتف'}</div>
                      </td>
                      <td className="p-4 font-mono font-bold text-amber-400 whitespace-nowrap">{dev.expiryDate}</td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold ${
                          isRevoked
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                            : isExpired
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isRevoked ? 'bg-rose-500' : isExpired ? 'bg-amber-500' : 'bg-emerald-400 animate-pulse'}`} />
                          {isRevoked ? 'محظور' : isExpired ? 'منتهٍ' : 'نشط'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleToggleKillSwitch(dev.hardwareId, isRevoked, dev.restaurantName)}
                          disabled={isLoadingThis}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition border flex items-center gap-1.5 mx-auto ${
                            isRevoked
                              ? 'bg-rose-600 text-white border-rose-500'
                              : 'bg-slate-900 text-slate-400 border-slate-700/80 hover:text-rose-400 hover:border-rose-500/30'
                          }`}
                        >
                          {isLoadingThis ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Skull className="w-3.5 h-3.5" />
                          )}
                          <span className="whitespace-nowrap">{isRevoked ? 'مُعطّل' : 'تعطيل'}</span>
                        </button>
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleCopyKeyForDevice(dev)}
                            className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl transition"
                            title="نسخ مفتاح التفعيل"
                          >
                            {copiedId === dev.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => openEdit(dev)}
                            className="p-2 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl transition"
                            title="تعديل الترخيص"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ open: true, hardwareId: dev.hardwareId, name: dev.restaurantName })}
                            disabled={isLoadingThis}
                            className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition disabled:opacity-40"
                            title="حذف من السجل"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white">تعديل الترخيص</h3>
                <p className="text-[11px] text-blue-400 font-mono mt-0.5">{editingDevice.hardwareId}</p>
              </div>
              <button
                onClick={() => setEditingDevice(null)}
                className="p-1.5 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveEdit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">اسم المطعم / المنشأة</label>
                <input
                  type="text"
                  value={editForm.restaurantName || ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, restaurantName: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 font-bold text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">اسم المالك</label>
                  <input
                    type="text"
                    value={editForm.ownerName || ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, ownerName: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">رقم الهاتف</label>
                  <input
                    type="text"
                    value={editForm.phone || ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">تاريخ الانتهاء الجديد</label>
                <input
                  type="date"
                  value={editForm.expiryDate || ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, expiryDate: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 font-mono text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading !== null}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>حفظ التعديلات</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingDevice(null)}
                  className="px-5 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-semibold hover:bg-slate-700 transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

