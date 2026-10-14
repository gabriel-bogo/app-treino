// Regras numéricas do motor de sugestão (§6.1 a §6.7). Cada constante cita a
// seção da especificação (docs/app-treino-spec.md) ou a decisão registrada no
// planejamento (A1..A12, B1..B20).

import type { Enfase, Fase, Grupo, Nivel, NivelExercicio, Objetivo, Sexo, TipoDia } from '../tipos'

/** §6.4: minutos reservados para o aquecimento geral + séries de aproximação. */
export const MIN_AQUECIMENTO = 8

/** §6.4: estimativa por série (execução + descanso), em minutos. */
export const MIN_POR_SERIE = { composto: 3, isolado: 2 } as const

/** B14: o aquecimento específico de ombro (4 séries de isolado) entra no tempo do treino. */
export const MIN_AQUECIMENTO_OMBRO = 4 * MIN_POR_SERIE.isolado

/** A1: na Fase 1 todo exercício usa o ciclo 8→12 (§6.8). */
export const FAIXA_NORMAL = { min: 8, max: 12 } as const

/** §6.1: readaptação em 12 a 15 repetições. */
export const FAIXA_READAPTACAO = { min: 12, max: 15 } as const

/** §6.13 + A8: mínimo de repetições para exercícios com peso do corpo. */
export const MINIMO_PESO_CORPO = 5

/** §6.11: aquecimento específico de ombro, 2 séries de 15. */
export const AQUECIMENTO_OMBRO = { series: 2, reps: 15 } as const

/** §6.1 + A4: readaptação dura 3 "semanas de treino" (3 × dias efetivos). */
export const SEMANAS_READAPTACAO = 3

/** §6.3: volume semanal inicial dos grupos grandes (8 a 10; começa em 8). */
export const VOLUME_INICIAL_GRANDE = 8
/** §6.3: teto do aumento gradual (12 a 16). */
export const VOLUME_MAXIMO_GRANDE = 16
/** A3: aumento a cada revisão (3 semanas) quando a progressão está acontecendo. */
export const AUMENTO_VOLUME = 2
export const DIAS_REVISAO_VOLUME = 21
/** A3: proporção mínima de exercícios do grupo que subiram um degrau na janela. */
export const PROPORCAO_PROGRESSO_VOLUME = 0.5
/** §6.3 + A3: grupos pequenos e piso dos grupos sem ênfase. */
export const VOLUME_MINIMO = 6
/** §6.3: grupo com ênfase recebe +30 a 40% (usamos +35%). */
export const MULT_ENFASE = 1.35
/** §6.6: feminino tem tolerância de volume ~10% maior. */
export const MULT_VOLUME_FEMININO = 1.1
/** §6.6: feminino tem descanso ~15% menor. */
export const MULT_DESCANSO_FEMININO = 0.85
/** A3: a série conta 1 para o grupo principal e 0,5 para cada grupo secundário. */
export const PESO_SECUNDARIO = 0.5

/** §6.3 + B17: grupos que recebem cada ênfase. */
export const GRUPOS_DA_ENFASE: Record<Enfase, Grupo[]> = {
  inferior: ['quadriceps', 'posteriores', 'gluteos', 'panturrilha'],
  superior: ['peito', 'costas', 'ombros', 'biceps', 'triceps'],
  gluteos: ['gluteos'],
}

/**
 * C2: grupos com ênfase para as partes marcadas (vazio = equilibrado).
 * Superior + inferior juntos cobrem o corpo todo e se anulam; glúteos, se
 * marcado também, continua valendo.
 */
export function gruposDaEnfase(enfases: readonly Enfase[]): Grupo[] {
  const anula = enfases.includes('superior') && enfases.includes('inferior')
  const efetivas = anula ? enfases.filter((e) => e === 'gluteos') : enfases
  return [...new Set(efetivas.flatMap((e) => GRUPOS_DA_ENFASE[e]))]
}

/** C8: a ênfase efetiva é só de membros superiores → divisão com foco em superiores. */
export function focoSuperior(enfases: readonly Enfase[]): boolean {
  const grupos = gruposDaEnfase(enfases)
  return grupos.length > 0 && grupos.every((g) => GRUPOS_DA_ENFASE.superior.includes(g))
}

/**
 * C8: no foco em superiores, pernas entram só no dia de pernas, com uns 3
 * exercícios (2 de quadríceps e 1 de posteriores, 3 séries cada). Sem glúteo
 * isolado, panturrilha nem abdômen. Séries por dia de pernas.
 */
