// Tipos centrais do app. As referências "§x.y" apontam para as seções de
// docs/app-treino-spec.md.

// ───────────────────────── Perfil (§4) ─────────────────────────

export type Sexo = 'feminino' | 'masculino'
export type Nivel = 'iniciante' | 'retornando' | 'intermediario'
export type Objetivo = 'hipertrofia' | 'emagrecimento' | 'saude'
/** Parte do corpo com mais volume. Nenhuma marcada = equilibrado (C2). */
export type Enfase = 'inferior' | 'superior' | 'gluteos'
export type Limitacao = 'joelho' | 'lombar' | 'ombro' | 'punho'
export type DiasSemana = 2 | 3 | 4 | 5 | 6
/** Minutos por treino: 30 a 120, de 5 em 5 (C3). */
export type DuracaoMin = number
/** N de treinos para confirmar cada degrau da progressão (§6.8): 1 a 3, padrão 2 */
export type NConfirmacoes = 1 | 2 | 3

export interface Perfil {
  id: 'perfil'
  nome: string
  sexo: Sexo
  /** AAAA-MM-DD */
  nascimento: string
  alturaCm: number
  pesoInicialKg: number
  nivel: Nivel
  /** um ou mais (C1: descanso = média dos objetivos marcados) */
  objetivos: Objetivo[]
  /** vazio = equilibrado (C2) */
  enfases: Enfase[]
  diasSemana: DiasSemana
  /** C10: quantos treinos diferentes (A, B, C…), de 2 até os dias por semana; eles se revezam nos dias */
  treinos: DiasSemana
  /**
   * C11: músculos de cada treino escolhidos pela pessoa (um item por treino, na
   * ordem A, B, C…). Ausente = o app decide. Só vale se tiver `treinos` itens.
   */
  musculosPorTreino?: Grupo[][]
  duracaoMin: DuracaoMin
  /** vazio = "nenhuma" (§6.7: padrão no onboarding) */
  limitacoes: Limitacao[]
  nConfirmacoes: NConfirmacoes
  /** data/hora ISO do aceite obrigatório do aviso de saúde (§1) */
  avisoSaudeAceitoEm: string
  criadoEm: string
  atualizadoEm: string
}

// ─────────────────── Biblioteca de exercícios (§5) ───────────────────

/**
 * Grupos musculares usados pelo motor (volume semanal §6.3).
 * Grandes: peito, costas, ombros, quadriceps, posteriores, gluteos.
 * Pequenos: biceps, triceps, panturrilha, core.
 */
export type Grupo =
  | 'peito'
  | 'costas'
  | 'ombros'
  | 'quadriceps'
  | 'posteriores'
  | 'gluteos'
  | 'biceps'
  | 'triceps'
  | 'panturrilha'
  | 'core'

/** Em qual tipo de dia o exercício entra (§6.2: Push, Pull, Legs, Core) */
export type Categoria = 'push' | 'pull' | 'legs' | 'core'

/**
 * Padrão de movimento (§5). "isolado_bracos" cobre os isolados de membros
 * superiores em geral (braços, ombros, peito, costas), já que a lista da
 * especificação não tem categorias separadas para eles.
 */
export type Padrao =
  | 'empurrar_horizontal'
  | 'empurrar_vertical'
  | 'puxar_horizontal'
  | 'puxar_vertical'
  | 'agachar'
  | 'dobrar_quadril'
  | 'isolado_bracos'
  | 'isolado_pernas'
  | 'core'
  | 'panturrilha'

export type TipoExercicio = 'composto' | 'isolado'

export type Equipamento =
  | 'maquina'
  | 'cabo'
  | 'halter'
  | 'barra'
  | 'peso_corporal'
  | 'elastico'
  | 'kettlebell'

/** Como a carga é registrada (§6.14) */
export type TipoCarga = 'total' | 'porHalter' | 'porLado' | 'pesoCorpo'

export type NivelExercicio = 'iniciante' | 'intermediario' | 'avancado'

export interface Contraindicacao {
  limitacao: Limitacao
  /** forte: não sugerir; leve: sugerir com alerta e carga conservadora (§6.7) */
  nivel: 'forte' | 'leve'
}

