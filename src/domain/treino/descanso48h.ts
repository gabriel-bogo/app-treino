// A11: a sequência não pula treino (§6.2), então pode acontecer de o próximo
// treino trabalhar um grupo treinado há menos de 48 h (§6.3). O app só avisa.

import { exercicioPorId, NOME_GRUPO } from '../biblioteca'
import type { Grupo } from '../tipos'

const HORAS = 48

export function gruposTreinadosRecentemente(params: {
  proximos: string[]
  recentes: { inicio: string; exercicios: string[] }[]
  agora: Date
}): Grupo[] {
  const limite = params.agora.getTime() - HORAS * 3600 * 1000
  const recentes = new Set<Grupo>()
  for (const s of params.recentes) {
    if (new Date(s.inicio).getTime() < limite) continue
    for (const id of s.exercicios) {
      const g = exercicioPorId(id)?.grupo
      if (g && g !== 'core') recentes.add(g)
    }
  }
  const proximos = new Set<Grupo>()
  for (const id of params.proximos) {
    const g = exercicioPorId(id)?.grupo
    if (g && g !== 'core' && recentes.has(g)) proximos.add(g)
  }
  return [...proximos]
}

export function textoAviso48h(grupos: Grupo[]): string {
  const nomes = grupos.map((g) => NOME_GRUPO[g].toLowerCase())
  const lista = nomes.length > 1 ? `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}` : nomes[0]
  return `Você treinou ${lista} há menos de 48 horas. Se puder, descanse mais um dia; se preferir, pode treinar normalmente.`
}
