import { describe, expect, it } from 'vitest'
import {
  adicionarSerie,
  ajustarTimer,
  alterarSerie,
  contadorSeries,
  criarItem,
  deixarParaDepois,
  estadoInicialTreino,
  irPara,
  marcarSerie,
  progresso,
  pularTimer,
  removerSerie,
  restanteTimer,
  temTrabalhoFeito,
} from './sessao'
import type { EstadoTreino } from '../tipos'

const t0 = new Date('2026-05-01T10:00:00Z')
const seg = (s: number) => new Date(t0.getTime() + s * 1000)

function treino(): EstadoTreino {
  return estadoInicialTreino([
    criarItem({ exercicioId: 'supino-reto-halter', papel: 'trabalho', series: 3, repsMin: 8, repsMax: 12, descansoSeg: 150, cargaSugerida: 16, alvo: 9 }),
    criarItem({ exercicioId: 'puxada-frontal', papel: 'trabalho', series: 2, repsMin: 8, repsMax: 12, descansoSeg: 150, cargaSugerida: 40, alvo: 8 }),
    criarItem({ exercicioId: 'rosca-direta', papel: 'trabalho', series: 2, repsMin: 8, repsMax: 12, descansoSeg: 75, cargaSugerida: null, alvo: 8 }),
  ])
}

describe('treino em andamento (§3)', () => {
  it('carga e reps vêm pré-preenchidas; marcar é um toque e inicia o timer com o descanso do exercício', () => {
    let e = treino()
    const [i] = e.itens
    expect(i.series.map((s) => [s.carga, s.reps])).toEqual([[16, 9], [16, 9], [16, 9]])
    e = marcarSerie(e, i.uid, i.series[0].uid, t0)
    expect(e.itens[0].series[0].feita).toBe(true)
    expect(e.timer).toEqual({ inicio: t0.toISOString(), duracaoSeg: 150, ajusteSeg: 0 })
    expect(contadorSeries(e.itens[0])).toEqual({ feitas: 1, total: 3 })
  })

  it('registra o descanso real entre um check e o próximo', () => {
    let e = treino()
    const [i] = e.itens
    e = marcarSerie(e, i.uid, i.series[0].uid, t0)
    e = marcarSerie(e, i.uid, i.series[1].uid, seg(170))
    expect(e.itens[0].series[1].descansoRealSeg).toBe(170)
  })

  it('exercício com todas as séries marcadas fica concluído e o app avança para o próximo', () => {
    let e = treino()
    const [i, j] = e.itens
    for (const [n, s] of i.series.entries()) e = marcarSerie(e, i.uid, s.uid, seg(n * 200))
    expect(e.itens[0].status).toBe('concluido')
    expect(e.atualUid).toBe(j.uid)
    expect(progresso(e)).toEqual({ concluidos: 1, total: 3 })
  })

  it('desmarcar volta o exercício para pendente', () => {
    let e = treino()
    const [i] = e.itens
    for (const s of i.series) e = marcarSerie(e, i.uid, s.uid, t0)
    e = marcarSerie(e, i.uid, i.series[2].uid, t0)
    expect(e.itens[0].status).toBe('pendente')
    expect(e.itens[0].series[2].feitaEm).toBeUndefined()
  })

  it('mudar a carga de uma série copia para as seguintes ainda não feitas', () => {
    let e = treino()
    const [i] = e.itens
    e = marcarSerie(e, i.uid, i.series[0].uid, t0)
    e = alterarSerie(e, i.uid, i.series[1].uid, { carga: 18 })
    expect(e.itens[0].series.map((s) => s.carga)).toEqual([16, 18, 18])
    e = alterarSerie(e, i.uid, i.series[2].uid, { reps: 7 })
    expect(e.itens[0].series.map((s) => s.reps)).toEqual([9, 9, 7])
  })

  it('série extra e remover série', () => {
    let e = treino()
    const [i] = e.itens
    e = adicionarSerie(e, i.uid)
    expect(e.itens[0].series.map((s) => s.tipo)).toEqual(['trabalho', 'trabalho', 'trabalho', 'extra'])
    expect(e.itens[0].series[3].carga).toBe(16)
    expect(contadorSeries(e.itens[0]).total).toBe(3)
    e = removerSerie(e, i.uid)
    expect(e.itens[0].series).toHaveLength(3)
    e = removerSerie(e, i.uid)
    expect(e.itens[0].series).toHaveLength(2)
  })

  it('remover a última série pendente conclui o exercício se as outras já foram feitas', () => {
    let e = treino()
    const [i] = e.itens
    e = marcarSerie(e, i.uid, i.series[0].uid, t0)
    e = marcarSerie(e, i.uid, i.series[1].uid, t0)
    e = removerSerie(e, i.uid)
    expect(e.itens[0].status).toBe('concluido')
  })

  it('fora da ordem: deixar pra depois move para o fim; tocar em qualquer exercício começa por ele', () => {
    let e = treino()
    const [i, j, k] = e.itens
    e = deixarParaDepois(e, i.uid)
    expect(e.itens.map((x) => x.uid)).toEqual([j.uid, k.uid, i.uid])
    expect(e.atualUid).toBe(j.uid)
    e = irPara(e, k.uid)
    expect(e.atualUid).toBe(k.uid)
  })

  it('timer: +15 / −15 / pular, baseado em horário', () => {
    let e = treino()
    expect(marcarSerie(e, e.itens[0].uid, 'nao-existe', t0)).toBe(e) // série inexistente não muda nada
    e = marcarSerie(e, e.itens[0].uid, e.itens[0].series[0].uid, t0)
    expect(restanteTimer(e.timer!, seg(30))).toBe(120)
    e = ajustarTimer(e, 15, seg(30))
    expect(restanteTimer(e.timer!, seg(30))).toBe(135)
    e = ajustarTimer(e, -15, seg(30))
    e = ajustarTimer(e, -15, seg(30))
    expect(restanteTimer(e.timer!, seg(30))).toBe(105)
    // −15 não passa de zero
    e = ajustarTimer(e, -15, seg(130))
    expect(restanteTimer(e.timer!, seg(130))).toBe(0)
    expect(pularTimer(e).timer).toBeNull()
  })

  it('no máximo 2 toques por série quando a sugestão está certa (critério da seção 11)', () => {
    // um toque no check por série; o timer começa sozinho e não precisa ser tocado
    let e = treino()
    let toques = 0
    for (const item of e.itens) {
      for (const s of item.series) {
        e = marcarSerie(e, item.uid, s.uid, t0)
        toques++
      }
    }
    expect(toques).toBe(7)
    expect(progresso(e)).toEqual({ concluidos: 3, total: 3 })
    expect(temTrabalhoFeito(e)).toBe(true)
  })
})

