import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['en', 'de', 'fr', 'es', 'ru', 'ar', 'zh'],
  defaultLocale: 'en',
})
