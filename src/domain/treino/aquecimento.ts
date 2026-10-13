// Séries de aproximação (§6.11): antes do primeiro exercício composto de cada
// grupo grande no dia.
// - Carga de trabalho até 20 kg (carga total, B11): 1 série com ~50% × 10
// - Acima de 20 kg: ~50% × 10, depois ~70% × 5
// - Arredonda pelo incremento real do exercício (§6.14)
// Sem carga definida (exercício novo) não há aproximação (B10).

import type { AjusteExercicio, Exercicio } from '../tipos'
import { GRANDES } from '../motor/regras'
import { arredondarParaBaixo, cargaTotal } from '../progressao/carga'
import { pesoBarra } from '../biblioteca'

export interface SerieAproximacao {
  /** valor no campo de carga (unidade do tipo de carga) */
  carga: number
  reps: number
}

export const LIMITE_UMA_SERIE_KG = 20

/** Converte uma carga total desejada para o valor do campo, no incremento. */
function campoParaTotal(ex: Exercicio, total: number, incremento: number, ajuste?: AjusteExercicio): number {
  if (ex.tipoCarga === 'porLado') return arredondarParaBaixo(Math.max(0, (total - pesoBarra(ex, ajuste)) / 2), incremento)
  return arredondarParaBaixo(total, incremento)
}

export function seriesAproximacao(ex: Exercicio, cargaTrabalho: number | null, incremento: number, ajuste?: AjusteExercicio): SerieAproximacao[] {
  if (cargaTrabalho === null || cargaTrabalho <= 0 || ex.tipoCarga === 'pesoCorpo' || ex.assistido) return []
  const total = cargaTotal(ex, cargaTrabalho, ajuste)
  const porcentagens: [number, number][] = total <= LIMITE_UMA_SERIE_KG ? [[0.5, 10]] : [[0.5, 10], [0.7, 5]]
  return porcentagens.map(([p, reps]) => ({ carga: campoParaTotal(ex, total * p, incremento, ajuste), reps }))
}

/** Quais itens do dia recebem aproximação: o 1º composto de cada grupo grande. */
export function precisaAproximacao(exercicios: Exercicio[]): boolean[] {
  const vistos = new Set<string>()
  return exercicios.map((ex) => {
    if (ex.tipo !== 'composto' || !GRANDES.includes(ex.grupo) || vistos.has(ex.grupo)) return false
    vistos.add(ex.grupo)
    return true
  })
}
