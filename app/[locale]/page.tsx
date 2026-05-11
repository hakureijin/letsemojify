import { useTranslations } from 'next-intl'
import { TopNav } from '@/components/TopNav'

export default function Page() {
  const t = useTranslations()
  return (
    <>
      <TopNav />
      <main className="p-8 pt-24 text-2xl">{t('hello')}</main>
    </>
  )
}
