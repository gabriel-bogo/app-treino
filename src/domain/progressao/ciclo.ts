// Progressão por exercício (§6.8, ciclo 8 → 12, sem deload na Fase 1) e
// exercícios com peso do corpo (§6.13). Lógica pura.
//
// Degrau = (carga, alvo de repetições). Regras:
// - Sucesso: bateu o alvo em todas as séries → conta 1 confirmação.
//   Com N confirmações (N+1 se estiver "segurando" após uma regressão),
//   sobe um degrau: alvo +1; no topo da faixa, carga + incremento e alvo
//   volta ao início da faixa.
// - Manter: errou o alvo por 1 rep em só 1 série → não conta, não regride.
// - Falha: errou por 2+ reps em alguma série ou errou em 2+ séries → desce
//   exatamente um degrau (A6): alvo −1; no início da faixa, volta para a
//   carga anterior com o alvo no topo (ou, sem carga anterior, carga −
//   incremento com o mesmo alvo). Depois segura por N+1 confirmações.
// - Avaliação considera só as séries planejadas marcadas como feitas (A7).
// - Carga diferente da sugerida (A5): vale a menor carga das séries; maior
//   → vira carga nova (alvo no início da faixa); menor → o treino não conta.

import type { EstadoProgressao, Fase, TipoEvento } from '../tipos'
import { cargaAbaixo, proximaCargaAcima } from './carga'
import { FAIXA_NORMAL, FAIXA_READAPTACAO, MINIMO_PESO_CORPO } from '../motor/regras'

export type Classificacao = 'sucesso' | 'manter' | 'falha' | 'nao_conta'

export interface ConfigProgressao {
  /** N efetivo (perfil, +1 no modo conservador) */
  n: number
  incremento: number
  faixa: { min: number; max: number }
  /** máquina assistida: mais carga = mais fácil */
  assistido?: boolean
  /** peso do corpo: teto de repetições (§6.13) */
  teto?: number
}

/** Uma série de trabalho planejada e marcada como feita. */
export interface SerieFeita {
  carga: number | null
  reps: number
}

export interface EventoGerado {
  tipo: TipoEvento
  de: { carga: number | null; alvo: number | null }
  para: { carga: number | null; alvo: number | null }
}

export interface ResultadoProgressao {
  estado: EstadoProgressao
  classificacao: Classificacao
  eventos: EventoGerado[]
}

export function faixaDaFase(fase: Fase) {
  return fase === 'readaptacao' ? FAIXA_READAPTACAO : FAIXA_NORMAL
}

/** Tabela da §6.8: sucesso, manter ou falha. */
export function classificar(alvo: number, reps: number[]): Classificacao {
  if (!reps.length) return 'nao_conta'
  const erros = reps.map((r) => alvo - r).filter((d) => d > 0)
  if (erros.length === 0) return 'sucesso'
  if (erros.length === 1 && erros[0] === 1) return 'manter'
  return 'falha'
}

export function estadoInicial(exercicioId: string, fase: Fase, pesoCorpo: boolean): EstadoProgressao {
  return {
    exercicioId,
    modo: pesoCorpo ? 'reps' : 'carga',
    carga: null,
    cargaAnterior: null,
    alvo: pesoCorpo ? null : faixaDaFase(fase).min,
    confirmacoes: 0,
    segurando: false,
    fase,
  }
}

/**
 * Ajusta o estado quando a fase do treino muda (§6.8): ao sair da readaptação,
 * cada exercício entra no ciclo em 8 reps com a carga que o usuário
 * confirmar (campo vazio, mostrando a carga usada antes como referência).
 */
export function prepararParaFase(estado: EstadoProgressao, fase: Fase): EstadoProgressao {
  if (estado.fase === fase) return estado
  if (estado.modo === 'reps') return { ...estado, fase }
  return {
    ...estado,
    fase,
    cargaReferencia: estado.carga ?? estado.cargaReferencia ?? null,
    carga: null,
    cargaAnterior: null,
    alvo: faixaDaFase(fase).min,
    confirmacoes: 0,
    segurando: false,
  }
}

const passo = (e: EstadoProgressao) => ({ carga: e.carga, alvo: e.alvo })

function subirDegrau(e: EstadoProgressao, cfg: ConfigProgressao, eventos: EventoGerado[]) {
  const de = passo(e)
  if (e.alvo! < cfg.faixa.max) {
    e.alvo = e.alvo! + 1
    eventos.push({ tipo: 'aumento_reps', de, para: passo(e) })
  } else {
    e.cargaAnterior = e.carga
    // máquina assistida: subir de nível = menos ajuda
    e.carga = cfg.assistido ? cargaAbaixo(e.carga!, cfg.incremento) : proximaCargaAcima(e.carga!, cfg.incremento)
    e.alvo = cfg.faixa.min
    eventos.push({ tipo: 'aumento_carga', de, para: passo(e) })
    if (cfg.assistido && e.carga === 0) e.noTeto = true
  }
  e.confirmacoes = 0
  e.segurando = false
}

function descerDegrau(e: EstadoProgressao, cfg: ConfigProgressao, eventos: EventoGerado[]) {
  const de = passo(e)
  if (e.alvo! > cfg.faixa.min) {
    // falhou com repetição nova: volta para o alvo anterior, mesma carga
    e.alvo = e.alvo! - 1
  } else if (e.cargaAnterior !== null) {
    // falhou com carga nova: volta para a carga anterior com alvo no topo
    e.carga = e.cargaAnterior
    e.cargaAnterior = null
    e.alvo = cfg.faixa.max
  } else {
    // A6: sem carga anterior, desce um incremento e mantém o alvo
    e.carga = cfg.assistido ? proximaCargaAcima(e.carga!, cfg.incremento) : cargaAbaixo(e.carga!, cfg.incremento)
  }
  e.confirmacoes = 0
  e.segurando = true
  eventos.push({ tipo: 'regressao', de, para: passo(e) })
}

