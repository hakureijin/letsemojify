import { useTranslations } from 'next-intl'

export default function Page() {
  const t = useTranslations()
  return <main className="p-8 text-2xl">{t('hello')}</main>
}
