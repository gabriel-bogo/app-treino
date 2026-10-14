// Divisão do treino conforme os dias por semana (§6.2) e a fase (§6.1).

import type { DiasSemana, Enfase, Fase, Nivel, TipoDia } from '../tipos'
import { enfaseSoInferior, focoSuperior } from './regras'

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

/**
 * C9: a readaptação usa a mesma divisão escolhida (não força mais full body);
 * o que muda nela são séries, repetições e cargas (§6.1).
 */
export function definirDivisao(params: { diasSemana: DiasSemana; nivel: Nivel; enfases: readonly Enfase[]; fase: Fase }): Divisao {
  const d = divisaoBase(params)
  return params.fase === 'readaptacao' ? { ...d, nome: `${d.nome} (readaptação)` } : d
}

/**
 * C8: foco em superiores (só "Superiores" marcado), no estilo de ficha de academia:
 * ombros + tríceps, peito + costas + bíceps e um dia curto de pernas.
 */
function divisaoFocoSuperior(dias: DiasSemana): Divisao {
  const ot = (v: string) => dia(`ot-${v}`, 'Ombros e tríceps', 'ombros_triceps')
  const pcb = (v: string) => dia(`pcb-${v}`, 'Peito, costas e bíceps', 'peito_costas_biceps')
  const pernas = (v: string) => dia(`pernas-${v}`, 'Pernas', 'pernas')
  const nome = 'Foco em superiores'
  switch (dias) {
    case 2:
      return comLetras(nome, [dia('pot', 'Peito, ombros e tríceps', 'peito_ombros_triceps'), dia('cbp', 'Costas, bíceps e pernas', 'costas_biceps_pernas')])
    case 3:
      return comLetras(nome, [ot('A'), pcb('A'), pernas('A')])
    case 4:
      // peito/costas 2× (o "B" depois das pernas), sem repetir músculo em dias seguidos
      return comLetras(nome, [ot('A'), pcb('A'), pernas('A'), pcb('B')])
    case 5:
      return comLetras(nome, [ot('A'), pcb('A'), pernas('A'), ot('B'), pcb('B')])
    case 6:
      return comLetras(nome, [ot('A'), pcb('A'), pernas('A'), ot('B'), pcb('B'), pernas('B')])
  }
}

function divisaoBase(params: { diasSemana: DiasSemana; nivel: Nivel; enfases: readonly Enfase[] }): Divisao {
  const { nivel, enfases } = params
  if (focoSuperior(enfases)) return divisaoFocoSuperior(params.diasSemana)
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

/** B16: core no fim do treino, em dias alternados da sequência (posições 0, 2, 4). C8: sem core no foco em superiores. */
export function diaTemCore(indice: number, enfases: readonly Enfase[] = []): boolean {
  return !focoSuperior(enfases) && indice % 2 === 0
}
