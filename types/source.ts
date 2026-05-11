export interface Source {
  id: string
  title: { zh: string; en: string }
  publisher: string
  url: string
  accessed: string
}

export interface Cited<T> {
  value: T
  sources: string[]
}
