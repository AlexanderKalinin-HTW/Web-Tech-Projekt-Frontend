<script setup lang="ts">
//Beispielliste für Abgabe 2 Web-Tech
// Aufgrund der App (Butget-app) wurde sich für eine liste von
//ausgaben und den dazugehörigen Kategorien entschieden, mit 3 beipspielen
//und dären id´s
import {type Ref, ref} from "vue";
import axios from 'axios'
import type {AxiosResponse} from 'axios'
import type {Transaction} from "@/types.ts";

const items: Ref<Transaction[]> = ref([])
const nameField = ref('')
const amountField = ref(0)

async function loadTransactions (owner: string = '') {
  const baseUrl = import.meta.env.VITE_BACKEND_BASE_URL // 'http://localhost:8080' in dev mode
  const endpoint = baseUrl + '/transactions' + '?owner=' + owner
  const response: AxiosResponse = await axios.get(endpoint);
  const responseData: Transaction[] = response.data;
  responseData.forEach((thing: Transaction) => {
    items.value.push(thing)
  })
}


const transactions = [
  { id: 1, title: 'Miete', amount: -800, category: 'Wohnen' },
  { id: 2, title: 'Gehalt', amount: 1500, category: 'Einnahmen' },
  { id: 3, title: 'Lebensmittel', amount: -120, category: 'Essen' },
]

</script>

<!-- script: hier wird  die ausgabe difiniert -->
<template>
  <h1> Budget-App </h1>
  <div>
    <h2>Transactions</h2>
    <input v-model="nameField" placeholder="Transaction" type="text">
    <input v-model="amountField" placeholder="Amount">
    <!-- select: hier wird ein dropdown feld definiert -->
    <select>category="expense-type"
      <option value="Rent">Rent</option>
      <option value="Income">Income</option>
      <option value="Food">Food</option>
      <option value="Insurance">Insurance</option>
    </select>
    <button type="button">Save</button>
  </div>
  <div>
    <!-- div ist ein kontainer -->
    <!-- h2 difiniert die schriftgröße(überschrift - headar größe 2) -->
    <table>
      <thead>
        <tr>
          <th>Transaction</th>
          <th>Amount</th>
          <th>Category</th>
        </tr>
      </thead>
      <tbody>
      <tr v-if="transactions.length === 0">
        <td colspan="3">No transactions yet</td>
      </tr>
      <tr v-for="transaction in transactions" :key="transaction.id">
        <td> {{ transaction.title }}</td>
        <td>{{ transaction.amount }}€</td>
        <td>({{ transaction.category }})</td>
      </tr>
      </tbody>
    </table>
  </div>
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
table{
  margin-left: auto;
  margin-right: auto;
  margin-top: 1rem;
  border-collapse: collapse;
  width: 500px;
  text-align: center;
}
th,
td{
  width: 33.33%;
  padding: 0.5rem 1rem;
  text-align: center;
}
ul{
  text-align: center;
}
</style>