import { concluirAquecimentoGeral, iniciarAquecimentoGeral, idsDoDia, pularAquecimento, pularExercicio, substituirExercicio } from './sessao'

describe('aquecimento no treino (§6.11)', () => {
  function comAquecimento(): EstadoTreino {
    return estadoInicialTreino([
      criarItem({ exercicioId: 'rotacao-externa-elastico', papel: 'aquecimento_ombro', series: 2, repsMin: 15, repsMax: 15, descansoSeg: 0, cargaSugerida: null, alvo: 15 }),
      criarItem({ exercicioId: 'leg-press', papel: 'trabalho', series: 2, repsMin: 8, repsMax: 12, descansoSeg: 150, cargaSugerida: 100, alvo: 10, aproximacao: [{ carga: 48, reps: 10 }, { carga: 68, reps: 5 }] }),
    ])
  }
  it('séries de aproximação vêm antes, não contam no "x de y séries" e são opcionais', () => {
    let e = comAquecimento()
    const leg = e.itens[1]
    expect(leg.series.map((s) => s.tipo)).toEqual(['aproximacao', 'aproximacao', 'trabalho', 'trabalho'])
    expect(contadorSeries(leg)).toEqual({ feitas: 0, total: 2 })
    e = irPara(e, leg.uid)
    e = marcarSerie(e, leg.uid, leg.series[2].uid, t0)
    e = marcarSerie(e, leg.uid, leg.series[3].uid, t0)
    expect(e.itens[1].status).toBe('concluido')
  })
  it('marcar aquecimento não inicia timer de descanso', () => {
    let e = comAquecimento()
    e = marcarSerie(e, e.itens[0].uid, e.itens[0].series[0].uid, t0)
    expect(e.timer).toBeNull()
  })
  it('timer opcional de 5 min do aquecimento geral', () => {
    let e = iniciarAquecimentoGeral(comAquecimento(), t0)
    expect(e.timer).toMatchObject({ tipo: 'aquecimento', duracaoSeg: 300 })
    e = concluirAquecimentoGeral(e)
    expect(e.aquecimentoGeral).toBe('feito')
    expect(e.timer).toBeNull()
  })
  it('pular o aquecimento tira geral, ombro e aproximação', () => {
    const e = pularAquecimento(comAquecimento())
    expect(e.aquecimentoGeral).toBe('pulado')
    expect(e.itens[0].status).toBe('pulado')
    expect(e.itens[1].series.every((s) => s.tipo === 'trabalho')).toBe(true)
    expect(e.atualUid).toBe(e.itens[1].uid)
  })
})

describe('troca de exercício na sessão (§6.10)', () => {
  it('mantém séries, faixa e descanso; usa a carga do substituto e registra o original', () => {
    let e = treino()
    const [i] = e.itens
    e = substituirExercicio(e, i.uid, { exercicioId: 'supino-maquina', cargaSugerida: null, alvo: 8 }, 'ocupado')
    const novo = e.itens[0]
    expect(novo.exercicioId).toBe('supino-maquina')
    expect(novo.originalId).toBe('supino-reto-halter')
    expect(novo.motivoTroca).toBe('ocupado')
    expect(novo.series).toHaveLength(3)
    expect(novo.series.every((s) => s.carga === null && s.reps === 8)).toBe(true)
    expect([novo.descansoSeg, novo.repsMin, novo.repsMax]).toEqual([150, 8, 12])
    expect(e.atualUid).toBe(novo.uid)
    expect(idsDoDia(e)).toContain('supino-reto-halter')
  })
  it('séries já feitas ficam no original; o substituto recebe só as que faltam', () => {
    let e = treino()
    const [i] = e.itens
    e = marcarSerie(e, i.uid, i.series[0].uid, t0)
    e = substituirExercicio(e, i.uid, { exercicioId: 'supino-maquina', cargaSugerida: 40, alvo: 9 }, 'dor')
    expect(e.itens[0].status).toBe('concluido')
    expect(e.itens[0].series).toHaveLength(1)
    expect(e.itens[0].dor).toBe(true)
    expect(e.itens[1].series).toHaveLength(2)
    expect(e.itens[1].series[0].carga).toBe(40)
  })
  it('pular exercício', () => {
    let e = treino()
    e = pularExercicio(e, e.itens[0].uid)
    expect(e.itens[0].status).toBe('pulado')
    expect(e.atualUid).toBe(e.itens[1].uid)
    expect(progresso(e).total).toBe(2)
  })
})
