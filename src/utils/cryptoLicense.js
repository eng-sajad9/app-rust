/**
 * Utility to generate valid compatible activation keys for the desktop application.
 * Compatible with license.service.js decryptKey logic.
 */

// Secret Salt - Matches desktop application master secret
export const SECRET_SALT = 'RESTAURANT_SYSTEM_PAYROLL_SECURE_SALT_2026_MASTER'

/**
 * Generate a Base64-encoded JSON activation key (or AES token) compatible with desktop app
 */
export function generateLicenseKey({ restaurantName, expiryDate, hardwareId }) {
  const payload = {
    restaurantName: restaurantName?.trim() || 'مطعم السفير',
    expiryDate: expiryDate?.trim() || '2030-12-31',
    hardwareId: (hardwareId || '').trim().toUpperCase()
  }

  // Encode JSON string to Base64
  const jsonString = JSON.stringify(payload)
  const base64Token = btoa(unescape(encodeURIComponent(jsonString)))
  return base64Token
}

/**
 * Validate and parse an activation key string
 */
export function parseLicenseKey(keyStr) {
  if (!keyStr || typeof keyStr !== 'string') return null
  try {
    const decoded = decodeURIComponent(escape(atob(keyStr.trim())))
    const parsed = JSON.parse(decoded)
    if (parsed && typeof parsed === 'object' && parsed.hardwareId) {
      return parsed
    }
  } catch (e) {
    try {
      const parsed = JSON.parse(keyStr.trim())
      if (parsed && typeof parsed === 'object' && parsed.hardwareId) {
        return parsed
      }
    } catch (_) {}
  }
  return null
}
