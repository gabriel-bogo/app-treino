// Divisão do treino conforme os dias por semana (§6.2) e a fase (§6.1).

import type { DiasSemana, Enfase, Fase, Grupo, Nivel, TipoDia } from '../tipos'
import { FREQUENCIA_MINIMA, GRUPOS_DA_ENFASE, NOME_CURTO, GRUPOS_DO_DIA, enfaseSoInferior, focoSuperior, nomeDosMusculos } from './regras'

export interface ModeloDia {
  /** variante única (dias com o mesmo modelo repetem exatamente os mesmos exercícios) */
  variante: string
  /** C5: "Treino A · Superior" (a letra é a mesma para a mesma variante) */
  nome: string
  tipo: TipoDia
  /** C11: músculos do treino (core à parte, em dias alternados, quando não é personalizado) */
  grupos: Grupo[]
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
  grupos?: Grupo[]
}

const dia = (variante: string, rotulo: string, tipo: TipoDia): Base => ({ variante, rotulo, tipo })

/** C5: cada variante recebe uma letra (Treino A, B, C…) na ordem em que aparece. */
function comLetras(nome: string, bases: Base[]): Divisao {
  const letras = new Map<string, string>()
  for (const b of bases) if (!letras.has(b.variante)) letras.set(b.variante, String.fromCharCode(65 + letras.size))
  return {
    nome,
    sequencia: bases.map((b) => ({ variante: b.variante, tipo: b.tipo, grupos: b.grupos ?? GRUPOS_DO_DIA[b.tipo], nome: `Treino ${letras.get(b.variante)} · ${b.rotulo}` })),
  }
}

/**
 * C9: a readaptação usa a mesma divisão escolhida (não força mais full body);
 * o que muda nela são séries, repetições e cargas (§6.1).
 */
export function definirDivisao(params: {
  diasSemana: DiasSemana
  nivel: Nivel
  enfases: readonly Enfase[]
  fase: Fase
  musculosPorTreino?: Grupo[][]
}): Divisao {
  const m = musculosValidos(params.musculosPorTreino, params.diasSemana)
  const d = m
    ? comLetras(
        'Personalizada',
        m.map((grupos, i) => ({ variante: `p-${i}`, rotulo: nomeDosMusculos(grupos), tipo: 'personalizado', grupos })),
      )
    : divisaoBase(params)
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
  const { enfases } = params
  if (focoSuperior(enfases)) return divisaoFocoSuperior(params.diasSemana)
  switch (params.diasSemana) {
    // C18: nada de full body; cada treino trabalha músculos diferentes do seguinte
    case 2:
      return enfaseSoInferior(enfases)
        ? comLetras('Inferior / Superior', [dia('inf', 'Inferior', 'inferior'), dia('sup', 'Superior', 'superior')])
        : comLetras('Superior / Inferior', [dia('sup', 'Superior', 'superior'), dia('inf', 'Inferior', 'inferior')])
    case 3:
      return comLetras('Push / Pull / Legs', [dia('push', 'Push', 'push'), dia('pull', 'Pull', 'pull'), dia('legs', 'Legs', 'legs')])
    case 4:
      // ênfase só em inferiores: começa pelas pernas (C18: o 4º treino deixa de ser full body)
      if (enfaseSoInferior(enfases)) {
        return comLetras('Inferior / Superior / Inferior / Superior', [
          dia('inf-A', 'Inferior', 'inferior'),
          dia('sup-A', 'Superior', 'superior'),
          dia('inf-B', 'Inferior', 'inferior'),
          dia('sup-B', 'Superior', 'superior'),
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

/** C11: a escolha da pessoa só vale se tiver um item (não vazio) por treino. */
export function musculosValidos(m: Grupo[][] | undefined, treinos: number): Grupo[][] | null {
  return m && m.length === treinos && m.every((g) => g.length > 0) ? m : null
}

/** B16: core no fim do treino, em dias alternados da sequência (posições 0, 2, 4). C8: sem core no foco em superiores. */
export function diaTemCore(indice: number, enfases: readonly Enfase[] = [], total = 0): boolean {
  // C18: com número ímpar de treinos, o último não tem core (senão repete no treino seguinte, o A)
  if (total % 2 === 1 && indice === total - 1) return false
  return !focoSuperior(enfases) && indice % 2 === 0
}

export interface ParamsFrequencia {
  diasSemana: DiasSemana
  treinos: DiasSemana
  nivel: Nivel
  enfases: readonly Enfase[]
  musculosPorTreino?: Grupo[][]
}

/**
 * C19: quantas vezes por semana cada músculo é treinado (dias ÷ treinos × treinos
 * em que ele aparece). Abdômen fica de fora; no foco em superiores, as pernas
 * também (é de propósito que elas treinam menos, C8).
 */
export function frequenciaPorMusculo(p: ParamsFrequencia): Partial<Record<Grupo, number>> {
  const d = definirDivisao({ diasSemana: p.treinos, nivel: p.nivel, enfases: p.enfases, fase: 'normal', musculosPorTreino: p.musculosPorTreino })
  const ignorar = new Set<Grupo>(['core', ...(focoSuperior(p.enfases) && !musculosValidos(p.musculosPorTreino, p.treinos) ? GRUPOS_DA_ENFASE.inferior : [])])
  const freq: Partial<Record<Grupo, number>> = {}
  const vezes = p.diasSemana / d.sequencia.length
  for (const m of d.sequencia) for (const g of new Set(m.grupos)) if (!ignorar.has(g)) freq[g] = (freq[g] ?? 0) + vezes
  return freq
}

/** C19: músculos que treinam menos de 1,5 vez por semana e a sugestão de número de treinos. */
export function avisoFrequencia(p: ParamsFrequencia): { musculos: Grupo[]; sugestao: DiasSemana | null } | null {
  const baixos = (q: ParamsFrequencia) =>
    Object.entries(frequenciaPorMusculo(q))
      .filter(([, f]) => (f ?? 0) + 1e-9 < FREQUENCIA_MINIMA)
      .map(([g]) => g as Grupo)
  const musculos = baixos(p)
  if (!musculos.length) return null
  // menos treinos diferentes = cada um se repete mais na semana (sem a escolha manual de músculos)
  let sugestao: DiasSemana | null = null
  for (let n = p.treinos - 1; n >= 2; n--) {
    if (!baixos({ ...p, treinos: n as DiasSemana, musculosPorTreino: undefined }).length) {
      sugestao = n as DiasSemana
      break
    }
  }
  return { musculos, sugestao }
}

/** C19: texto do aviso de frequência (null = tudo certo). */
export function textoAvisoFrequencia(p: ParamsFrequencia): string | null {
  const a = avisoFrequencia(p)
  if (!a) return null
  const lista = a.musculos.map((g) => NOME_CURTO[g])
  const quais = lista.length > 4 ? 'a maioria dos músculos' : lista.join(', ')
  const base = `Com ${p.diasSemana} dias e ${p.treinos} treinos, ${quais} ${lista.length === 1 ? 'treina' : 'treinam'} só 1 vez por semana. O ideal é 2 vezes.`
  if (a.sugestao) return `${base} Sugestão: ${a.sugestao} treinos diferentes (eles se revezam e cada músculo treina mais vezes).`
  return `${base} Com mais dias por semana dá para chegar perto disso.`
}
