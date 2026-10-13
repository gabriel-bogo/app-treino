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
  { valor: 'equilibrado', rotulo: 'Equilibrado', descricao: 'Corpo todo por igual' },
  { valor: 'inferior', rotulo: 'Inferiores', descricao: 'Pernas e glúteos' },
  { valor: 'superior', rotulo: 'Superiores', descricao: 'Peito, costas, ombros e braços' },
  { valor: 'gluteos', rotulo: 'Glúteos', descricao: 'Foco extra em glúteos' },
]

export const OPCOES_DIAS: { valor: DiasSemana; rotulo: string }[] = [2, 3, 4, 5, 6].map((d) => ({ valor: d as DiasSemana, rotulo: String(d) }))

export const OPCOES_DURACAO: { valor: DuracaoMin; rotulo: string }[] = [30, 45, 60, 75, 90].map((d) => ({
  valor: d as DuracaoMin,
  rotulo: `${d} min`,
}))

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

export type ErrosPerfil = Partial<Record<'nome' | 'sexo' | 'nascimento' | 'alturaCm' | 'pesoInicialKg' | 'nivel' | 'objetivo' | 'enfase' | 'diasSemana' | 'duracaoMin', string>>

export function validarDadosPessoais(r: RascunhoPerfil, hoje: string): ErrosPerfil {
  const e: ErrosPerfil = {}
  if (!r.nome?.trim()) e.nome = 'Digite seu nome ou apelido.'
  if (!r.sexo) e.sexo = 'Escolha uma opção.'
  if (!r.nascimento || !/^\d{4}-\d{2}-\d{2}$/.test(r.nascimento)) e.nascimento = 'Informe a data de nascimento.'
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
  if (!r.objetivo) e.objetivo = 'Escolha um objetivo.'
  if (!r.enfase) e.enfase = 'Escolha a ênfase.'
  if (!r.diasSemana) e.diasSemana = 'Escolha quantos dias.'
  if (!r.duracaoMin) e.duracaoMin = 'Escolha a duração.'
  return e
}

/** Converte texto digitado ("72,5") em número; vazio ou inválido → undefined. */
export function lerNumero(texto: string): number | undefined {
  const v = Number(texto.replace(',', '.').trim())
  return texto.trim() && Number.isFinite(v) ? v : undefined
}