export interface Exercicio {
  id: string
  nome: string
  /** nome original em inglês no Free Exercise DB */
  nomeOriginal: string
  grupo: Grupo
  gruposSecundarios: Grupo[]
  categoria: Categoria
  equipamento: Equipamento
  tipo: TipoExercicio
  padrao: Padrao
  nivel: NivelExercicio
  tipoCarga: TipoCarga
  /** registra reps por lado (§6.14) */
  unilateral: boolean
  /** menor incremento sugerido, na unidade do campo de carga (§5, §6.14) */
  incrementoCarga: number
  contraindicacoes: Contraindicacao[]
  substitutos: string[]
  /** caminhos relativos a /exercises/ */
  imagens: string[]
  passos: string[]
  errosComuns: string[]
  /** ordem de preferência dentro do grupo (menor = mais típico) */
  prioridade: number
  /** halter ou pegada neutra: preferido com limitação de ombro (§6.7) */
  amigavelOmbro?: boolean
  /** peso do corpo (§6.13) */
  tetoReps?: number
  variacaoMaisDificil?: string
  /** versões assistidas, em ordem de preferência */
  versaoAssistida?: string[]
  /** máquina assistida (graviton): mais carga = mais ajuda; progride reduzindo a carga */
  assistido?: boolean
  /** usado só no aquecimento específico de ombro (§6.11); o motor não o coloca no plano */
  soAquecimento?: boolean
}

/** Ajustes do usuário para um exercício (marcações da biblioteca e §6.14). */
export interface AjusteExercicio {
  exercicioId: string
  /** "indisponível na minha academia" */
  indisponivel?: boolean
  /** "evitar" (marcado manualmente, §6.7) */
  evitar?: boolean
  /** substitui o incremento padrão do exercício */
  incrementoCarga?: number
  /** só para tipoCarga porLado (padrão 20 kg) */
  pesoBarraKg?: number
}

// ───────────────────────── Plano (§6, §7) ─────────────────────────

export type Fase = 'readaptacao' | 'normal'

export type TipoDia =
  | 'fullbody'
  | 'superior'
  | 'inferior'
  | 'push'
  | 'pull'
  | 'legs'
  // C8: divisões com foco em superiores
  | 'ombros_triceps'
  | 'peito_costas_biceps'
  | 'peito_ombros_triceps'
  | 'costas_biceps_pernas'
  | 'pernas'
  // C11: músculos escolhidos pela pessoa
  | 'personalizado'

export interface Plano {
  id: 'atual'
  fase: Fase
  /** ex: "Full body A/B", "Push / Pull / Legs" */
  divisao: string
  /** data ISO de início da fase atual */
  inicioFase: string
  /** treinos concluídos na fase atual (readaptação conta treinos, A4) */
  treinosNaFase: number
  /** índice (em diasPlano.ordem) do próximo treino da sequência (§6.2) */
  proximoIndice: number
  /** séries semanais base por grupo grande antes dos multiplicadores (A3) */
  nivelVolume: Partial<Record<Grupo, number>>
  /** data ISO da última revisão de volume (a cada 3 semanas, A3) */
  ultimaRevisaoVolume: string
  geradoEm: string
  /** avisos do motor (ex: volume abaixo do recomendado) */
  avisos: string[]
  /** mensagem de mudança de fase para mostrar na tela inicial (ex: fim da readaptação) */
  mensagemFase?: string | null
  /** resumo do perfil usado para gerar; se mudar, o plano é refeito (B15) */
  assinatura: string
}

export interface DiaPlano {
  id: string
  ordem: number
  /** ex: "Full body A", "Superior B", "Push" */
  nome: string
  tipo: TipoDia
  /** dias com a mesma variante têm os mesmos exercícios (ex: A/B/A/B) */
  variante: string
  /** C11: músculos que este treino trabalha */
  grupos: Grupo[]
  /** estimativa pela regra da §6.4 */
  minutosEstimados: number
}

export type PapelExercicioPlano = 'trabalho' | 'aquecimento_ombro'

export interface ExercicioPlano {
  id: string
  diaId: string
  ordem: number
  exercicioId: string
  papel: PapelExercicioPlano
  series: number
  /** faixa de repetições (8-12 normal, 12-15 readaptação, 15 aquecimento) */
  repsMin: number
  repsMax: number
  descansoSeg: number
  /** contraindicação leve para alguma limitação do perfil (§6.7) */
  alerta?: string
  /** C14: incluído pela pessoa ("+ incluir exercício") */
  incluido?: boolean
}

// ───────────────────────── Treino (§3, §7) ─────────────────────────

export type MotivoTroca = 'ocupado' | 'sem_equipamento' | 'dor' | 'outro'

export interface Substituicao {
  originalId: string
  substitutoId: string
  motivo: MotivoTroca
  escopo: 'hoje' | 'plano'
  em: string
}

export type TipoSerie = 'aquecimento' | 'aproximacao' | 'trabalho' | 'extra'

export interface SerieTreino {
  uid: string
  tipo: TipoSerie
  /** carga no campo (unidade conforme tipoCarga); null = sem carga definida */
  carga: number | null
  reps: number | null
  repsAlvo: number | null
  feita: boolean
  feitaEm?: string
  /** segundos entre o check anterior e este (§3: descanso real) */
  descansoRealSeg?: number
}

export type StatusItemTreino = 'pendente' | 'concluido' | 'pulado'

