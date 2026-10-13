// Utilitários de data sem dependências. Datas "de calendário" usam o fuso do
// aparelho e o formato AAAA-MM-DD.

const DIA_MS = 24 * 60 * 60 * 1000

function doisDigitos(n: number) {
  return String(n).padStart(2, '0')
}

/** Data local AAAA-MM-DD de um instante. */
export function dataLocal(instante: Date | string = new Date()): string {
  const d = typeof instante === 'string' ? new Date(instante) : instante
  return `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}-${doisDigitos(d.getDate())}`
}

/** Converte AAAA-MM-DD em um Date ao meio-dia local (evita erros de fuso/horário de verão). */
export function paraDate(data: string): Date {
  const [a, m, d] = data.split('-').map(Number)
  return new Date(a, m - 1, d, 12, 0, 0)
}

/** Diferença em dias de calendário entre duas datas (b - a). */
export function diasEntre(a: string | Date, b: string | Date): number {
  const da = paraDate(typeof a === 'string' && a.length === 10 ? a : dataLocal(a))
  const db = paraDate(typeof b === 'string' && b.length === 10 ? b : dataLocal(b))
  return Math.round((db.getTime() - da.getTime()) / DIA_MS)
}

export function somarDias(data: string, dias: number): string {
  const d = paraDate(data)
  d.setDate(d.getDate() + dias)
  return dataLocal(d)
}

/** Idade em anos completos numa data. */
export function idadeEm(nascimento: string, referencia: string = dataLocal()): number {
  const [an, mn, dn] = nascimento.split('-').map(Number)
  const [ar, mr, dr] = referencia.split('-').map(Number)
  let idade = ar - an
  if (mr < mn || (mr === mn && dr < dn)) idade--
  return idade
}

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/** "13 out 2026" */
export function formatarData(data: string): string {
  const [a, m, d] = data.slice(0, 10).split('-').map(Number)
  return `${d} ${MESES[m - 1]} ${a}`
}

/** "13/10" */
export function formatarDataCurta(data: string): string {
  const [, m, d] = data.slice(0, 10).split('-')
  return `${d}/${m}`
}

/** 75 → "1:15" ; 3725 → "1:02:05" */
export function formatarDuracao(segundos: number): string {
  const s = Math.max(0, Math.round(segundos))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = s % 60
  return h > 0 ? `${h}:${doisDigitos(m)}:${doisDigitos(r)}` : `${m}:${doisDigitos(r)}`
}
