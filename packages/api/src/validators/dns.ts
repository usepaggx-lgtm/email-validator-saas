const DOH_URL = 'https://cloudflare-dns.com/dns-query'

interface MXRecord {
  priority: number
  exchange: string
}

interface DoHAnswer {
  name: string
  type: number
  TTL: number
  data: string
}

interface DoHResponse {
  Status: number
  Answer?: DoHAnswer[]
}

async function queryDNS(domain: string, type: number): Promise<DoHResponse> {
  const url = `${DOH_URL}?name=${encodeURIComponent(domain)}&type=${type}`
  const response = await fetch(url, {
    headers: { Accept: 'application/dns-json' },
  })
  return response.json() as Promise<DoHResponse>
}

export async function validateDomain(domain: string): Promise<{
  domain_exists: boolean
  mx_records: boolean
  records: string[]
}> {
  try {
    const mxResult = await queryDNS(domain, 15)

    if (mxResult.Status !== 0) {
      return { domain_exists: false, mx_records: false, records: [] }
    }

    if (mxResult.Answer && mxResult.Answer.length > 0) {
      const records = mxResult.Answer
        .filter(a => a.type === 15)
        .map(a => a.data)

      return {
        domain_exists: true,
        mx_records: records.length > 0,
        records,
      }
    }

    const aResult = await queryDNS(domain, 1)
    const hasA = !!(aResult.Answer && aResult.Answer.length > 0 && aResult.Status === 0)

    return {
      domain_exists: hasA,
      mx_records: false,
      records: [],
    }
  } catch {
    return { domain_exists: false, mx_records: false, records: [] }
  }
}
