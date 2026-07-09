export interface ValidationResult {
  email: string
  validations: {
    syntax: boolean
    domain_exists: boolean
    mx_records: boolean
    is_disposable: boolean
    is_role_based: boolean
  }
  status: 'VALID' | 'INVALID_FORMAT' | 'INVALID_DOMAIN' | 'DISPOSABLE' | 'PROBABLY_VALID'
  alias_of?: string
  suggestion?: string
  error?: string
}

export interface BatchResult {
  results: ValidationResult[]
}

export interface EmailRequest {
  email: string
}

export interface BatchRequest {
  emails: string[]
}
