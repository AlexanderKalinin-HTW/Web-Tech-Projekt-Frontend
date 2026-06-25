import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import { OktaAuth } from '@okta/okta-auth-js'
import OktaVue from '@okta/okta-vue'
import OktaSignIn from '@okta/okta-signin-widget'

const issuer = import.meta.env.VITE_OKTA_ISSUER
const clientId = import.meta.env.VITE_OKTA_CLIENT_ID
const redirectUri = `${window.location.origin}/login/callback`
const scopes = ['openid', 'profile', 'email']

export const oktaAuth = new OktaAuth({
  issuer,
  clientId,
  redirectUri,
  scopes,
  pkce: true
})

export const oktaSignIn = new OktaSignIn({
  clientId,
  redirectUri,
  authParams: {
    issuer,
    scopes,
    pkce: true
  }
})

const app = createApp(App)

app.use(OktaVue, {
  oktaAuth,
  onAuthRequired: () => {
    router.push('/login')
  },
  onAuthResume: () => {
    router.push('/login')
  } })
app.use(router)

app.mount('#app')
