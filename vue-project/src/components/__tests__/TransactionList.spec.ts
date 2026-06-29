import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import axios from 'axios'
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
  // Aufruf-Historie der Mocks zwischen Tests leeren — Implementierungen (mockResolvedValue) bleiben erhalten
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('zeigt "No transactions yet" wenn die Transaktionsliste leer ist', async () => {
    const wrapper = mount(TransactionList)

    // flushPromises wartet, bis alle async-Aufrufe aus onMounted abgeschlossen sind
    // (getUser + axios.get), bevor wir das gerenderte HTML prüfen
    await flushPromises()

    expect(wrapper.text()).toContain('No transactions yet')
  })

  it('ruft axios.post mit korrektem Body auf wenn Save geklickt wird', async () => {
    const wrapper = mount(TransactionList)
    await flushPromises() // onMounted abwarten: getUser + erstes loadTransactions

    // Formularfelder befüllen — findAll('select')[0] ist categoryField,
    // [1] wäre der Kategorie-Filter (zweites select im Template)
    await wrapper.find('input[placeholder="Transaction"]').setValue('Miete')
    await wrapper.find('input[placeholder="Amount"]').setValue('850')
    await wrapper.findAll('select')[0].setValue('Rent')

    // Save-Button klicken und axios.post + folgendes loadTransactions abwarten
    await wrapper.find('button[type="button"]').trigger('click')
    await flushPromises()

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/transactions'),
      {
        title: 'Miete',
        amount: 850,
        category: 'Rent',
        owner: 'test@test.de',
      }
    )
  })

  it('befüllt Formular und zeigt "Update" wenn eine Tabellenzeile geklickt wird', async () => {
    // mockResolvedValueOnce überschreibt für diesen einen Aufruf die Standard-Implementierung
    // (leere Liste) mit einer Transaction — so hat die Tabelle eine klickbare Zeile
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: [{ id: 1, title: 'Miete', amount: 850, category: 'Rent', owner: 'test@test.de' }],
    })

    const wrapper = mount(TransactionList)
    await flushPromises() // onMounted: getUser + loadTransactions mit der gefakten Transaction

    // Erste Datenzeile im tbody anklicken — löst selectForEdit() aus
    await wrapper.find('tbody tr').trigger('click')

    // Formularfelder prüfen: DOM-Werte sind immer Strings, auch bei type="number"
    expect(wrapper.find('input[placeholder="Transaction"]').element.value).toBe('Miete')
    expect(wrapper.find('input[placeholder="Amount"]').element.value).toBe('850')
    expect((wrapper.findAll('select')[0].element as HTMLSelectElement).value).toBe('Rent')

    // editingId ist jetzt gesetzt → Button-Text wechselt von "Save" zu "Update"
    expect(wrapper.find('button[type="button"]').text()).toBe('Update')
  })

  it('ruft axios.delete mit korrekter ID auf und löst keinen Edit-Modus aus', async () => {
    // ID 7 statt 1 — macht den URL-Assertion eindeutig, kein Zufallstreffer möglich
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: [{ id: 7, title: 'Miete', amount: 850, category: 'Rent', owner: 'test@test.de' }],
    })

    const wrapper = mount(TransactionList)
    await flushPromises()

    // Delete-Button im tbody klicken — @click.stop verhindert, dass der Klick
    // zur übergeordneten <tr> bubbled und dort selectForEdit() auslöst
    await wrapper.find('tbody button').trigger('click')
    await flushPromises() // axios.delete + folgendes loadTransactions abwarten

    // axios.delete mit der richtigen ID aufgerufen
    expect(axios.delete).toHaveBeenCalledWith(expect.stringContaining('/transactions/7'))

    // Edit-Modus wurde NICHT ausgelöst: Formular leer, Button-Text noch "Save"
    expect(wrapper.find('input[placeholder="Transaction"]').element.value).toBe('')
    expect(wrapper.find('button[type="button"]').text()).toBe('Save')
  })
})
