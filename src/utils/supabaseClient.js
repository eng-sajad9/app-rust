import { createClient } from '@supabase/supabase-js'

const DEFAULT_URL = 'https://ksnkiylrqdfvebeacpeg.supabase.co'
const DEFAULT_KEY = 'sb_publishable_s7XEfFey0yAYntiDsnhI-A_o4Mke27b'

// Use globalThis to survive Vite HMR module re-evaluations
// This prevents "Multiple GoTrueClient instances" warnings in dev mode
if (!globalThis.__supabaseCache) {
  globalThis.__supabaseCache = { client: null, url: null, key: null }
}

export function getSupabaseConfig() {
  const savedUrl = localStorage.getItem('SUPABASE_PROJECT_URL') || DEFAULT_URL
  const savedKey = localStorage.getItem('SUPABASE_ANON_KEY') || DEFAULT_KEY
  return { url: savedUrl, key: savedKey }
}

export function saveSupabaseConfig(url, key) {
  localStorage.setItem('SUPABASE_PROJECT_URL', url.trim())
  localStorage.setItem('SUPABASE_ANON_KEY', key.trim())
  // Invalidate singleton on config change
  globalThis.__supabaseCache = { client: null, url: null, key: null }
}

export function getSupabaseClient() {
  const { url, key } = getSupabaseConfig()
  if (!url) return null
  const cache = globalThis.__supabaseCache
  // Return cached instance if config hasn't changed
  if (cache.client && cache.url === url && cache.key === key) {
    return cache.client
  }
  try {
    const client = createClient(url, key)
    globalThis.__supabaseCache = { client, url, key }
    return client
  } catch (err) {
    console.error('Supabase init error:', err)
    return null
  }
}


// ────────────────────────────────────────────────────────────
// DELIVERY TOKEN SYSTEM — Secure License Transfer via Short Code
// ────────────────────────────────────────────────────────────

const SAFE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateSafeToken(length = 8) {
  let token = ''
  for (let i = 0; i < length; i++) {
    token += SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)]
  }
  return token.slice(0, 4) + '-' + token.slice(4)
}

export async function createDeliveryToken(licenseKey, hardwareId, restaurantName) {
  const client = getSupabaseClient()
  if (!client) throw new Error('لا يوجد اتصال بـ Supabase')
  const token = generateSafeToken()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  const { error } = await client.from('license_tokens').insert([{
    token, license_key: licenseKey, hardware_id: hardwareId,
    restaurant_name: restaurantName, expires_at: expiresAt, used: false,
  }])
  if (error) {
    if (error.code === 'PGRST204' || error.message?.includes('license_tokens') || error.message?.includes('schema cache')) {
      throw new Error('جدول (license_tokens) غير مضاف في قاعدة البيانات بعد! يرجى التوجه لتبويب "إعدادات Supabase" في اللوحة ونسخ سكريبت SQL الجديد وتشغيله في Supabase SQL Editor.')
    }
    throw new Error('فشل إنشاء رمز التسليم: ' + error.message)
  }
  return token
}

export async function redeemDeliveryToken(rawToken) {
  const client = getSupabaseClient()
  if (!client) throw new Error('لا يوجد اتصال بالسيرفر')
  const token = rawToken.toUpperCase().replace(/[^A-Z0-9-]/g, '')
  const { data, error } = await client.from('license_tokens').select('*').eq('token', token).single()
  if (error || !data) throw new Error('الرمز غير صحيح — تحقق من الأحرف وحاول مجدداً')
  if (data.used) throw new Error('تم استخدام هذا الرمز مسبقاً')
  if (new Date(data.expires_at) < new Date()) throw new Error('انتهت صلاحية الرمز (24 ساعة)')
  return { token: data.token, licenseKey: data.license_key, hardwareId: data.hardware_id, restaurantName: data.restaurant_name, expiresAt: data.expires_at }
}

export async function markTokenAsUsed(rawToken) {
  const client = getSupabaseClient()
  if (!client) return
  await client.from('license_tokens').update({ used: true, used_at: new Date().toISOString() }).eq('token', rawToken.toUpperCase())
}

export async function fetchDeliveryTokensFromSupabase() {
  const client = getSupabaseClient()
  if (!client) return []
  const { data, error } = await client.from('license_tokens').select('*').order('created_at', { ascending: false }).limit(50)
  if (error) return []
  return data.map((t) => ({ id: t.id, token: t.token, restaurantName: t.restaurant_name, hardwareId: t.hardware_id, used: t.used, usedAt: t.used_at, expiresAt: t.expires_at, createdAt: t.created_at }))
}

