import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { apagarTudo, db } from './banco'
import { aplicarPausaNosExercicios, aplicarProgressaoDaSessao, pausaPendente } from './progressao'
import type { ItemTreino, Perfil, SerieTreino, Sessao } from '../domain/tipos'

// Dados fictícios.
const perfil: Perfil = {
  id: 'perfil', nome: 'Pessoa Teste', sexo: 'feminino', nascimento: '1990-01-01', alturaCm: 165, pesoInicialKg: 60,
  nivel: 'intermediario', objetivo: 'hipertrofia', enfase: 'equilibrado', diasSemana: 4, duracaoMin: 60, limitacoes: [],
  nConfirmacoes: 1, avisoSaudeAceitoEm: 'x', criadoEm: 'x', atualizadoEm: 'x',
}

function serie(tipo: SerieTreino['tipo'], carga: number | null, reps: number, feita = true): SerieTreino {
  return { uid: Math.random().toString(36), tipo, carga, reps, repsAlvo: 8, feita }
}

function sessao(id: string, inicio: string, itens: ItemTreino[], status: Sessao['status'] = 'concluida'): Sessao {
  return { id, diaId: '0', nomeDia: 'Superior A', fase: 'normal', inicio, status, estado: { itens, atualUid: null, aquecimentoGeral: 'feito', timer: null }, substituicoes: [] }
}

function item(exercicioId: string, series: SerieTreino[], papel: ItemTreino['papel'] = 'trabalho'): ItemTreino {
  return { uid: exercicioId, exercicioId, papel, series, descansoSeg: 90, repsMin: 8, repsMax: 12, cargaSugerida: null, status: 'concluido' }
}

beforeEach(async () => {
  await apagarTudo()
  await db.configuracoes.put({ id: 'app', primeiroUsoEm: '2026-01-01T00:00:00Z', som: true, trocasNoPlano: {} })
})

describe('progressão gravada ao finalizar o treino', () => {
  it('aplica só séries de trabalho feitas; aquecimento, aproximação e extras não contam (§6.11, A7)', async () => {
    const s = sessao('s1', '2026-02-01T10:00:00.000Z', [
      item('supino-reto-halter', [
        serie('aproximacao', 8, 10),
        serie('trabalho', 16, 8),
        serie('trabalho', 16, 8),
        serie('trabalho', 16, 5, false), // não marcada: ignorada
        serie('extra', 16, 3),
      ]),
      item('rotacao-externa-elastico', [serie('aquecimento', null, 15)], 'aquecimento_ombro'),
    ])
    const eventos = await aplicarProgressaoDaSessao(s, perfil)
    const estado = await db.progressao.get('supino-reto-halter')
    // N = 1: primeira vez define a carga e a confirmação já sobe para 9
    expect(estado?.carga).toBe(16)
    expect(estado?.alvo).toBe(9)
    expect(eventos.map((e) => e.tipo)).toEqual(['inicio', 'aumento_reps'])
    expect(await db.progressao.get('rotacao-externa-elastico')).toBeUndefined()
    expect(await db.eventosProgressao.count()).toBe(2)
  })

  it('registra regressões no histórico do exercício (§6.8)', async () => {
    await db.progressao.put({ exercicioId: 'leg-press', modo: 'carga', carga: 100, cargaAnterior: 96, alvo: 8, confirmacoes: 0, segurando: false, fase: 'normal' })
    await aplicarProgressaoDaSessao(sessao('s2', '2026-02-03T10:00:00.000Z', [item('leg-press', [serie('trabalho', 100, 6), serie('trabalho', 100, 5)])]), perfil)
    const estado = await db.progressao.get('leg-press')
    expect([estado?.carga, estado?.alvo, estado?.segurando]).toEqual([96, 12, true])
    const ev = await db.eventosProgressao.where('exercicioId').equals('leg-press').toArray()
    expect(ev[0].tipo).toBe('regressao')
  })
})

describe('retorno após pausa aplicado uma vez (§6.12)', () => {
  it('reduz cargas, registra e não aplica de novo para a mesma pausa', async () => {
    await db.sessoes.put(sessao('s1', '2026-03-01T10:00:00.000Z', []))
    await db.progressao.put({ exercicioId: 'leg-press', modo: 'carga', carga: 100, cargaAnterior: null, alvo: 11, confirmacoes: 0, segurando: false, fase: 'normal' })
    const agora = new Date('2026-03-15T10:00:00')
    const regra = await pausaPendente(agora)
    expect(regra?.dias).toBe(14)
    await aplicarPausaNosExercicios(regra!, perfil, agora)
    const e = await db.progressao.get('leg-press')
    expect([e?.carga, e?.alvo]).toEqual([88, 11]) // 90 → múltiplo de 4 abaixo
    expect(await pausaPendente(agora)).toBeNull()
  })
  it('sem pausa (menos de 10 dias) não faz nada', async () => {
    await db.sessoes.put(sessao('s1', '2026-03-01T10:00:00.000Z', []))
    expect(await pausaPendente(new Date('2026-03-08T10:00:00'))).toBeNull()
  })
})