/** C8: séries semanais base dos superiores no foco em superiores (antes da ênfase de +35%). */
export const FOCO_SUPERIOR_BASE = { grande: 10, pequeno: 8 } as const

export const PERNAS_FOCO_SUPERIOR: Partial<Record<Grupo, number>> = { quadriceps: 6, posteriores: 3 }

/** §6.2 + A12: a ênfase efetiva é só de membros inferiores (inferior e/ou glúteos). */
export function enfaseSoInferior(enfases: readonly Enfase[]): boolean {
  const grupos = gruposDaEnfase(enfases)
  return grupos.length > 0 && grupos.every((g) => GRUPOS_DA_ENFASE.inferior.includes(g))
}

/** A3: grupos grandes. */
export const GRANDES: Grupo[] = ['peito', 'costas', 'ombros', 'quadriceps', 'posteriores', 'gluteos']

/**
 * Ordem em que o motor preenche os grupos. Os que dão crédito de grupo
 * secundário vêm antes de quem o recebe (ex: agachamento antes de glúteos,
 * supino antes de tríceps).
 */
export const ORDEM_PREENCHIMENTO: Grupo[] = ['quadriceps', 'posteriores', 'peito', 'costas', 'ombros', 'gluteos', 'triceps', 'biceps', 'panturrilha', 'core']

/** §6.2: agrupamentos de cada tipo de dia. Ombros: porção push (anterior/lateral) e pull (posterior). */
export const GRUPOS_DO_DIA: Record<TipoDia, Grupo[]> = {
  fullbody: ['quadriceps', 'posteriores', 'peito', 'costas', 'ombros', 'gluteos', 'triceps', 'biceps', 'panturrilha'],
  superior: ['peito', 'costas', 'ombros', 'triceps', 'biceps'],
  inferior: ['quadriceps', 'posteriores', 'gluteos', 'panturrilha'],
  push: ['peito', 'ombros', 'triceps'],
  pull: ['costas', 'ombros', 'biceps'],
  legs: ['quadriceps', 'posteriores', 'gluteos', 'panturrilha'],
  ombros_triceps: ['ombros', 'triceps'],
  peito_costas_biceps: ['peito', 'costas', 'biceps'],
  peito_ombros_triceps: ['peito', 'ombros', 'triceps'],
  costas_biceps_pernas: ['costas', 'biceps', 'quadriceps', 'posteriores'],
  pernas: ['quadriceps', 'posteriores'],
}

/** Em dia de push só entra ombro "push"; em dia de pull, só ombro "pull" (deltoide posterior). */
export const CATEGORIA_OMBRO_DO_DIA: Partial<Record<TipoDia, 'push' | 'pull'>> = { push: 'push', pull: 'pull', peito_ombros_triceps: 'push' }

/**
 * §6.5 + B6: descanso padrão (meio da faixa), em segundos.
 * Hipertrofia 2-3 min / 60-90 s; Emagrecimento 60-90 s / 45-60 s; Saúde 90 s / 60 s.
 * Na readaptação (§6.5 vale só depois dela) usamos os valores de saúde geral (A4).
 */
const DESCANSO: Record<Objetivo, { composto: number; isolado: number }> = {
  hipertrofia: { composto: 150, isolado: 75 },
  emagrecimento: { composto: 75, isolado: 52.5 },
  saude: { composto: 90, isolado: 60 },
}

export function arredondar5(seg: number): number {
  return Math.round(seg / 5) * 5
}

/** C1: com mais de um objetivo, o descanso é a média dos descansos de cada um. */
export function descansoSegundos(objetivos: readonly Objetivo[], tipo: 'composto' | 'isolado', sexo: Sexo, fase: Fase): number {
  const usados: readonly Objetivo[] = fase === 'readaptacao' || !objetivos.length ? ['saude'] : objetivos
  const base = usados.reduce((soma, o) => soma + DESCANSO[o][tipo], 0) / usados.length
  return arredondar5(sexo === 'feminino' ? base * MULT_DESCANSO_FEMININO : base)
}

/** §6.1 + A4: 2 séries na primeira semana de readaptação, 3 depois. */
export function seriesReadaptacao(semana: number): number {
  return semana <= 0 ? 2 : 3
}

/** Níveis de exercício compatíveis com o nível da pessoa. */
export function niveisCompativeis(nivel: Nivel): NivelExercicio[] {
  return nivel === 'iniciante' ? ['iniciante'] : ['iniciante', 'intermediario']
}

/** Quantos treinos dura a readaptação (A4: 3 semanas de treino; C9: na divisão escolhida). */
export function totalTreinosReadaptacao(diasSemana: number): number {
  return SEMANAS_READAPTACAO * diasSemana
}
