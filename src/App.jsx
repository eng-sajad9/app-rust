import React, { useState, useEffect, useCallback } from 'react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import OverviewTab from './views/OverviewTab'
import KeyGeneratorTab from './views/KeyGeneratorTab'
import LicensesTab from './views/LicensesTab'
import KillSwitchTab from './views/KillSwitchTab'
import TelemetryTab from './views/TelemetryTab'
import SupabaseSetupTab from './views/SupabaseSetupTab'
import UpdatesTab from './views/UpdatesTab'
import { ToastProvider, useToast } from './components/Toast'
import {
  fetchLicensesFromSupabase,
  fetchTelemetryLogsFromSupabase,
  saveLicenseToSupabase,
  getSupabaseClient,
} from './utils/supabaseClient'

function AppInner() {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('overview')
  const [devices, setDevices] = useState([])
  const [telemetryLogs, setTelemetryLogs] = useState([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('checking') // 'online' | 'offline' | 'checking'
  const [lastRefreshed, setLastRefreshed] = useState(null)

  const checkConnection = useCallback(async () => {
    try {
      const client = getSupabaseClient()
      if (!client) {
        setConnectionStatus('offline')
        return false
      }
      // Simple ping: just check if we get a response (even an error means we're connected)
      const { error } = await client.from('licenses').select('id').limit(1)
      if (error && error.code !== 'PGRST116') {
        // PGRST116 = "no rows returned" which still means connected
        setConnectionStatus('offline')
        return false
      }
      setConnectionStatus('online')
      return true
    } catch {
      setConnectionStatus('offline')
      return false
    }
  }, [])

  const loadDataFromSupabase = useCallback(async (silent = false) => {
    setIsRefreshing(true)
    try {
      const [lics, pings] = await Promise.all([
        fetchLicensesFromSupabase(),
        fetchTelemetryLogsFromSupabase(),
      ])
      if (lics !== undefined) setDevices(lics)
      if (pings !== undefined) setTelemetryLogs(pings)
      setConnectionStatus('online')
      setLastRefreshed(new Date())
      if (!silent) toast.success('تم تحديث البيانات من السيرفر بنجاح')
    } catch (err) {
      setConnectionStatus('offline')
      if (!silent) toast.error('فشل تحديث البيانات: ' + err.message)
    } finally {
      setIsRefreshing(false)
    }
  }, [toast])

  useEffect(() => {
    checkConnection().then((ok) => {
      if (ok) loadDataFromSupabase(true)
    })
    // Auto-refresh every 15 seconds silently
    const interval = setInterval(() => loadDataFromSupabase(true), 15000)
    return () => clearInterval(interval)
  }, [])

  const handleAddDevice = async (newDev) => {
    try {
      await saveLicenseToSupabase(newDev)
      await loadDataFromSupabase(true)
      toast.success(`تم إضافة ترخيص جديد لـ "${newDev.restaurantName}" بنجاح!`)
    } catch (err) {
      toast.error('فشل حفظ الترخيص: ' + err.message)
    }
  }

  const revokedCount = devices.filter((d) => d.killSwitch || d.status === 'revoked').length
  const activeCount = devices.filter((d) => d.status === 'active' && !d.killSwitch).length

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-indigo-500/30 selection:text-white"
      dir="rtl"
    >
      <Header
        activeTab={activeTab}
        devicesCount={devices.length}
        activeCount={activeCount}
        onRefresh={() => loadDataFromSupabase(false)}
        isRefreshing={isRefreshing}
        connectionStatus={connectionStatus}
        lastRefreshed={lastRefreshed}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          revokedCount={revokedCount}
          devicesCount={devices.length}
          activeCount={activeCount}
          connectionStatus={connectionStatus}
        />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto" style={{ maxWidth: 'calc(100vw - 256px)' }}>
          {activeTab === 'overview' && (
            <OverviewTab
              devices={devices}
              telemetryLogs={telemetryLogs}
              onNavigate={(tab) => setActiveTab(tab)}
              isLoading={isRefreshing && devices.length === 0}
            />
          )}

          {activeTab === 'generator' && (
            <KeyGeneratorTab onAddDevice={handleAddDevice} />
          )}

          {activeTab === 'licenses' && (
            <LicensesTab
              devices={devices}
              setDevices={setDevices}
              onRefresh={() => loadDataFromSupabase(true)}
            />
          )}

          {activeTab === 'updates' && <UpdatesTab devices={devices} />}

          {activeTab === 'killswitch' && (
            <KillSwitchTab
              devices={devices}
              setDevices={setDevices}
              onRefresh={() => loadDataFromSupabase(true)}
            />
          )}

          {activeTab === 'telemetry' && (
            <TelemetryTab
              telemetryLogs={telemetryLogs}
              onRefresh={() => loadDataFromSupabase(false)}
              isRefreshing={isRefreshing}
            />
          )}

          {activeTab === 'supabase' && <SupabaseSetupTab onReconnect={() => {
            checkConnection().then(() => loadDataFromSupabase(true))
          }} />}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  )
}
