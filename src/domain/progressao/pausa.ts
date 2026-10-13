// Retorno após pausa (§6.12):
// - 10 a 20 dias sem treinar: cargas −10% no primeiro treino de volta, alvo mantido
// - mais de 20 dias: cargas −20% e alvo de 8 reps (início da faixa)
// - mais de 60 dias: perguntar se quer refazer a readaptação
// Depois disso o ciclo 6.8 segue normal a partir da carga reduzida.
// Cargas reduzidas são arredondadas para baixo no incremento (B7).
// Exercícios só com peso do corpo não têm carga para reduzir e ficam iguais.

import type { AjustePausa, EstadoProgressao } from '../tipos'
import { arredondarParaBaixo, formatarKg } from './carga'

export interface RegraPausa extends AjustePausa {
  perguntarReadaptacao: boolean
}

export function regraDePausa(diasSemTreinar: number): RegraPausa | null {
  if (diasSemTreinar < 10) return null
  if (diasSemTreinar <= 20) {
    return {
      dias: diasSemTreinar,
      fator: 0.9,
      alvoOito: false,
      perguntarReadaptacao: false,
      texto: `Você ficou ${diasSemTreinar} dias sem treinar. Para voltar com segurança, as cargas de hoje estão 10% menores. As repetições continuam as mesmas.`,
    }
  }
  return {
    dias: diasSemTreinar,
    fator: 0.8,
    alvoOito: true,
    perguntarReadaptacao: diasSemTreinar > 60,
    texto: `Você ficou ${diasSemTreinar} dias sem treinar. Para voltar com segurança, as cargas de hoje estão 20% menores e o alvo volta para o início da faixa.`,
  }
}

export function aplicarPausa(estado: EstadoProgressao, regra: AjustePausa, incremento: number, faixaMin: number, assistido = false): EstadoProgressao {
  if (estado.modo !== 'carga' || estado.carga === null || assistido) return estado
  return {
    ...estado,
    carga: arredondarParaBaixo(estado.carga * regra.fator, incremento),
    cargaAnterior: null,
    alvo: regra.alvoOito ? faixaMin : estado.alvo,
    confirmacoes: 0,
    segurando: false,
  }
}

export function textoReducao(antes: number, depois: number): string {
  return `${formatarKg(antes)} → ${formatarKg(depois)} kg`
}
