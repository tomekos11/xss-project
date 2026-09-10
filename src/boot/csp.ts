import { defineBoot } from '@quasar/app-vite/wrappers'
import crypto from 'crypto'
import { useSecurityOptions } from 'src/composables/useSecurityOptions'

export default defineBoot(async ({ ssrContext }) => {
  const { init } = useSecurityOptions()

  await init()

  const {
    xFrameOptionsEnabled,
    cspFrameAncestorsEnabled,
    xssSecurityEnabled,
    cspScriptSrcEnabled,
  } = useSecurityOptions()

  const nonce = crypto.randomBytes(16).toString('base64')

  if (ssrContext) {
    ssrContext.nonce = nonce
  }

  if (xFrameOptionsEnabled) {
    ssrContext?.res.setHeader('X-Frame-Options', 'DENY')
  }

  let csp =
    "default-src 'self'; " +
    `connect-src 'self' ${import.meta.env.VITE_API_URL} ${import.meta.env.VITE_WS_URL} ws://localhost:24678 ${xssSecurityEnabled ? '' : '*'};` +
    "img-src 'self' blob: cdn.quasar.dev; " +
    `script-src 'self' ${cspScriptSrcEnabled ? `'nonce-${nonce}'` : "'unsafe-inline'"}; ` +
    `style-src 'self' 'unsafe-inline'; ` +
    "font-src 'self' data: ;"

  if (!xFrameOptionsEnabled) {
    csp += `frame-ancestors ${cspFrameAncestorsEnabled ? "'self'" : '*'}`
  }

  ssrContext?.res.setHeader('Content-Security-Policy', csp)
})
