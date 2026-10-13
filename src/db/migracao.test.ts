import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { describe, expect, it } from 'vitest'
import { BancoTreino } from './banco'

// Quem instalou a versão anterior tem o perfil no formato antigo (objetivo e
// ênfase únicos). Ao abrir a versão nova, o banco é atualizado sem perder nada.
// Dados fictícios.

describe('atualização do banco (v1 → v2)', () => {
  it('converte o perfil salvo e mantém o resto', async () => {
    const nome = `migracao-${Date.now()}`
    const antigo = new Dexie(nome)
    antigo.version(1).stores({ perfil: 'id', registrosCorpo: 'data', sessoes: 'id, status, inicio' })
    await antigo.table('perfil').put({ id: 'perfil', nome: 'Pessoa Teste', objetivo: 'hipertrofia', enfase: 'gluteos', duracaoMin: 90, diasSemana: 4 })
    await antigo.table('registrosCorpo').put({ data: '2026-01-01', pesoKg: 70 })
    antigo.close()

    const banco = new BancoTreino(nome)
    const p = (await banco.perfil.get('perfil')) as unknown as Record<string, unknown>
    expect(p.objetivos).toEqual(['hipertrofia'])
    expect(p.enfases).toEqual(['gluteos'])
    expect(p.duracaoMin).toBe(90)
    expect(p.diasSemana).toBe(4)
    expect('objetivo' in p).toBe(false)
    expect('enfase' in p).toBe(false)
    expect(await banco.registrosCorpo.get('2026-01-01')).toEqual({ data: '2026-01-01', pesoKg: 70 })
    banco.close()
  })
})
