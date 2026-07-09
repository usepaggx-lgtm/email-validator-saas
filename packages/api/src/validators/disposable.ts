import { DISPOSABLE_DOMAINS } from './disposable-data'

const disposableSet = new Set(DISPOSABLE_DOMAINS)

export function isDisposable(domain: string): boolean {
  return disposableSet.has(domain.toLowerCase())
}
