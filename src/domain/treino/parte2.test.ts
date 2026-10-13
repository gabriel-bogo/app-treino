import { describe, expect, it } from 'vitest'
import { precisaAproximacao, seriesAproximacao } from './aquecimento'
import { candidatosSubstituicao } from './substituicao'
import { gruposTreinadosRecentemente, textoAviso48h } from './descanso48h'
import { BIBLIOTECA, exercicioPorId } from '../biblioteca'
import { ehMultiplo } from '../progressao/carga'
import type { Exercicio, Limitacao, MotivoTroca } from '../tipos'

const ex = (id: string) => exercicioPorId(id) as Exercicio

describe('séries de aproximação (§6.11)', () => {
  it('até 20 kg de carga de trabalho: 1 série com ~50% × 10', () => {
    expect(seriesAproximacao(ex('leg-press'), 20, 4)).toEqual([{ carga: 8, reps: 10 }])
  })
  it('acima de 20 kg: ~50% × 10 e ~70% × 5, arredondado pelo incremento', () => {
    expect(seriesAproximacao(ex('leg-press'), 100, 4)).toEqual([
      { carga: 48, reps: 10 },
      { carga: 68, reps: 5 },
    ])
  })
  it('barra: o limite de 20 kg conta a carga total e a aproximação vira kg por lado', () => {
    // 20 kg por lado + barra 20 = 60 kg total → 30 kg (5 por lado) e 42 kg (11 por lado)
    expect(seriesAproximacao(ex('agachamento-livre'), 20, 2)).toEqual([
      { carga: 4, reps: 10 },
      { carga: 10, reps: 5 },
    ])
    // com 50% abaixo do peso da barra, só a barra
    expect(seriesAproximacao(ex('supino-reto-barra'), 5, 1)[0].carga).toBe(0)
  })
  it('sempre múltiplo do incremento real', () => {
    for (const inc of [1, 1.25, 2, 2.5, 5]) {
      for (const s of seriesAproximacao(ex('leg-press'), 77, inc)) expect(ehMultiplo(s.carga, inc)).toBe(true)
    }
  })
  it('sem carga definida, peso do corpo ou máquina assistida: sem aproximação', () => {
    expect(seriesAproximacao(ex('leg-press'), null, 4)).toEqual([])
    expect(seriesAproximacao(ex('barra-fixa'), 10, 2)).toEqual([])
    expect(seriesAproximacao(ex('barra-graviton'), 30, 5)).toEqual([])
  })
  it('só o primeiro composto de cada grupo grande do dia', () => {
    const dia = ['agachamento-livre', 'leg-press', 'stiff-halteres', 'cadeira-extensora', 'supino-reto-halter', 'triceps-pulley', 'desenvolvimento-halter'].map(ex)
    expect(precisaAproximacao(dia)).toEqual([true, false, true, false, true, false, true])
  })
})

