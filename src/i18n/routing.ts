import { defineRouting } from 'next-intl/routing'

const locales = ['en', 'de', 'fr', 'es', 'ru', 'ar', 'zh'] as const

export const routing = defineRouting({
  locales,
  defaultLocale: locales.includes(process.env.DEFAULT_LOCALE as any)
    ? (process.env.DEFAULT_LOCALE as (typeof locales)[number])
    : 'en',
})
