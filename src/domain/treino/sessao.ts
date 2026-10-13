// Estado do treino em andamento (§3, "Treino em andamento"). Funções puras:
// cada ação recebe o estado atual e devolve um novo estado, que a tela salva
// imediatamente no IndexedDB (nada se perde se o app fechar).

import { novoId } from '../ids'
import type { EstadoTreino, ItemTreino, SerieTreino, TimerDescanso } from '../tipos'

export const SEGUNDOS_AJUSTE_TIMER = 15

function clonar(e: EstadoTreino): EstadoTreino {
  return { ...e, itens: e.itens.map((i) => ({ ...i, series: i.series.map((s) => ({ ...s })) })), timer: e.timer ? { ...e.timer } : null }
}

function item(e: EstadoTreino, uid: string): ItemTreino {
  const i = e.itens.find((x) => x.uid === uid)
  if (!i) throw new Error(`item ${uid} não existe`)
  return i
}

/** Séries que contam para "2 de 3 séries" e para concluir o exercício. */
export function seriesPrincipais(i: ItemTreino): SerieTreino[] {
  return i.series.filter((s) => s.tipo === 'trabalho' || s.tipo === 'aquecimento')
}

export function contadorSeries(i: ItemTreino): { feitas: number; total: number } {
  const p = seriesPrincipais(i)
  return { feitas: p.filter((s) => s.feita).length, total: p.length }
}

export function itemCompleto(i: ItemTreino): boolean {
  return i.series.length > 0 && i.series.every((s) => s.feita)
}

/** Barra de progresso geral: exercícios de trabalho concluídos / total. */
export function progresso(e: EstadoTreino): { concluidos: number; total: number } {
  const trabalho = e.itens.filter((i) => i.papel === 'trabalho' && i.status !== 'pulado')
  return { concluidos: trabalho.filter((i) => i.status === 'concluido').length, total: trabalho.length }
}

export function proximoPendente(e: EstadoTreino, aPartirDe?: string): ItemTreino | undefined {
  const idx = aPartirDe ? e.itens.findIndex((i) => i.uid === aPartirDe) : -1
  const depois = e.itens.slice(idx + 1).find((i) => i.status === 'pendente')
  return depois ?? e.itens.find((i) => i.status === 'pendente')
}

export function itemAtual(e: EstadoTreino): ItemTreino | undefined {
  return e.itens.find((i) => i.uid === e.atualUid) ?? proximoPendente(e)
}

function atualizarStatus(e: EstadoTreino, i: ItemTreino) {
  if (i.status === 'pulado') return
  const completo = itemCompleto(i)
  if (completo && i.status !== 'concluido') {
    i.status = 'concluido'
    // exercício com todas as séries marcadas → avança para o próximo
    if (e.atualUid === i.uid) e.atualUid = proximoPendente(e, i.uid)?.uid ?? null
  } else if (!completo && i.status === 'concluido') {
    i.status = 'pendente'
  }
}

/**
 * Marca (ou desmarca) uma série. Ao marcar uma série de trabalho, o timer de
 * descanso começa sozinho com o tempo do exercício, e o descanso real desde o
 * último check é registrado.
 */
export function marcarSerie(estado: EstadoTreino, itemUid: string, serieUid: string, agora: Date): EstadoTreino {
  const e = clonar(estado)
  const i = item(e, itemUid)
  const s = i.series.find((x) => x.uid === serieUid)
  if (!s) return estado
  const iso = agora.toISOString()
  if (s.feita) {
    s.feita = false
    delete s.feitaEm
    delete s.descansoRealSeg
  } else {
    s.feita = true
    s.feitaEm = iso
    if (e.ultimoCheckEm) s.descansoRealSeg = Math.max(0, Math.round((agora.getTime() - new Date(e.ultimoCheckEm).getTime()) / 1000))
    e.ultimoCheckEm = iso
    if ((s.tipo === 'trabalho' || s.tipo === 'extra') && i.descansoSeg > 0) {
      e.timer = { inicio: iso, duracaoSeg: i.descansoSeg, ajusteSeg: 0 }
    }
  }
  if (e.atualUid !== itemUid && !s.feita) e.atualUid = itemUid
  atualizarStatus(e, i)
  return e
}

/**
 * Altera carga/reps de uma série. Mudança de carga é copiada para as séries
 * seguintes ainda não feitas do mesmo exercício (quem sobe a carga na 1ª
 * série normalmente faz o mesmo nas outras).
 */
export function alterarSerie(estado: EstadoTreino, itemUid: string, serieUid: string, valores: { carga?: number | null; reps?: number | null }): EstadoTreino {
  const e = clonar(estado)
  const i = item(e, itemUid)
  const idx = i.series.findIndex((x) => x.uid === serieUid)
  if (idx < 0) return estado
  const s = i.series[idx]
  if (valores.reps !== undefined) s.reps = valores.reps === null ? null : Math.max(0, valores.reps)
  if (valores.carga !== undefined) {
    s.carga = valores.carga === null ? null : Math.max(0, valores.carga)
    for (const outra of i.series.slice(idx + 1)) {
      if (!outra.feita && outra.tipo === s.tipo) outra.carga = s.carga
    }
  }
  return e
}