/**
 * Fetch all licenses from Supabase
 */

export async function fetchLicensesFromSupabase() {
  const client = getSupabaseClient()
  if (!client) return []
  try {
    const { data, error } = await client
      .from('licenses')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching licenses:', error)
      return []
    }
    return data.map((item) => ({
      id: item.id,
      restaurantName: item.restaurant_name,
      hardwareId: item.hardware_id,
      ownerName: item.owner_name || '',
      phone: item.phone || '',
      expiryDate: item.expiry_date,
      status: item.revoked ? 'revoked' : (item.kill_switch ? 'revoked' : (item.status || 'active')),
      killSwitch: item.kill_switch || false,
      employeesCount: item.employees_count || 0,
      driversCount: item.drivers_count || 0,
      lastPing: item.updated_at ? new Date(item.updated_at).toLocaleString('ar-IQ') : 'جديد',
      createdAt: item.created_at ? item.created_at.substring(0, 10) : ''
    }))
  } catch (err) {
    console.error('Fetch licenses exception:', err)
    return []
  }
}

/**
 * Save or insert license into Supabase
 */
export async function saveLicenseToSupabase(dev) {
  const client = getSupabaseClient()
  if (!client) return null
  try {
    const payload = {
      hardware_id: dev.hardwareId.trim().toUpperCase(),
      restaurant_name: dev.restaurantName,
      owner_name: dev.ownerName || '',
      phone: dev.phone || '',
      expiry_date: dev.expiryDate || '2030-12-31',
      kill_switch: dev.killSwitch || false,
      revoked: dev.status === 'revoked',
      status: dev.status || 'active'
    }

    const { data, error } = await client
      .from('licenses')
      .upsert(payload, { onConflict: 'hardware_id' })
      .select()

    if (error) {
      console.error('Error saving license to Supabase:', error)
      throw error
    }
    return data?.[0]
  } catch (err) {
    console.error('Save license exception:', err)
    throw err
  }
}

/**
 * Toggle Remote Kill Switch in Supabase (INSTANT)
 */
export async function toggleKillSwitchInSupabase(hardwareId, killSwitchState, revokedState = false) {
  const client = getSupabaseClient()
  if (!client) return false
  const cleanHwId = hardwareId.trim().toUpperCase()
  const isBlocked = killSwitchState || revokedState

  try {
    // 1. Try updating existing license first (preserves existing restaurant_name if record exists)
    const { data, error: updateErr } = await client
      .from('licenses')
      .update({
        kill_switch: killSwitchState,
        revoked: isBlocked,
        status: isBlocked ? 'revoked' : 'active',
        updated_at: new Date().toISOString()
      })
      .eq('hardware_id', cleanHwId)
      .select()

    // 2. If record doesn't exist yet, insert a new license entry
    if (!updateErr && (!data || data.length === 0)) {
      await client.from('licenses').upsert({
        hardware_id: cleanHwId,
        restaurant_name: 'جهاز (' + cleanHwId.slice(0, 8) + ')',
        kill_switch: killSwitchState,
        revoked: isBlocked,
        status: isBlocked ? 'revoked' : 'active',
        updated_at: new Date().toISOString()
      }, { onConflict: 'hardware_id' })
    }

    // 3. Insert an instant telemetry ping override so telemetry queries detect it immediately
    await client.from('telemetry_pings').insert({
      hardware_id: cleanHwId,
      kill_switch: killSwitchState,
      revoked: isBlocked,
      hostname: 'REMOTE-KILL-SWITCH-INSTANT',
      platform: 'ADMIN_DASHBOARD'
    })

    return true
  } catch (err) {
    console.error('Toggle kill switch exception:', err)
    return false
  }
}

/**
 * Wipe/Delete all licenses, telemetry logs, and tokens from Supabase
 */
export async function wipeAllDataFromSupabase() {
  const client = getSupabaseClient()
  if (!client) return false
  try {
    await Promise.all([
      client.from('licenses').delete().neq('hardware_id', '___NONE___'),
      client.from('telemetry_pings').delete().neq('hardware_id', '___NONE___'),
      client.from('license_tokens').delete().neq('token', '___NONE___')
    ])
    return true
  } catch (err) {
    console.error('Wipe data exception:', err)
    return false
  }
}

/**
 * Fetch Telemetry logs from Supabase
 */
