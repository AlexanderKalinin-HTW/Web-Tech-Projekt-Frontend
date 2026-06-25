<script setup lang="ts">
import {onMounted, ref, watch} from "vue";
import {RouterLink, RouterView, useRoute} from "vue-router";
import {useAuth} from "@okta/okta-vue";

const $auth = useAuth()
const route = useRoute()
const authenticated = ref(false)

async function refreshAuthentication(){
  authenticated.value = await $auth.isAuthenticated()
}

async function logout(){
  await $auth.signOut()
}

watch(() => route.path, refreshAuthentication)

onMounted(async () => {
  await refreshAuthentication()
  $auth.authStateManager.subscribe(refreshAuthentication)
})
</script>

<template>
  <header>
    <nav>
      <RouterLink to="/">Budget App</RouterLink>

      <RouterLink v-if="!authenticated" to="/login">
        Login
      </RouterLink>

      <button v-if="authenticated" type="button" @click="logout">
        Logout
      </button>
    </nav>
  </header>

  <RouterView />
</template>
