import { defineBoot } from '#q-app/wrappers'
import axios, { type AxiosInstance } from 'axios'
import https from 'node:https'

declare module 'vue' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance
    $api: AxiosInstance
  }
}

let csrfToken: null | string = null

const setCsrfToken = (token: null | string) => {
  csrfToken = token
}

const getCsrfToken = () => {
  return csrfToken
}

// Be careful when using SSR for cross-request state pollution
// due to creating a Singleton instance here;
// If any client changes this (global) instance, it might be a
// good idea to move this instance creation inside of the
// "export default () => {}" function below (which runs individually
// for each client)

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  ...(import.meta.env.SSR && import.meta.env.DEV
    ? { httpsAgent: new https.Agent({ rejectUnauthorized: false }) }
    : {}),
})

export default defineBoot(({ app }) => {
  // for use inside Vue files (Options API) through this.$axios and this.$api

  app.config.globalProperties.$axios = axios

  // ^ ^ ^ this will allow you to use this.$axios (for Vue Options API form)
  //       so you won't necessarily have to import axios in each vue file

  app.config.globalProperties.$api = api
  // ^ ^ ^ this will allow you to use this.$api (for Vue Options API form)
  //       so you can easily perform requests against your app's API
})

api.interceptors.request.use(
  async (config) => {
    // Typy metod, które wymagają CSRF
    const methodsRequiringCsrf = ['post', 'put', 'patch', 'delete']

    if (methodsRequiringCsrf.includes(config.method)) {
      // Jeśli nie mamy tokena w storze, pobierz go z API
      if (!getCsrfToken()) {
        const resp = await api.get('/csrf-token')
        setCsrfToken(resp.data.csrfToken)
      }
      // Dodaj token do nagłówka
      config.headers['X-CSRF-Token'] = getCsrfToken()
    }
    return config
  },
  (error) => Promise.reject(error),
)


export { api }