describe('substituir exercício (§6.10)', () => {
  const base = { limitacoes: [] as Limitacao[], ajustes: new Map(), nivel: 'intermediario' as const }

  it('mesmo músculo primário, até 3 sugestões, mesmo padrão primeiro', () => {
    const r = candidatosSubstituicao({ ...base, original: ex('supino-reto-barra'), motivo: 'outro', idsDoDia: [] })
    expect(r.sugestoes.length).toBe(3)
    expect(r.sugestoes.every((e) => e.grupo === 'peito')).toBe(true)
    expect(r.sugestoes.every((e) => e.padrao === 'empurrar_horizontal')).toBe(true)
  })

  it('nunca sugere o original nem exercício que já está no treino do dia (critério da seção 11)', () => {
    const idsDoDia = ['supino-reto-halter', 'supino-inclinado-barra', 'crucifixo-halter', 'puxada-frontal']
    for (const motivo of ['ocupado', 'sem_equipamento', 'dor', 'outro'] as MotivoTroca[]) {
      for (const filtro of ['todos', 'com_maquina', 'sem_maquina'] as const) {
        const r = candidatosSubstituicao({ ...base, original: ex('supino-reto-barra'), motivo, idsDoDia, filtro })
        for (const e of r.todos) {
          expect(e.id).not.toBe('supino-reto-barra')
          expect(idsDoDia).not.toContain(e.id)
        }
      }
    }
  })

  it('varredura: nenhuma troca de nenhum exercício sugere o original ou o dia', () => {
    for (const original of BIBLIOTECA.filter((e) => !e.soAquecimento)) {
      const idsDoDia = original.substitutos.slice(0, 2)
      const r = candidatosSubstituicao({ ...base, original, motivo: 'ocupado', idsDoDia })
      expect(r.todos.map((e) => e.id)).not.toContain(original.id)
      for (const id of idsDoDia) expect(r.todos.map((e) => e.id)).not.toContain(id)
    }
  })

  it('com limitação de ombro, nenhum exercício proibido aparece na troca (critério da seção 11)', () => {
    const proibidos = ['desenvolvimento-nuca', 'puxada-nuca', 'remada-alta', 'mergulho-paralela', 'mergulho-banco', 'mergulho-maquina']
    for (const original of BIBLIOTECA.filter((e) => !e.soAquecimento)) {
      const r = candidatosSubstituicao({ ...base, limitacoes: ['ombro'], original, motivo: 'outro', idsDoDia: [] })
      for (const e of r.todos) expect(proibidos).not.toContain(e.id)
    }
  })

  it('aparelho ocupado ou sem equipamento: equipamento diferente primeiro', () => {
    const r = candidatosSubstituicao({ ...base, original: ex('leg-press'), motivo: 'ocupado', idsDoDia: [] })
    expect(r.sugestoes[0].equipamento).not.toBe('maquina')
    const outro = candidatosSubstituicao({ ...base, original: ex('leg-press'), motivo: 'outro', idsDoDia: [] })
    expect(outro.sugestoes[0].padrao).toBe('agachar')
  })

  it('filtro rápido com máquina / sem máquina', () => {
    const com = candidatosSubstituicao({ ...base, original: ex('supino-reto-barra'), motivo: 'outro', idsDoDia: [], filtro: 'com_maquina' })
    expect(com.todos.every((e) => e.equipamento === 'maquina' || e.equipamento === 'cabo')).toBe(true)
    const sem = candidatosSubstituicao({ ...base, original: ex('supino-reto-barra'), motivo: 'outro', idsDoDia: [], filtro: 'sem_maquina' })
    expect(sem.todos.every((e) => !['maquina', 'cabo'].includes(e.equipamento))).toBe(true)
  })

  it('respeita indisponíveis e evitar', () => {
    const ajustes = new Map([['supino-reto-halter', { exercicioId: 'supino-reto-halter', indisponivel: true }]])
    const r = candidatosSubstituicao({ ...base, ajustes, original: ex('supino-reto-barra'), motivo: 'outro', idsDoDia: [] })
    expect(r.todos.map((e) => e.id)).not.toContain('supino-reto-halter')
  })

  it('sem candidatos do mesmo músculo: usa músculo secundário; sem nada: lista vazia (pular)', () => {
    const panturrilhas = BIBLIOTECA.filter((e) => e.grupo === 'panturrilha')
    const idsDoDia = panturrilhas.map((e) => e.id)
    const r = candidatosSubstituicao({ ...base, original: panturrilhas[0], motivo: 'outro', idsDoDia })
    expect(r.todos).toEqual([])
    expect(r.porSecundario).toBe(false)

    const peitos = BIBLIOTECA.filter((e) => e.grupo === 'triceps').map((e) => e.id)
    const t = candidatosSubstituicao({ ...base, original: ex('triceps-pulley'), motivo: 'outro', idsDoDia: peitos })
    expect(t.porSecundario).toBe(true)
    expect(t.todos.every((e) => e.gruposSecundarios.includes('triceps'))).toBe(true)
  })
})

describe('aviso de 48 h (A11)', () => {
  const agora = new Date('2026-05-10T18:00:00Z')
  it('avisa os grupos treinados há menos de 48 h', () => {
    const g = gruposTreinadosRecentemente({
      proximos: ['agachamento-livre', 'supino-reto-halter', 'abdominal'],
      recentes: [{ inicio: '2026-05-09T18:00:00Z', exercicios: ['leg-press', 'abdominal'] }],
      agora,
    })
    expect(g).toEqual(['quadriceps'])
    expect(textoAviso48h(g)).toMatch(/quadríceps há menos de 48 horas/)
  })
  it('não avisa depois de 48 h', () => {
    const g = gruposTreinadosRecentemente({ proximos: ['agachamento-livre'], recentes: [{ inicio: '2026-05-08T17:00:00Z', exercicios: ['leg-press'] }], agora })
    expect(g).toEqual([])
  })
})
