// Opções e validação do perfil (§4). Lógica pura.

import { idadeEm } from './datas'
import type { DiasSemana, DuracaoMin, Enfase, Limitacao, NConfirmacoes, Nivel, Objetivo, Perfil, Sexo } from './tipos'

export const OPCOES_SEXO: { valor: Sexo; rotulo: string }[] = [
  { valor: 'feminino', rotulo: 'Feminino' },
  { valor: 'masculino', rotulo: 'Masculino' },
]

export const OPCOES_NIVEL: { valor: Nivel; rotulo: string; descricao: string }[] = [
  { valor: 'iniciante', rotulo: 'Iniciante', descricao: 'Nunca treinou ou treinou pouco' },
  { valor: 'retornando', rotulo: 'Retornando', descricao: 'Já treinou, mas está voltando após uma pausa' },
  { valor: 'intermediario', rotulo: 'Intermediário', descricao: 'Treina com regularidade' },
]

export const OPCOES_OBJETIVO: { valor: Objetivo; rotulo: string; descricao: string }[] = [
  { valor: 'hipertrofia', rotulo: 'Hipertrofia', descricao: 'Ganhar massa muscular' },
  { valor: 'emagrecimento', rotulo: 'Emagrecimento', descricao: 'Emagrecer e melhorar o condicionamento' },
  { valor: 'saude', rotulo: 'Saúde geral', descricao: 'Ficar mais forte e saudável' },
]

export const OPCOES_ENFASE: { valor: Enfase; rotulo: string; descricao: string }[] = [
  { valor: 'inferior', rotulo: 'Inferiores', descricao: 'Pernas e glúteos' },
  { valor: 'superior', rotulo: 'Superiores', descricao: 'Peito, costas, ombros e braços' },
  { valor: 'gluteos', rotulo: 'Glúteos', descricao: 'Foco extra em glúteos' },
]

export const OPCOES_DIAS: { valor: DiasSemana; rotulo: string }[] = [2, 3, 4, 5, 6].map((d) => ({ valor: d as DiasSemana, rotulo: String(d) }))

/** C10: opções de número de treinos (A, B, C…): de 2 até os dias por semana. */
export function opcoesTreinos(dias: DiasSemana | undefined): { valor: DiasSemana; rotulo: string }[] {
  return ([2, 3, 4, 5, 6] as DiasSemana[]).filter((n) => n <= (dias ?? 6)).map((n) => ({ valor: n, rotulo: letrasTreinos(n) }))
}

/** 3 → "A, B, C" */
export function letrasTreinos(n: number): string {
  return Array.from({ length: n }, (_, i) => String.fromCharCode(65 + i)).join(', ')
}

/** C10: sugestão de treinos para os dias (ex: 5 dias → 3 treinos, A B C A B). */
export function treinosRecomendados(dias: DiasSemana): DiasSemana {
  return ({ 2: 2, 3: 3, 4: 4, 5: 3, 6: 3 } as const)[dias]
}

/** C3: barra deslizante de 30 a 120 min, de 5 em 5. */
export const DURACAO = { min: 30, max: 120, passo: 5, padrao: 60 } as const

/** "45 min", "1 h", "1 h 15 min" */
export function textoDuracao(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (!h) return `${m} min`
  return m ? `${h} h ${m} min` : `${h} h`
}

/** Encaixa um valor qualquer na faixa da barra (30 a 120, de 5 em 5). */
export function ajustarDuracao(min: unknown): DuracaoMin {
  const n = typeof min === 'number' && Number.isFinite(min) ? min : DURACAO.padrao
  const r = Math.round(n / DURACAO.passo) * DURACAO.passo
  return Math.min(DURACAO.max, Math.max(DURACAO.min, r))
}

/**
 * C2: texto explicando o efeito das ênfases marcadas (null = nada a explicar).
 * Superior + inferior juntos se anulam; glúteos já fazem parte de inferior.
 */
export function avisoEnfases(enfases: Enfase[]): string | null {
  const sup = enfases.includes('superior')
  const inf = enfases.includes('inferior')
  const glu = enfases.includes('gluteos')
  if (sup && inf) {
    return glu
      ? 'Superiores e inferiores juntos se anulam: o treino fica equilibrado, com mais volume só para glúteos.'
      : 'Superiores e inferiores juntos se anulam: o treino fica equilibrado.'
  }
  if (inf && glu) return 'Inferiores já incluem glúteos. O efeito é o mesmo de marcar só inferiores.'
  return null
}

export const OPCOES_LIMITACAO: { valor: Limitacao; rotulo: string }[] = [
  { valor: 'joelho', rotulo: 'Joelho' },
  { valor: 'lombar', rotulo: 'Lombar' },
  { valor: 'ombro', rotulo: 'Ombro' },
  { valor: 'punho', rotulo: 'Punho' },
]

