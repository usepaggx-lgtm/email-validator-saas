const ROLE_ACCOUNTS = new Set([
  'admin', 'support', 'sales', 'info', 'contact', 'help',
  'no-reply', 'noreply', 'mailer-daemon', 'postmaster', 'hostmaster',
  'webmaster', 'abuse', 'root', 'test', 'mail', 'office',
  'manager', 'team', 'hello', 'hi', 'newsletter', 'marketing',
  'billing', 'security', 'privacy', 'jobs', 'hr', 'careers',
  'press', 'media', 'partner', 'legal', 'feedback', 'service',
])

export function isRoleAccount(username: string): boolean {
  return ROLE_ACCOUNTS.has(username.toLowerCase())
}