export async function fetchTelemetryLogsFromSupabase() {
  const client = getSupabaseClient()
  if (!client) return []
  try {
    const { data, error } = await client
      .from('telemetry_pings')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching telemetry logs:', error)
      return []
    }

    return data.map((log) => ({
      id: log.id,
      hardwareId: log.hardware_id,
      restaurantName: 'مطعم (' + log.hardware_id.slice(0, 8) + ')',
      employeesCount: log.employees_count || 0,
      driversCount: log.drivers_count || 0,
      platform: log.platform || 'Windows',
      hostname: log.hostname || 'RESTAURANT-PC',
      appVersion: log.app_version || '1.0.0',
      status: (log.kill_switch || log.revoked) ? 'REVOKED (تم إيقافه عن بُعد)' : 'OK (نشط ورسمي)',
      timestamp: log.timestamp ? new Date(log.timestamp).toLocaleString('ar-IQ') : ''
    }))
  } catch (err) {
    console.error('Fetch telemetry exception:', err)
    return []
  }
}

/**
 * Fetch Updates from Supabase
 */
export async function fetchUpdatesFromSupabase() {
  const client = getSupabaseClient()
  if (!client) return []
  try {
    const { data, error } = await client
      .from('updates')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching updates:', error)
      return []
    }

    return data.map((u) => ({
      id: u.id,
      version: u.version,
      targetHardwareId: u.target_hardware_id,
      targetName: u.target_name || (u.target_hardware_id === '*' ? 'جميع المطاعم (عام)' : u.target_hardware_id),
      downloadUrl: u.download_url,
      mandatory: u.mandatory || false,
      notes: u.notes || '',
      status: u.status || 'active',
      createdAt: u.created_at ? u.created_at.substring(0, 16).replace('T', ' ') : ''
    }))
  } catch (err) {
    console.error('Fetch updates exception:', err)
    return []
  }
}

/**
 * Publish update to Supabase
 */
export async function publishUpdateToSupabase(updateObj) {
  const client = getSupabaseClient()
  if (!client) return null
  try {
    const payload = {
      version: updateObj.version,
      target_hardware_id: updateObj.targetHardwareId || '*',
      target_name: updateObj.targetName || 'جميع المطاعم',
      download_url: updateObj.downloadUrl,
      mandatory: updateObj.mandatory || false,
      notes: updateObj.notes || '',
      status: 'active'
    }

    let { data, error } = await client
      .from('updates')
      .insert([payload])
      .select()

    // Fallback if target_name column missing in DB schema
    if (error && (error.code === 'PGRST204' || error.message?.includes('target_name'))) {
      delete payload.target_name
      const retryRes = await client.from('updates').insert([payload]).select()
      data = retryRes.data
      error = retryRes.error
    }

    if (error) {
      console.error('Error publishing update to Supabase:', error)
      throw error
    }
    return data?.[0]
  } catch (err) {
    console.error('Publish update exception:', err)
    throw err
  }
}

/**
 * Revoke update in Supabase
 */
export async function revokeUpdateInSupabase(id) {
  const client = getSupabaseClient()
  if (!client) return false
  try {
    const { error } = await client
      .from('updates')
      .update({ status: 'revoked' })
      .eq('id', id)

    if (error) {
      console.error('Error revoking update:', error)
      return false
    }
    return true
  } catch (err) {
    console.error('Revoke update exception:', err)
    return false
  }
}

/**
 * Upload update executable file directly to Supabase Storage
 */
export async function uploadUpdateFileToSupabase(file, version) {
  const client = getSupabaseClient()
  if (!client) throw new Error('يرجى التأكد من ربط لوحة التحكم بـ Supabase أولاً')
  
  const fileExt = file.name.split('.').pop()
  const filePath = `releases/update-v${version}-${Date.now()}.${fileExt}`
  
  const { data, error } = await client.storage
    .from('updates')
    .upload(filePath, file, { upsert: true })

  if (error) {
    console.error('Storage upload error:', error)
    if (error.message && error.message.includes('exceeded the maximum allowed size')) {
      throw new Error('حجم الملف يتجاوز الحد الأقصى المسموح في Supabase (50MB عادةً). يمكنك رفع الملف على Google Drive أو خادم مباشر وإلصاق الرابط في مربع "رابط التحميل المباشر".')
    }
    throw new Error('فشل رفع الملف لـ Supabase Storage: ' + error.message)
  }

  const { data: publicUrlData } = client.storage
    .from('updates')
    .getPublicUrl(filePath)

  return publicUrlData.publicUrl
}
