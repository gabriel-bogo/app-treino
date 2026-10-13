// Divisão do treino conforme os dias por semana (§6.2) e a fase (§6.1).

import type { DiasSemana, Enfase, Fase, Nivel, TipoDia } from '../tipos'
import { MAX_DIAS_READAPTACAO, enfaseSoInferior } from './regras'

export interface ModeloDia {
  /** variante única (dias com o mesmo modelo repetem exatamente os mesmos exercícios) */
  variante: string
  /** C5: "Treino A · Superior" (a letra é a mesma para a mesma variante) */
  nome: string
  tipo: TipoDia
}

export interface Divisao {
  nome: string
  /** sequência de treinos (o próximo é sempre o seguinte da lista, §6.2) */
  sequencia: ModeloDia[]
}

interface Base {
  variante: string
  rotulo: string
  tipo: TipoDia
}

const fb = (l: string): Base => ({ variante: `fb-${l}`, rotulo: 'Full body', tipo: 'fullbody' })
const dia = (variante: string, rotulo: string, tipo: TipoDia): Base => ({ variante, rotulo, tipo })

/** C5: cada variante recebe uma letra (Treino A, B, C…) na ordem em que aparece. */
function comLetras(nome: string, bases: Base[]): Divisao {
  const letras = new Map<string, string>()
  for (const b of bases) if (!letras.has(b.variante)) letras.set(b.variante, String.fromCharCode(65 + letras.size))
  return { nome, sequencia: bases.map((b) => ({ variante: b.variante, tipo: b.tipo, nome: `Treino ${letras.get(b.variante)} · ${b.rotulo}` })) }
}

export function definirDivisao(params: { diasSemana: DiasSemana; nivel: Nivel; enfases: readonly Enfase[]; fase: Fase }): Divisao {
  const { nivel, enfases, fase } = params
  if (fase === 'readaptacao') {
    // §6.1: full body, máximo 4 dias na semana nessa fase
    const dias = Math.min(params.diasSemana, MAX_DIAS_READAPTACAO)
    if (dias === 2) return comLetras('Full body A / B (readaptação)', [fb('A'), fb('B')])
    if (dias === 3) return comLetras('Full body A / B / C (readaptação)', [fb('A'), fb('B'), fb('C')])
    return comLetras('Full body A / B (readaptação)', [fb('A'), fb('B'), fb('A'), fb('B')])
  }
  switch (params.diasSemana) {
    case 2:
      return comLetras('Full body A / B', [fb('A'), fb('B')])
    case 3:
      if (nivel === 'intermediario') {
        return comLetras('Push / Pull / Legs', [dia('push', 'Push', 'push'), dia('pull', 'Pull', 'pull'), dia('legs', 'Legs', 'legs')])
      }
      return comLetras('Full body A / B / C', [fb('A'), fb('B'), fb('C')])
    case 4:
      // §6.2: ênfase inferior ou glúteos com 4 dias vira Inferior / Superior / Inferior / Full body
      // (A12: automático; C2: só quando a ênfase efetiva é toda de membros inferiores)
      if (enfaseSoInferior(enfases)) {
        return comLetras('Inferior / Superior / Inferior / Full body', [
          dia('inf-A', 'Inferior', 'inferior'),
          dia('sup', 'Superior', 'superior'),
          dia('inf-B', 'Inferior', 'inferior'),
          fb('A'),
        ])
      }
      return comLetras('Superior / Inferior / Superior / Inferior', [
        dia('sup-A', 'Superior', 'superior'),
        dia('inf-A', 'Inferior', 'inferior'),
        dia('sup-B', 'Superior', 'superior'),
        dia('inf-B', 'Inferior', 'inferior'),
      ])
    case 5:
      return comLetras('Superior / Inferior / Push / Pull / Legs', [
        dia('sup', 'Superior', 'superior'),
        dia('inf', 'Inferior', 'inferior'),
        dia('push', 'Push', 'push'),
        dia('pull', 'Pull', 'pull'),
        dia('legs', 'Legs', 'legs'),
      ])
    case 6:
      return comLetras('Push / Pull / Legs × 2', [
        dia('push-A', 'Push', 'push'),
        dia('pull-A', 'Pull', 'pull'),
        dia('legs-A', 'Legs', 'legs'),
        dia('push-B', 'Push', 'push'),
        dia('pull-B', 'Pull', 'pull'),
        dia('legs-B', 'Legs', 'legs'),
      ])
  }
}

/** B16: core no fim do treino, em dias alternados da sequência (posições 0, 2, 4). */
export function diaTemCore(indice: number): boolean {
  return indice % 2 === 0
}
