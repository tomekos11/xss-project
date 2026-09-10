interface Options {
  id: number
  name: string
  isActive: 0 | 1
}

let xFrameOptionsEnabled = false
let cspFrameAncestorsEnabled = false
let xssSecurityEnabled = false
let cspScriptSrcEnabled = false
let httpsEnabled = true

export const useSecurityOptions = () => {
  const init = async () => {
    const { api } = await import('src/boot/axios')

    try {
      const { data: options } = await api.get<Options[]>('/security')

      xFrameOptionsEnabled =
        !!options.find((el) => el.name === 'x-frame-options')?.isActive || false
      cspFrameAncestorsEnabled =
        !!options.find((el) => el.name === 'csp-frame-ancestors')?.isActive || false
      xssSecurityEnabled =
        !!options.find((el) => el.name === 'csp-connect-src')?.isActive || false
      cspScriptSrcEnabled =
        !!options.find((el) => el.name === 'csp-script-src')?.isActive || false
    } catch (e) {
      console.warn(
        'Aby poprawnie działał front - musisz włączyć backend. Wynika to z faktu, że trzeba ustalić sesje + pobrać opcje zabezpieczeń.',
      )
    }
  }

  const setXFrameOptionsEnabled = (newVal: boolean) => {
    xFrameOptionsEnabled = newVal
  }

  const setCspFrameAncestorsEnabled = (newVal: boolean) => {
    cspFrameAncestorsEnabled = newVal
  }

  const setXssSecurityEnabled = (newVal: boolean) => {
    xssSecurityEnabled = newVal
  }

  const setCspScriptSrcEnabled = (newVal: boolean) => {
    cspScriptSrcEnabled = newVal
  }

  const setHttpsEnabled = (newVal: boolean) => {
    httpsEnabled = newVal
  }

  return {
    xFrameOptionsEnabled,
    cspFrameAncestorsEnabled,
    xssSecurityEnabled,
    cspScriptSrcEnabled,
    httpsEnabled,
    setXFrameOptionsEnabled,
    setCspFrameAncestorsEnabled,
    setXssSecurityEnabled,
    setCspScriptSrcEnabled,
    setHttpsEnabled,
    init,
  }
}
