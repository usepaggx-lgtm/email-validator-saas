const KNOWN_DOMAINS = [
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'live.com',
  'icloud.com', 'protonmail.com', 'proton.me', 'aol.com', 'mail.com',
  'zoho.com', 'yandex.com', 'gmx.com', 'fastmail.com', 'tutanota.com',
]

const COMMON_TYPOS: Record<string, string> = {
  'gmial.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmil.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'email.com': 'gmail.com',
  'yahooo.com': 'yahoo.com',
  'yhoo.com': 'yahoo.com',
  'yahho.com': 'yahoo.com',
  'yahoo.co': 'yahoo.com',
  'hotmal.com': 'hotmail.com',
  'hotmil.com': 'hotmail.com',
  'hotmaill.com': 'hotmail.com',
  'hotmail.co': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outllok.com': 'outlook.com',
  'outloo.com': 'outlook.com',
  'homail.com': 'hotmail.com',
  'concast.net': 'comcast.net',
  'verison.net': 'verizon.net',
}

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }

  return dp[m][n]
}

export function suggestDomain(domain: string): string | undefined {
  const lower = domain.toLowerCase()

  if (COMMON_TYPOS[lower]) return COMMON_TYPOS[lower]

  const knownSet = new Set(KNOWN_DOMAINS)
  if (knownSet.has(lower)) return

  let best: { domain: string; distance: number } | undefined

  for (const known of KNOWN_DOMAINS) {
    const dist = levenshtein(lower, known)
    if (dist <= 2 && (!best || dist < best.distance)) {
      best = { domain: known, distance: dist }
    }
  }

  return best?.domain
}
