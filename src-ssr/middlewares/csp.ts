import { type Request, type Response } from 'express'
import { defineSsrMiddleware } from '#q-app/wrappers'
import express from 'express'
import { useSecurityOptions } from 'src/composables/useSecurityOptions'

export default defineSsrMiddleware(({ app }) => {
  const {
    setXFrameOptionsEnabled,
    setCspFrameAncestorsEnabled,
    setXssSecurityEnabled,
    setCspScriptSrcEnabled,
  } = useSecurityOptions()

  app.use(express.json())

  app.post('/api/set-x-frame-options', async (req: Request, res: Response) => {
    const { isActive } = req.body

    setXFrameOptionsEnabled(!!isActive)

    res.status(200).json({ message: 'X-Frame-Options updated', isActive })
  })

  app.post('/api/set-csp-frame-ancestors', async (req: Request, res: Response) => {
    const { isActive } = req.body

    setCspFrameAncestorsEnabled(!!isActive)

    res.status(200).json({ message: 'CSP frame-ancestors updated', isActive })
  })

  app.post('/api/set-xss', async (req: Request, res: Response) => {
    const { isActive } = req.body

    setXssSecurityEnabled(isActive)

    res.status(200).json({ message: 'XSS security updated', isActive })
  })

  app.post('/api/set-csp-script-src', async (req: Request, res: Response) => {
    const { isActive } = req.body

    setCspScriptSrcEnabled(isActive)

    res.status(200).json({ message: 'CSP script-src updated', isActive })
  })
})
