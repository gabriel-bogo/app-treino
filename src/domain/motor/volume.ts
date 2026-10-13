// Aumento gradual do volume semanal (§6.3 + A3): a cada 3 semanas, +2 séries
// no grupo grande em que pelo menos metade dos exercícios subiu um degrau
// (repetição ou carga) no período, até 16.

import type { EventoProgressao, Grupo } from '../tipos'
import { AUMENTO_VOLUME, GRANDES, PROPORCAO_PROGRESSO_VOLUME, VOLUME_INICIAL_GRANDE, VOLUME_MAXIMO_GRANDE } from './regras'

export function revisarVolume(params: {
  nivelVolume: Partial<Record<Grupo, number>>
  /** exercícios de trabalho do plano atual, por grupo principal */
  exerciciosPorGrupo: Partial<Record<Grupo, string[]>>
  /** eventos de progressão dentro da janela de revisão */
  eventos: Pick<EventoProgressao, 'exercicioId' | 'tipo'>[]
}): Partial<Record<Grupo, number>> {
  const subiram = new Set(params.eventos.filter((e) => e.tipo === 'aumento_reps' || e.tipo === 'aumento_carga').map((e) => e.exercicioId))
  const novo = { ...params.nivelVolume }
  for (const g of GRANDES) {
    const lista = [...new Set(params.exerciciosPorGrupo[g] ?? [])]
    if (!lista.length) continue
    const proporcao = lista.filter((id) => subiram.has(id)).length / lista.length
    if (proporcao >= PROPORCAO_PROGRESSO_VOLUME) {
      novo[g] = Math.min(VOLUME_MAXIMO_GRANDE, (novo[g] ?? VOLUME_INICIAL_GRANDE) + AUMENTO_VOLUME)
    }
  }
  return novo
}
