<script setup lang="ts">
import {computed, onMounted, type Ref, ref} from "vue";
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

// Kategorie-Filter: '' = alle Kategorien anzeigen, sonst nur die gewählte.
// filteredItems und totalSum sind computed — sie aktualisieren sich automatisch
// wenn sich items oder filterCategory ändern, ohne einen neuen Backend-Call.
const filterCategory = ref('')
const filteredItems = computed(() =>
  filterCategory.value === '' ? items.value : items.value.filter(i => i.category === filterCategory.value)
)
const totalSum = computed(() =>
  filteredItems.value.reduce((sum, i) => sum + i.amount, 0)
)

// Edit-Modus: null = Create-Modus (POST), Zahl = ID der zu bearbeitenden Transaktion (PUT).
// Das Formular oben ist dasselbe für beide Modi — editingId entscheidet,
// welcher Request beim Klick auf Save abgeschickt wird.
const editingId = ref<number | null>(null)

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

// Zeile anklicken: Formular mit den Werten der Transaktion befüllen und Edit-Modus aktivieren
function selectForEdit(item: Transaction) {
  editingId.value = item.id
  nameField.value = item.title
  amountField.value = item.amount
  categoryField.value = item.category
}

// Edit-Modus verlassen und Formular zurücksetzen
function cancelEdit() {
  editingId.value = null
  nameField.value = ''
  amountField.value = 0
  categoryField.value = 'Income'
}

// DELETE: Transaktion anhand der ID löschen und Liste danach neu laden
async function deleteTransaction(id: number) {
  const baseUrl = import.meta.env.VITE_BACKEND_BASE_URL
  await axios.delete(`${baseUrl}/transactions/${id}`)
  if (editingId.value === id) cancelEdit()
  await loadTransactions(email.value)
}

// POST oder PUT: abhängig von editingId wird eine neue Transaktion erstellt oder eine bestehende aktualisiert
async function saveTransaction() {
  if(!email.value) return
  const baseUrl = import.meta.env.VITE_BACKEND_BASE_URL
  const body = {
    title: nameField.value,
    amount: amountField.value,
    category: categoryField.value,
    owner: email.value
  }
  if (editingId.value !== null) {
    await axios.put(`${baseUrl}/transactions/${editingId.value}`, body)
  } else {
    await axios.post(`${baseUrl}/transactions`, body)
  }
  cancelEdit()
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
    <!-- Im Edit-Modus steht auf dem Button "Update", sonst "Save" -->
    <button type="button" @click="saveTransaction">{{ editingId !== null ? 'Update' : 'Save' }}</button>
    <button v-if="editingId !== null" type="button" @click="cancelEdit">Cancel</button>
  </div>
  <div>
    <label>Filter: </label>
    <select v-model="filterCategory">
      <option value="">All</option>
      <option value="Income">Income</option>
      <option value="Rent">Rent</option>
      <option value="Food">Food</option>
      <option value="Insurance">Insurance</option>
    </select>
    <span>Total: {{ totalSum.toFixed(2) }}€</span>
  </div>
  <table>
    <thead>
    <tr>
      <th>Transaction</th>
      <th>Amount</th>
      <th>Category</th>
      <th></th>
    </tr>
    </thead>
    <tbody>
    <!-- Fallback wenn keine Transaktionen vorhanden -->
    <tr v-if="filteredItems.length === 0">
      <td colspan="4">No transactions yet</td>
    </tr>
    <!-- Klick auf die Zeile öffnet den Edit-Modus; Delete-Button stoppt die Weitergabe des Klick-Events -->
    <tr v-for="item in filteredItems" :key="item.id" @click="selectForEdit(item)" style="cursor: pointer;">
      <td>{{ item.title }}</td>
      <td>{{ item.amount }}€</td>
      <td>({{ item.category }})</td>
      <td><button type="button" @click.stop="deleteTransaction(item.id)">Delete</button></td>
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
