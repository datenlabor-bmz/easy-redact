import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  // The `matcher` is relative to the `basePath`. The explicit '/' entry is
  // required so the middleware fires on the base-path root (e.g. `/easyredact/`);
  // Next.js does not trigger middleware on the root when a `basePath` is set and
  // the matcher uses a negative-lookahead regex. See vercel/next.js#50161.
  matcher: ['/', '/((?!api|_next|_vercel|.*\\..*).*)'],
}
