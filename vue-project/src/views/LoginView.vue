<script setup lang="ts">
import { nextTick, onMounted, onUnmounted } from 'vue'
import { useAuth } from '@okta/okta-vue'
import { oktaSignIn } from '@/main'

import '@okta/okta-signin-widget/css/okta-sign-in.min.css'

const $auth = useAuth()

onMounted(async () => {
  await nextTick()

  if (!$auth.getOriginalUri()) {
    $auth.setOriginalUri('/')
  }

  try {
    await oktaSignIn.showSignInAndRedirect({
      el: '#okta-signin-container'
    })
  } catch (error) {
    console.error('Okta login error:', error)
  }
})

onUnmounted(() => {
  oktaSignIn.remove()
})
</script>

<template>
  <main class="login">
    <div id="okta-signin-container"></div>
  </main>
</template>
