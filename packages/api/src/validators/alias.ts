interface AliasProvider {
  domains: string[]
  normalize: (username: string) => { isAlias: boolean; canonicalUsername: string }
}

const providers: AliasProvider[] = [
  {
    domains: ['gmail.com', 'googlemail.com'],
    normalize: (username: string) => {
      const cleaned = username.replace(/\./g, '').replace(/\+.*$/, '')
      return { isAlias: cleaned !== username, canonicalUsername: cleaned }
    },
  },
  {
    domains: ['yahoo.com', 'yahoo.com.br', 'yahoo.co.uk', 'yahoo.fr', 'yahoo.de'],
    normalize: (username: string) => {
      const match = username.match(/^([^\-]+)/)
      if (match && match[0] !== username) {
        return { isAlias: true, canonicalUsername: match[1] }
      }
      return { isAlias: false, canonicalUsername: username }
    },
  },
  {
    domains: ['outlook.com', 'hotmail.com', 'live.com', 'msn.com'],
    normalize: (username: string) => {
      const cleaned = username.replace(/\+.*$/, '')
      return { isAlias: cleaned !== username, canonicalUsername: cleaned }
    },
  },
  {
    domains: ['protonmail.com', 'proton.me'],
    normalize: (username: string) => {
      const cleaned = username.replace(/\+.*$/, '')
      return { isAlias: cleaned !== username, canonicalUsername: cleaned }
    },
  },
]

export function detectAlias(email: string, username: string, domain: string): { isAlias: boolean; aliasOf?: string } {
  const provider = providers.find(p => p.domains.includes(domain.toLowerCase()))
  if (!provider) return { isAlias: false }

  const result = provider.normalize(username)
  if (result.isAlias) {
    return { isAlias: true, aliasOf: `${result.canonicalUsername}@${domain}` }
  }

  return { isAlias: false }
}
