import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  // Next.js skips the middleware on the base-path root when the matcher is a
  // negative-lookahead regex, so '/' has to be listed explicitly.
  matcher: ['/', '/((?!api|_next|_vercel|.*\\..*).*)'],
}