/** Série extra no fim do exercício (não entra na classificação da progressão, A7). */
export function adicionarSerie(estado: EstadoTreino, itemUid: string): EstadoTreino {
  const e = clonar(estado)
  const i = item(e, itemUid)
  const base = [...i.series].reverse().find((s) => s.tipo === 'trabalho' || s.tipo === 'extra')
  i.series.push({
    uid: novoId(),
    tipo: i.papel === 'trabalho' ? 'extra' : 'aquecimento',
    carga: base?.carga ?? null,
    reps: base?.reps ?? base?.repsAlvo ?? null,
    repsAlvo: base?.repsAlvo ?? null,
    feita: false,
  })
  atualizarStatus(e, i)
  return e
}

/** Remove a última série ainda não feita (de trabalho ou extra). */
export function removerSerie(estado: EstadoTreino, itemUid: string): EstadoTreino {
  const e = clonar(estado)
  const i = item(e, itemUid)
  const idx = i.series.map((s, n) => ({ s, n })).reverse().find(({ s }) => !s.feita && s.tipo !== 'aproximacao')?.n
  if (idx === undefined) return estado
  if (i.series.filter((s) => s.tipo === 'trabalho' || s.tipo === 'aquecimento').length <= 1 && i.series[idx].tipo !== 'extra') return estado
  i.series.splice(idx, 1)
  atualizarStatus(e, i)
  return e
}

export function irPara(estado: EstadoTreino, itemUid: string): EstadoTreino {
  const e = clonar(estado)
  item(e, itemUid)
  e.atualUid = itemUid
  return e
}

/** "Deixar pra depois": move o exercício para o fim da fila, sem trocar. */
export function deixarParaDepois(estado: EstadoTreino, itemUid: string): EstadoTreino {
  const e = clonar(estado)
  const i = item(e, itemUid)
  e.itens = [...e.itens.filter((x) => x.uid !== itemUid), i]
  if (e.atualUid === itemUid) e.atualUid = e.itens.find((x) => x.status === 'pendente' && x.uid !== itemUid)?.uid ?? itemUid
  return e
}

// ─────────────────────────── Timer de descanso ───────────────────────────

/** Segundos restantes (negativo = passou do tempo). Baseado em horário, sobrevive a fechar o app. */
export function restanteTimer(t: TimerDescanso, agora: Date): number {
  const fim = new Date(t.inicio).getTime() + (t.duracaoSeg + t.ajusteSeg) * 1000
  return Math.round((fim - agora.getTime()) / 1000)
}

export function ajustarTimer(estado: EstadoTreino, delta: number, agora: Date): EstadoTreino {
  if (!estado.timer) return estado
  const e = clonar(estado)
  const t = e.timer!
  // não deixa o −15 passar de "agora"
  const restante = restanteTimer(t, agora)
  t.ajusteSeg += Math.max(delta, -Math.max(0, restante))
  return e
}

export function pularTimer(estado: EstadoTreino): EstadoTreino {
  return estado.timer ? { ...clonar(estado), timer: null } : estado
}

// ─────────────────────────── Montagem ───────────────────────────

export interface DadosItem {
  exercicioId: string
  papel: ItemTreino['papel']
  series: number
  repsMin: number
  repsMax: number
  descansoSeg: number
  alerta?: string
  cargaSugerida: number | null
  /** alvo de reps (null = peso do corpo sem alvo ainda) */
  alvo: number | null
}

export function criarItem(d: DadosItem): ItemTreino {
  const aquecimento = d.papel === 'aquecimento_ombro'
  return {
    uid: novoId(),
    exercicioId: d.exercicioId,
    papel: d.papel,
    descansoSeg: d.descansoSeg,
    repsMin: d.repsMin,
    repsMax: d.repsMax,
    cargaSugerida: d.cargaSugerida,
    ...(d.alerta ? { alerta: d.alerta } : {}),
    status: 'pendente',
    series: Array.from({ length: d.series }, () => ({
      uid: novoId(),
      tipo: aquecimento ? ('aquecimento' as const) : ('trabalho' as const),
      carga: d.cargaSugerida,
      reps: d.alvo,
      repsAlvo: d.alvo,
      feita: false,
    })),
  }
}

export function estadoInicialTreino(itens: ItemTreino[]): EstadoTreino {
  return { itens, atualUid: itens[0]?.uid ?? null, aquecimentoGeral: 'pendente', timer: null }
}

/** Há alguma série de trabalho feita? (sem nada feito, finalizar = descartar) */
export function temTrabalhoFeito(e: EstadoTreino): boolean {
  return e.itens.some((i) => i.series.some((s) => (s.tipo === 'trabalho' || s.tipo === 'extra') && s.feita))
}
