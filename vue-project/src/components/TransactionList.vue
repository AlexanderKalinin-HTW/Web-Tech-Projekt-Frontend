<script setup lang="ts">
import {onMounted, type Ref, ref} from "vue";
import axios from 'axios'
import type {AxiosResponse} from 'axios'
import type {Transaction} from "@/types.ts";
import { useAuth } from '@okta/okta-vue'
import type {UserClaims} from '@okta/okta-auth-js'

// Reaktive Liste aller Transaktionen
const items: Ref<Transaction[]> = ref([])

// Formularfelder
const nameField = ref('')
const amountField = ref(0)
const categoryField = ref('Income')

// Okta Auth für eingeloggten User
const $auth = useAuth()
const email = ref('')

// GET: Transaktionen laden, gefiltert nach Owner
async function loadTransactions(owner: string = '') {
  if(!owner) {
    items.value = []
    return
  }
  const baseUrl = import.meta.env.VITE_BACKEND_BASE_URL
  const response: AxiosResponse = await axios.get(`${baseUrl}/transactions?owner=` + owner)
  items.value = response.data
}

// POST: Neue Transaktion speichern und Liste neu laden
async function saveTransaction() {
  if(!email.value){
    return
  }
  const baseUrl = import.meta.env.VITE_BACKEND_BASE_URL
  await axios.post(`${baseUrl}/transactions`, {
    title: nameField.value,
    amount: amountField.value,
    category: categoryField.value,
    owner: email.value
  })
  // Formular zurücksetzen
  nameField.value = ''
  amountField.value = 0
  // Liste aktualisieren
  await loadTransactions(email.value)
}

// Beim Laden: User aus Okta holen und Transaktionen abrufen
onMounted(async () => {
  let userClaims: UserClaims | undefined = undefined
  try {
    userClaims = await $auth.getUser()
    if(!userClaims.email){
      return
    }
  } catch (e) {
    console.log('Error:', e)
  }
  const owner = (userClaims === undefined || userClaims.email === undefined) ? '' : userClaims.email.toString()
  email.value = owner
  await loadTransactions(owner)
})
</script>

<template>
  <h1>Budget-App</h1>
  <p v-if="email">Signed in as: {{ email }}</p>
  <div>
    <h2>Transactions</h2>
    <!-- v-model bindet Inputfelder an die jeweiligen Variablen -->
    <input v-model="nameField" placeholder="Transaction" type="text">
    <input v-model="amountField" placeholder="Amount" type="number">
    <!-- Dropdown für Kategorie, gebunden an categoryField -->
    <select v-model="categoryField">
      <option value="Income">Income</option>
      <option value="Rent">Rent</option>
      <option value="Food">Food</option>
      <option value="Insurance">Insurance</option>
    </select>
    <!-- @click ruft saveTransaction auf wenn der Button gedrückt wird -->
    <button type="button" @click="saveTransaction">Save</button>
  </div>
  <table>
    <thead>
    <tr>
      <th>Transaction</th>
      <th>Amount</th>
      <th>Category</th>
    </tr>
    </thead>
    <tbody>
    <!-- Fallback wenn keine Transaktionen vorhanden -->
    <tr v-if="items.length === 0">
      <td colspan="3">No transactions yet</td>
    </tr>
    <!-- v-for rendert eine Zeile pro Transaktion -->
    <tr v-for="item in items" :key="item.id">
      <td>{{ item.title }}</td>
      <td>{{ item.amount }}€</td>
      <td>({{ item.category }})</td>
    </tr>
    </tbody>
  </table>
</template>

<style scoped>
h1 {
  text-align: center;
  margin-top: 2rem;
}
h2 {
  text-align: center;
  margin-bottom: 2rem;
}
table {
  margin-left: auto;
  margin-right: auto;
  margin-top: 1rem;
  border-collapse: collapse;
  width: 500px;
  text-align: center;
}
th,
td {
  width: 33.33%;
  padding: 0.5rem 1rem;
  text-align: center;
}
</style>
