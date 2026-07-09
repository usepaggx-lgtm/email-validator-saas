const EMAIL_REGEX = /^(?!\.)(?!.*\.\.)(?!.*\.$)[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/

export function validateSyntax(email: string): { valid: boolean; username?: string; domain?: string; error?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' }
  }

  const trimmed = email.trim().toLowerCase()
  if (trimmed.length > 254) {
    return { valid: false, error: 'Email exceeds maximum length (254 characters)' }
  }

  const parts = trimmed.split('@')
  if (parts.length !== 2) {
    return { valid: false, error: 'Email must contain exactly one @ symbol' }
  }

  const [username, domain] = parts

  if (!username || username.length > 64) {
    return { valid: false, error: 'Username part is invalid or too long (max 64 characters)' }
  }

  if (!domain || domain.length > 255) {
    return { valid: false, error: 'Domain part is invalid or too long (max 255 characters)' }
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, error: 'Email format is invalid' }
  }

  return { valid: true, username, domain }
}
