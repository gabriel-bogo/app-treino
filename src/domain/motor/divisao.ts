// Divisão do treino conforme os dias por semana (§6.2) e a fase (§6.1).

import type { DiasSemana, Enfase, Fase, Nivel, TipoDia } from '../tipos'
import { MAX_DIAS_READAPTACAO } from './regras'

export interface ModeloDia {
  /** variante única (dias com o mesmo modelo repetem exatamente os mesmos exercícios) */
  variante: string
  nome: string
  tipo: TipoDia
}

export interface Divisao {
  nome: string
  /** sequência de treinos (o próximo é sempre o seguinte da lista, §6.2) */
  sequencia: ModeloDia[]
}

const fb = (l: string): ModeloDia => ({ variante: `fb-${l}`, nome: `Full body ${l}`, tipo: 'fullbody' })
const dia = (variante: string, nome: string, tipo: TipoDia): ModeloDia => ({ variante, nome, tipo })

export function definirDivisao(params: { diasSemana: DiasSemana; nivel: Nivel; enfase: Enfase; fase: Fase }): Divisao {
  const { nivel, enfase, fase } = params
  if (fase === 'readaptacao') {
    // §6.1: full body, máximo 4 dias na semana nessa fase
    const dias = Math.min(params.diasSemana, MAX_DIAS_READAPTACAO)
    if (dias === 2) return { nome: 'Full body A / B (readaptação)', sequencia: [fb('A'), fb('B')] }
    if (dias === 3) return { nome: 'Full body A / B / C (readaptação)', sequencia: [fb('A'), fb('B'), fb('C')] }
    return { nome: 'Full body A / B (readaptação)', sequencia: [fb('A'), fb('B'), fb('A'), fb('B')] }
  }
  switch (params.diasSemana) {
    case 2:
      return { nome: 'Full body A / B', sequencia: [fb('A'), fb('B')] }
    case 3:
      if (nivel === 'intermediario') {
        return { nome: 'Push / Pull / Legs', sequencia: [dia('push', 'Push', 'push'), dia('pull', 'Pull', 'pull'), dia('legs', 'Legs', 'legs')] }
      }
      return { nome: 'Full body A / B / C', sequencia: [fb('A'), fb('B'), fb('C')] }
    case 4:
      // §6.2: ênfase inferior ou glúteos com 4 dias vira Inferior / Superior / Inferior / Full body (A12: automático)
      if (enfase === 'inferior' || enfase === 'gluteos') {
        return {
          nome: 'Inferior / Superior / Inferior / Full body',
          sequencia: [dia('inf-A', 'Inferior A', 'inferior'), dia('sup', 'Superior', 'superior'), dia('inf-B', 'Inferior B', 'inferior'), fb('A')],
        }
      }
      return {
        nome: 'Superior / Inferior / Superior / Inferior',
        sequencia: [dia('sup-A', 'Superior A', 'superior'), dia('inf-A', 'Inferior A', 'inferior'), dia('sup-B', 'Superior B', 'superior'), dia('inf-B', 'Inferior B', 'inferior')],
      }
    case 5:
      return {
        nome: 'Superior / Inferior / Push / Pull / Legs',
        sequencia: [dia('sup', 'Superior', 'superior'), dia('inf', 'Inferior', 'inferior'), dia('push', 'Push', 'push'), dia('pull', 'Pull', 'pull'), dia('legs', 'Legs', 'legs')],
      }
    case 6:
      return {
        nome: 'Push / Pull / Legs × 2',
        sequencia: [
          dia('push-A', 'Push A', 'push'),
          dia('pull-A', 'Pull A', 'pull'),
          dia('legs-A', 'Legs A', 'legs'),
          dia('push-B', 'Push B', 'push'),
          dia('pull-B', 'Pull B', 'pull'),
          dia('legs-B', 'Legs B', 'legs'),
        ],
      }
  }
}

/** B16: core no fim do treino, em dias alternados da sequência (posições 0, 2, 4). */
export function diaTemCore(indice: number): boolean {
  return indice % 2 === 0
}