function aplicarModoCarga(estado: EstadoProgressao, series: SerieFeita[], cfg: ConfigProgressao): ResultadoProgressao {
  const e: EstadoProgressao = { ...estado }
  const eventos: EventoGerado[] = []
  const comCarga = series.filter((s): s is { carga: number; reps: number } => s.carga !== null)
  if (!comCarga.length || comCarga.length !== series.length) return { estado, classificacao: 'nao_conta', eventos }

  // vale a carga da série "mais fácil": a menor (ou a maior ajuda, no assistido)
  const cargas = comCarga.map((s) => s.carga)
  const usada = cfg.assistido ? Math.max(...cargas) : Math.min(...cargas)
  const maisDificil = (a: number, b: number) => (cfg.assistido ? a < b - 1e-6 : a > b + 1e-6)

  if (e.carga === null) {
    // primeira vez (ou carga a confirmar depois da readaptação / substituto novo)
    eventos.push({ tipo: 'inicio', de: passo(e), para: { carga: usada, alvo: e.alvo } })
    e.carga = usada
    e.confirmacoes = 0
    e.segurando = false
  } else if (maisDificil(usada, e.carga)) {
    // A5: usou carga maior que a sugerida → carga nova com alvo no início da faixa
    const de = passo(e)
    e.cargaAnterior = e.carga
    e.carga = usada
    e.alvo = cfg.faixa.min
    e.confirmacoes = 0
    e.segurando = false
    eventos.push({ tipo: 'carga_nova', de, para: passo(e) })
  } else if (maisDificil(e.carga, usada)) {
    // A5: carga menor que a sugerida → não conta
    return { estado, classificacao: 'nao_conta', eventos }
  }

  const c = classificar(e.alvo!, comCarga.map((s) => s.reps))
  if (c === 'sucesso') {
    e.confirmacoes++
    if (e.confirmacoes >= (e.segurando ? cfg.n + 1 : cfg.n)) subirDegrau(e, cfg, eventos)
  } else if (c === 'falha') {
    descerDegrau(e, cfg, eventos)
  }
  return { estado: e, classificacao: c, eventos }
}

function aplicarModoReps(estado: EstadoProgressao, series: SerieFeita[], cfg: ConfigProgressao): ResultadoProgressao {
  const e: EstadoProgressao = { ...estado }
  const eventos: EventoGerado[] = []
  const reps = series.map((s) => s.reps)
  if (!reps.length) return { estado, classificacao: 'nao_conta', eventos }
  const teto = cfg.teto ?? FAIXA_NORMAL.max
  // §6.13: não conseguiu o mínimo → sugerir versão assistida
  e.sugerirAssistida = Math.max(...reps) < MINIMO_PESO_CORPO

  if (e.alvo === null) {
    // A8: primeiro treino sem alvo; o que fizer (em todas as séries) vira o alvo
    const alvo = Math.max(1, Math.min(Math.min(...reps), teto))
    eventos.push({ tipo: 'inicio', de: passo(e), para: { carga: null, alvo } })
    e.alvo = alvo
    e.confirmacoes = 0
    e.segurando = false
    return { estado: e, classificacao: 'nao_conta', eventos }
  }

  const c = classificar(e.alvo, reps)
  if (c === 'sucesso') {
    e.confirmacoes++
    if (e.confirmacoes >= (e.segurando ? cfg.n + 1 : cfg.n)) {
      if (e.alvo < teto) {
        const de = passo(e)
        e.alvo++
        eventos.push({ tipo: 'aumento_reps', de, para: passo(e) })
      } else {
        // §6.13: chegou ao teto → oferecer carga extra ou variação mais difícil
        e.noTeto = true
      }
      e.confirmacoes = 0
      e.segurando = false
    }
  } else if (c === 'falha') {
    const de = passo(e)
    e.alvo = Math.max(1, e.alvo - 1)
    e.confirmacoes = 0
    e.segurando = true
    e.noTeto = false
    eventos.push({ tipo: 'regressao', de, para: passo(e) })
  }
  return { estado: e, classificacao: c, eventos }
}

/** Aplica um treino (séries planejadas e marcadas) ao estado do exercício. */
export function aplicarTreino(estado: EstadoProgressao, series: SerieFeita[], cfg: ConfigProgressao, data: string): ResultadoProgressao {
  const r = estado.modo === 'reps' ? aplicarModoReps(estado, series, cfg) : aplicarModoCarga(estado, series, cfg)
  if (r.classificacao === 'nao_conta' && !r.eventos.length) return r
  return { ...r, estado: { ...r.estado, ultimaData: data } }
}

/** §6.13: no teto, a pessoa escolhe adicionar carga (entra no ciclo 6.8 em 8 reps). */
export function passarParaCargaExtra(estado: EstadoProgressao): EstadoProgressao {
  return {
    ...estado,
    modo: 'carga',
    carga: null,
    cargaAnterior: 0,
    alvo: FAIXA_NORMAL.min,
    confirmacoes: 0,
    segurando: false,
    noTeto: false,
  }
}
