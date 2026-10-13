import dados from '../data/exercises.ptbr.json'
import type { AjusteExercicio, Equipamento, Exercicio, Grupo, Limitacao, TipoCarga } from './tipos'

// Biblioteca base (§5), gerada por scripts/curadoria/gerar.ts.

export const BIBLIOTECA = dados as Exercicio[]

const POR_ID = new Map(BIBLIOTECA.map((e) => [e.id, e]))

export function exercicioPorId(id: string): Exercicio | undefined {
  return POR_ID.get(id)
}

export const GRUPOS: Grupo[] = ['peito', 'costas', 'ombros', 'quadriceps', 'posteriores', 'gluteos', 'panturrilha', 'biceps', 'triceps', 'core']

/** Grupos grandes (§6.3, A3). */
export const GRUPOS_GRANDES: Grupo[] = ['peito', 'costas', 'ombros', 'quadriceps', 'posteriores', 'gluteos']

export const NOME_GRUPO: Record<Grupo, string> = {
  peito: 'Peito',
  costas: 'Costas',
  ombros: 'Ombros',
  quadriceps: 'Quadríceps',
  posteriores: 'Posteriores de coxa',
  gluteos: 'Glúteos',
  panturrilha: 'Panturrilha',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  core: 'Abdômen / core',
}

export const NOME_EQUIPAMENTO: Record<Equipamento, string> = {
  maquina: 'Máquina',
  cabo: 'Polia / cabo',
  halter: 'Halter',
  barra: 'Barra',
  peso_corporal: 'Peso do corpo',
  elastico: 'Elástico',
  kettlebell: 'Kettlebell',
}

/** Filtro rápido da troca de exercício (§6.10). */
export function comMaquina(eq: Equipamento): boolean {
  return eq === 'maquina' || eq === 'cabo'
}

/** Etiqueta ao lado do campo de carga (§6.14). */
export const ROTULO_CARGA: Record<TipoCarga, string> = {
  total: 'kg total',
  porHalter: 'kg por halter',
  porLado: 'kg por lado',
  pesoCorpo: 'kg extra',
}

export const NOME_LIMITACAO: Record<Limitacao, string> = {
  joelho: 'Joelho',
  lombar: 'Lombar',
  ombro: 'Ombro',
  punho: 'Punho',
}

export const PESO_BARRA_PADRAO = 20

/** A contraindicação mais severa do exercício para as limitações do perfil (§6.7). */
export function contraindicacaoPara(ex: Exercicio, limitacoes: Limitacao[]): 'forte' | 'leve' | null {
  let pior: 'forte' | 'leve' | null = null
  for (const c of ex.contraindicacoes) {
    if (!limitacoes.includes(c.limitacao)) continue
    if (c.nivel === 'forte') return 'forte'
    pior = 'leve'
  }
  return pior
}

/** Texto do alerta para contraindicação leve. */
export function textoAlerta(ex: Exercicio, limitacoes: Limitacao[]): string | undefined {
  const leves = ex.contraindicacoes.filter((c) => c.nivel === 'leve' && limitacoes.includes(c.limitacao))
  if (!leves.length) return undefined
  const nomes = leves.map((c) => NOME_LIMITACAO[c.limitacao].toLowerCase()).join(' e ')
  return `Atenção (${nomes}): use carga conservadora e pare se sentir dor.`
}

/** Exercício pode aparecer em plano, troca ou sugestão? (§6.7, §6.10 regra 3) */
export function exercicioPermitido(ex: Exercicio, limitacoes: Limitacao[], ajustes: Map<string, AjusteExercicio>): boolean {
  const aj = ajustes.get(ex.id)
  if (aj?.indisponivel || aj?.evitar) return false
  return contraindicacaoPara(ex, limitacoes) !== 'forte'
}

export function pesoBarra(ex: Exercicio, ajuste?: AjusteExercicio): number {
  return ex.tipoCarga === 'porLado' ? (ajuste?.pesoBarraKg ?? PESO_BARRA_PADRAO) : 0
}

export function mapaAjustes(lista: AjusteExercicio[] | undefined): Map<string, AjusteExercicio> {
  return new Map((lista ?? []).map((a) => [a.exercicioId, a]))
}
