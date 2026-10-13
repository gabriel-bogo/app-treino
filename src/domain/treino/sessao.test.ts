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
