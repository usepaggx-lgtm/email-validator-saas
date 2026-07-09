const GIBBERISH_PATTERNS = [
  /^[a-z]{1}[0-9]{6,}[a-z]{0,2}$/i,
  /^[a-z]{0,2}[0-9]{6,}[a-z]{1}$/i,
  /^[0-9]{8,}[a-z]{2,}$/i,
  /^[a-z]{2,}[0-9]{8,}$/i,
  /^(.)\1{5,}/,
  /^[a-z]{1}\d{4,}[a-z]{1}\d{1,}$/i,
  /^.{16,}$/,
]

const ENTROPY_CHECK_LENGTH = 8

function entropy(s: string): number {
  const freq: Record<string, number> = {}
  for (const ch of s) { freq[ch] = (freq[ch] || 0) + 1 }
  return -Object.values(freq).reduce((sum, c) => {
    const p = c / s.length
    return sum + p * Math.log2(p)
  }, 0)
}

export function isGibberish(username: string): boolean {
  if (!username) return false

  const lower = username.toLowerCase()

  for (const pattern of GIBBERISH_PATTERNS) {
    if (pattern.test(lower)) return true
  }

  if (lower.length >= ENTROPY_CHECK_LENGTH) {
    const e = entropy(lower)
    if (e > 3.8) return true
  }

  const vowelCount = (lower.match(/[aeiou]/g) || []).length
  const consonantCount = (lower.match(/[bcdfghjklmnpqrstvwxyz]/g) || []).length
  if (consonantCount > 0 && vowelCount / consonantCount < 0.15 && lower.length >= 6) return true

  const digits = (lower.match(/\d/g) || []).length
  if (digits > lower.length * 0.5 && lower.length >= 8) return true

  return false
}
