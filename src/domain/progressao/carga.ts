// Registro de carga e incremento (§6.14). Garante que nenhuma carga sugerida
// seja impossível de montar: toda sugestão é múltiplo do incremento
// configurado para o exercício.

import type { AjusteExercicio, Exercicio, Limitacao } from '../tipos'
import { contraindicacaoPara, pesoBarra } from '../biblioteca'

const EPS = 1e-6

function limpar(v: number): number {
  return Math.round(v * 100) / 100
}

/** Maior múltiplo do incremento que não passa de `valor`. */
export function arredondarParaBaixo(valor: number, incremento: number): number {
  if (valor <= 0) return 0
  return limpar(Math.floor(valor / incremento + EPS) * incremento)
}

/** Menor múltiplo do incremento que não fica abaixo de `valor`. */
export function arredondarParaCima(valor: number, incremento: number): number {
  if (valor <= 0) return 0
  return limpar(Math.ceil(valor / incremento - EPS) * incremento)
}

/** Menor múltiplo do incremento estritamente acima de `carga` (subir um degrau de carga). */
export function proximaCargaAcima(carga: number, incremento: number): number {
  return limpar((Math.floor(carga / incremento + EPS) + 1) * incremento)
}

/** Maior múltiplo do incremento estritamente abaixo de `carga` (nunca negativo). */
export function cargaAbaixo(carga: number, incremento: number): number {
  return Math.max(0, limpar((Math.ceil(carga / incremento - EPS) - 1) * incremento))
}

export function ehMultiplo(valor: number, incremento: number): boolean {
  const q = valor / incremento
  return Math.abs(q - Math.round(q)) < 1e-6
}

/**
 * Exercício em "modo conservador" (§6.7):
 * - limitação de ombro + exercício de empurrar (horizontal ou vertical)
 * - contraindicação leve para alguma limitação do perfil (A10)
 * Efeito: menor incremento e N+1 treinos para confirmar cada degrau.
 */
export function modoConservador(ex: Exercicio, limitacoes: Limitacao[]): boolean {
  const empurrar = ex.padrao === 'empurrar_horizontal' || ex.padrao === 'empurrar_vertical'
  return (limitacoes.includes('ombro') && empurrar) || contraindicacaoPara(ex, limitacoes) === 'leve'
}

/**
 * Incremento usado na progressão. O valor ajustado pelo usuário sempre vale
 * (ele conhece a academia). Sem ajuste, o modo conservador usa a metade do
 * padrão (A9).
 */
export function incrementoEfetivo(ex: Exercicio, ajuste: AjusteExercicio | undefined, conservador: boolean): number {
  if (ajuste?.incrementoCarga) return ajuste.incrementoCarga
  return conservador ? limpar(ex.incrementoCarga / 2) : ex.incrementoCarga
}

/** Carga total levantada (para porLado soma a barra; demais iguais ao campo). */
export function cargaTotal(ex: Exercicio, carga: number, ajuste?: AjusteExercicio): number {
  return ex.tipoCarga === 'porLado' ? limpar(pesoBarra(ex, ajuste) + 2 * carga) : carga
}

export function formatarKg(v: number): string {
  return (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0$/, '')).replace('.', ',')
}

/** Texto curto da carga, ex: "15 kg por lado (total 50 kg)". */
export function descreverCarga(ex: Exercicio, carga: number | null, ajuste?: AjusteExercicio): string {
  if (carga === null) return 'sem carga definida'
  switch (ex.tipoCarga) {
    case 'porLado':
      return `${formatarKg(carga)} kg por lado (total ${formatarKg(cargaTotal(ex, carga, ajuste))} kg)`
    case 'porHalter':
      return `${formatarKg(carga)} kg por halter`
    case 'pesoCorpo':
      return carga > 0 ? `+${formatarKg(carga)} kg extra` : 'peso do corpo'
    default:
      return ex.assistido ? `${formatarKg(carga)} kg de ajuda` : `${formatarKg(carga)} kg`
  }
}