export interface ItemTreino {
  uid: string
  exercicioId: string
  papel: PapelExercicioPlano
  /** se foi trocado durante o treino, o exercício original (§6.10) */
  originalId?: string
  motivoTroca?: MotivoTroca
  series: SerieTreino[]
  descansoSeg: number
  repsMin: number
  repsMax: number
  /** carga sugerida no início do treino (null = "comece leve") */
  cargaSugerida: number | null
  alerta?: string
  status: StatusItemTreino
  /** flag de dor marcada na sessão (§7 setLogs) */
  dor?: boolean
}

export interface TimerDescanso {
  /** descanso entre séries ou o aquecimento geral de 5 min (§6.11) */
  tipo?: 'descanso' | 'aquecimento'
  /** ISO de quando começou */
  inicio: string
  duracaoSeg: number
  /** +15 / -15 acumulados */
  ajusteSeg: number
}

export interface EstadoTreino {
  itens: ItemTreino[]
  /** uid do item aberto na tela */
  atualUid: string | null
  aquecimentoGeral: 'pendente' | 'feito' | 'pulado'
  /** horário do último check de série (para o descanso real) */
  ultimoCheckEm?: string
  timer: TimerDescanso | null
}

export interface Sessao {
  id: string
  diaId: string
  nomeDia: string
  fase: Fase
  inicio: string
  fim?: string
  status: 'andamento' | 'concluida' | 'descartada'
  duracaoSeg?: number
  observacoes?: string
  estado: EstadoTreino
  substituicoes: Substituicao[]
  /** card de retorno após pausa aplicado nesta sessão (§6.12) */
  ajustePausa?: AjustePausa
}

/** Série registrada (tabela setLogs, §7). Gerada ao finalizar a sessão. */
export interface RegistroSerie {
  id: string
  sessaoId: string
  exercicioId: string
  ordemExercicio: number
  serie: number
  tipo: TipoSerie
  carga: number | null
  reps: number | null
  repsAlvo: number | null
  rir?: number
  dor?: boolean
  feitaEm: string
  descansoRealSeg?: number
  /** data (AAAA-MM-DD) da sessão, para consultas */
  data: string
}

// ─────────────────────── Progressão (§6.8, §6.13) ───────────────────────

export type ModoProgressao = 'carga' | 'reps'

export interface EstadoProgressao {
  exercicioId: string
  modo: ModoProgressao
  /** carga de trabalho atual (unidade do campo); null = ainda não definida */
  carga: number | null
  /** carga antes do último aumento (para a regressão "volta à carga anterior") */
  cargaAnterior: number | null
  /** alvo de repetições atual; null = primeiro treino de peso corporal (sem alvo) */
  alvo: number | null
  /** confirmações (sucessos) no degrau atual */
  confirmacoes: number
  /** depois de regredir, precisa de N+1 confirmações (§6.8) */
  segurando: boolean
  /** fase em que o estado foi construído (readaptação usa 12-15) */
  fase: Fase
  /** última carga usada na readaptação (referência ao entrar no ciclo 8-12) */
  cargaReferencia?: number | null
  /** peso corporal chegou no teto: oferecer carga extra ou variação (§6.13) */
  noTeto?: boolean
  /** não conseguiu o mínimo de reps: sugerir versão assistida (§6.13) */
  sugerirAssistida?: boolean
  ultimaData?: string
}

export type TipoEvento =
  | 'aumento_reps'
  | 'aumento_carga'
  | 'regressao'
  | 'carga_nova'
  | 'retorno_pausa'
  | 'inicio'

export interface EventoProgressao {
  id: string
  exercicioId: string
  /** data ISO */
  data: string
  sessaoId?: string
  tipo: TipoEvento
  de: { carga: number | null; alvo: number | null }
  para: { carga: number | null; alvo: number | null }
}

export interface AjustePausa {
  dias: number
  /** fator aplicado às cargas (0.9 ou 0.8) */
  fator: number
  alvoOito: boolean
  texto: string
}

// ─────────────────────── Saúde (§10) ───────────────────────

export interface RegistroCorpo {
  /** AAAA-MM-DD (um registro por dia; registrar de novo substitui) */
  data: string
  pesoKg?: number
  cinturaCm?: number
  observacao?: string
}

// ─────────────────────── Configurações (§7, §8) ───────────────────────

export interface Configuracoes {
  id: 'app'
  primeiroUsoEm: string
  ultimoBackupEm?: string
  som: boolean
  /** "Trocar no plano" (§6.10): original → substituto */
  trocasNoPlano: Record<string, string>
  /** C14: exercícios que a pessoa incluiu num treino do plano (variante do treino → exercício) */
  incluidosNoPlano?: { variante: string; exercicioId: string }[]
  /** id da última sessão para a qual o ajuste de pausa já foi aplicado (§6.12) */
  pausaAplicadaApos?: string
}
