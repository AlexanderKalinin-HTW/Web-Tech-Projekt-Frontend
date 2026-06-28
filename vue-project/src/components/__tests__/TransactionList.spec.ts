import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import TransactionList from '../TransactionList.vue'

// axios mocken: vi.mock ersetzt das gesamte Modul — kein echter HTTP-Call wird gemacht.
// axios.get gibt eine leere Liste zurück, damit die Komponente den Leer-Zustand rendert.
vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({}),
  },
}))

// @okta/okta-vue mocken: useAuth() liefert ein fake Auth-Objekt mit einer E-Mail,
// damit onMounted loadTransactions aufruft statt vorzeitig abzubrechen.
vi.mock('@okta/okta-vue', () => ({
  useAuth: () => ({
    getUser: vi.fn().mockResolvedValue({ email: 'test@test.de' }),
    isAuthenticated: vi.fn().mockResolvedValue(false),
    authStateManager: { subscribe: vi.fn() },
    signOut: vi.fn(),
  }),
}))

describe('TransactionList', () => {
  it('zeigt "No transactions yet" wenn die Transaktionsliste leer ist', async () => {
    const wrapper = mount(TransactionList)

    // flushPromises wartet, bis alle async-Aufrufe aus onMounted abgeschlossen sind
    // (getUser + axios.get), bevor wir das gerenderte HTML prüfen
    await flushPromises()

    expect(wrapper.text()).toContain('No transactions yet')
  })
})
