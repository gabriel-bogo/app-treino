// Junta perfil + exercício + estado salvo para dizer o que o app sugere no
// próximo treino daquele exercício (carga pré-preenchida e alvo de reps).

import type { AjusteExercicio, EstadoProgressao, Exercicio, Fase, Perfil } from '../tipos'
import { arredondarParaBaixo, arredondarParaCima, incrementoEfetivo, modoConservador } from './carga'
import { estadoInicial, faixaDaFase, prepararParaFase, type ConfigProgressao } from './ciclo'

export function configDoExercicio(ex: Exercicio, perfil: Pick<Perfil, 'limitacoes' | 'nConfirmacoes'>, ajuste: AjusteExercicio | undefined, fase: Fase): ConfigProgressao {
  const conservador = modoConservador(ex, perfil.limitacoes)
  return {
    n: perfil.nConfirmacoes + (conservador ? 1 : 0),
    incremento: incrementoEfetivo(ex, ajuste, conservador),
    faixa: faixaDaFase(fase),
    assistido: ex.assistido,
    teto: ex.tetoReps,
  }
}

export interface Sugestao {
  estado: EstadoProgressao
  /** carga pré-preenchida (múltiplo do incremento) ou null = "comece leve" */
  carga: number | null
  /** alvo de reps; null = primeiro treino de peso do corpo (faça o máximo com 1-3 sobrando) */
  alvo: number | null
  comeceLeve: boolean
  /** carga usada na readaptação (referência ao entrar no ciclo 8-12) */
  cargaReferencia: number | null
}

export function sugestaoParaTreino(estado: EstadoProgressao | undefined, ex: Exercicio, cfg: ConfigProgressao, fase: Fase): Sugestao {
  const e = estado ? prepararParaFase(estado, fase) : estadoInicial(ex.id, fase, ex.tipoCarga === 'pesoCorpo')
  let carga: number | null = null
  if (e.modo === 'carga' && e.carga !== null) {
    // §6.14: nunca sugerir carga impossível de montar com o incremento configurado
    carga = cfg.assistido ? arredondarParaCima(e.carga, cfg.incremento) : arredondarParaBaixo(e.carga, cfg.incremento)
  }
  return {
    estado: e,
    carga,
    alvo: e.alvo,
    comeceLeve: e.modo === 'carga' && e.carga === null,
    cargaReferencia: e.cargaReferencia ?? null,
  }
}
