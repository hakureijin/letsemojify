'use client'
import { NextIntlClientProvider } from 'next-intl'
import { MotionConfig } from 'framer-motion'
import type { AbstractIntlMessages } from 'next-intl'

interface Props {
  locale: string
  messages: AbstractIntlMessages
  children: React.ReactNode
}

export function Providers({ locale, messages, children }: Props) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </NextIntlClientProvider>
  )
}