export const OPCOES_N: { valor: NConfirmacoes; rotulo: string; descricao: string }[] = [
  { valor: 1, rotulo: '1 treino', descricao: 'Avança mais rápido' },
  { valor: 2, rotulo: '2 treinos', descricao: 'Padrão' },
  { valor: 3, rotulo: '3 treinos', descricao: 'Mais cauteloso' },
]

/** Campos preenchidos no formulário (rascunho). */
export type RascunhoPerfil = Partial<Omit<Perfil, 'id' | 'avisoSaudeAceitoEm' | 'criadoEm' | 'atualizadoEm'>>

export type ErrosPerfil = Partial<Record<'nome' | 'sexo' | 'nascimento' | 'alturaCm' | 'pesoInicialKg' | 'nivel' | 'objetivos' | 'diasSemana' | 'treinos' | 'duracaoMin', string>>

export function validarDadosPessoais(r: RascunhoPerfil, hoje: string): ErrosPerfil {
  const e: ErrosPerfil = {}
  if (!r.nome?.trim()) e.nome = 'Digite seu nome ou apelido.'
  if (!r.sexo) e.sexo = 'Escolha uma opção.'
  if (!r.nascimento || !/^\d{4}-\d{2}-\d{2}$/.test(r.nascimento)) e.nascimento = 'Digite uma data válida no formato DD/MM/AAAA.'
  else if (r.nascimento > hoje) e.nascimento = 'A data não pode ser no futuro.'
  else {
    const idade = idadeEm(r.nascimento, hoje)
    if (idade < 10 || idade > 110) e.nascimento = 'Confira a data de nascimento.'
  }
  if (!r.alturaCm || r.alturaCm < 100 || r.alturaCm > 250) e.alturaCm = 'Altura entre 100 e 250 cm.'
  if (!r.pesoInicialKg || r.pesoInicialKg < 25 || r.pesoInicialKg > 350) e.pesoInicialKg = 'Peso entre 25 e 350 kg.'
  return e
}

export function validarTreino(r: RascunhoPerfil): ErrosPerfil {
  const e: ErrosPerfil = {}
  if (!r.nivel) e.nivel = 'Escolha seu nível.'
  if (!r.objetivos?.length) e.objetivos = 'Escolha pelo menos um objetivo.'
  if (!r.diasSemana) e.diasSemana = 'Escolha quantos dias.'
  else if (!r.treinos || r.treinos > r.diasSemana) e.treinos = 'Escolha quantos treinos.'
  if (!r.duracaoMin || r.duracaoMin < DURACAO.min || r.duracaoMin > DURACAO.max) e.duracaoMin = 'Escolha a duração.'
  return e
}

const OBJETIVOS: readonly Objetivo[] = ['hipertrofia', 'emagrecimento', 'saude']
const ENFASES: readonly Enfase[] = ['inferior', 'superior', 'gluteos']

/**
 * Converte um perfil salvo por uma versão anterior do app (objetivo e ênfase
 * únicos, duração 30/45/60/75/90) para o formato atual. Usado na atualização
 * do banco e ao importar backup antigo. Perfil já no formato atual passa igual.
 */
export function normalizarPerfil<T extends object>(bruto: T): T & Pick<Perfil, 'objetivos' | 'enfases' | 'duracaoMin' | 'treinos'> {
  const p = bruto as Record<string, unknown>
  const { objetivo, enfase, ...resto } = p
  const objetivos = (Array.isArray(p.objetivos) ? p.objetivos : [objetivo]).filter((o): o is Objetivo => OBJETIVOS.includes(o as Objetivo))
  const enfases = (Array.isArray(p.enfases) ? p.enfases : [enfase]).filter((x): x is Enfase => ENFASES.includes(x as Enfase))
  return {
    ...(resto as T),
    objetivos: objetivos.length ? [...new Set(objetivos)] : ['saude'],
    enfases: [...new Set(enfases)],
    duracaoMin: ajustarDuracao(p.duracaoMin),
    treinos: ajustarTreinos(p.treinos, p.diasSemana),
  }
}

/** C10: número de treinos válido para os dias (perfil antigo sem o campo: a sugestão para os dias). */
export function ajustarTreinos(treinos: unknown, dias: unknown): DiasSemana {
  const d = ([2, 3, 4, 5, 6] as number[]).includes(dias as number) ? (dias as DiasSemana) : 6
  if (typeof treinos !== 'number' || !Number.isInteger(treinos)) return treinosRecomendados(d)
  return Math.min(d, Math.max(2, treinos)) as DiasSemana
}

/** Converte texto digitado ("72,5") em número; vazio ou inválido → undefined. */
export function lerNumero(texto: string): number | undefined {
  const v = Number(texto.replace(',', '.').trim())
  return texto.trim() && Number.isFinite(v) ? v : undefined
}
