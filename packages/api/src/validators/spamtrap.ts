const SPAMTRAP_DOMAINS = new Set([
  'spamtrap.com', 'spamtrap.net', 'spamtrap.org',
  'trap.com', 'spam-trap.com', 'spamtraps.com',
  'mailtrap.io', 'mail-trap.com',
  'antispam.com', 'spamtest.me',
  'test.com', 'testing.com',
  'example.com', 'example.net', 'example.org',
  'mailinator.com', 'mailinator.net',
  'guerrillamail.com', 'guerrillamail.net',
  'trashmail.com', 'trashmail.net',
  '10minutemail.com', '10minutemail.net',
  'throwaway.email', 'throwaway.io',
  'spamgourmet.com', 'spamgourmet.net',
  'spam.la', 'spam.su',
  'mailcatch.com', 'mailexpire.com',
  'mailmetrash.com', 'mt2009.com',
  'boun.cr', 'bouncemail.net',
  'disposable.com', 'dispostable.com',
  'getnada.com', 'nada.email',
  'yopmail.com', 'yopmail.net',
  'spambox.us', 'spambox.info',
])

const SPAMTRAP_LOCAL_PARTS = new Set([
  'spamtrap', 'trap', 'honeypot', 'spam',
  'abuse', 'postmaster', 'mailer-daemon',
  'nospam', 'remove-me', 'unsubscribe',
  'test', 'testing', 'nobody', 'noreply',
])

const SPAMTRAP_PATTERNS = [
  /^spam.*trap/i,
  /^trap.*spam/i,
  /^honeypot/i,
  /^remove.*me/i,
]

export function isSpamtrap(email: string, username: string, domain: string): boolean {
  const lowerDomain = domain.toLowerCase()
  const lowerUser = username.toLowerCase()

  if (SPAMTRAP_DOMAINS.has(lowerDomain)) return true
  if (SPAMTRAP_LOCAL_PARTS.has(lowerUser)) return true

  for (const pattern of SPAMTRAP_PATTERNS) {
    if (pattern.test(lowerUser)) return true
  }

  return false
}
