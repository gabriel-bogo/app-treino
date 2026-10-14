// Utilitários de data sem dependências. C16: o app trabalha sempre no horário
// de Brasília (GMT-3, America/Sao_Paulo), não no fuso do aparelho. Datas "de
// calendário" usam o formato AAAA-MM-DD.

export const FUSO = 'America/Sao_Paulo'
const formatoData = new Intl.DateTimeFormat('en-CA', { timeZone: FUSO, year: 'numeric', month: '2-digit', day: '2-digit' })
const formatoHora = new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, hour: '2-digit', minute: '2-digit', hour12: false })

const DIA_MS = 24 * 60 * 60 * 1000

function doisDigitos(n: number) {
  return String(n).padStart(2, '0')
}

/** Data AAAA-MM-DD de um instante, no horário de Brasília. */
export function dataLocal(instante: Date | string = new Date()): string {
  const d = typeof instante === 'string' ? new Date(instante) : instante
  return formatoData.format(d)
}

/** "21:30" de um instante, no horário de Brasília. */
export function formatarHora(instante: Date | string): string {
  return formatoHora.format(typeof instante === 'string' ? new Date(instante) : instante)
}

/** Converte AAAA-MM-DD em um Date ao meio-dia de Brasília (15:00 UTC). */
export function paraDate(data: string): Date {
  const [a, m, d] = data.split('-').map(Number)
  return new Date(Date.UTC(a, m - 1, d, 15, 0, 0))
}

/** Diferença em dias de calendário entre duas datas (b - a). */
export function diasEntre(a: string | Date, b: string | Date): number {
  const da = paraDate(typeof a === 'string' && a.length === 10 ? a : dataLocal(a))
  const db = paraDate(typeof b === 'string' && b.length === 10 ? b : dataLocal(b))
  return Math.round((db.getTime() - da.getTime()) / DIA_MS)
}

export function somarDias(data: string, dias: number): string {
  const d = paraDate(data)
  d.setUTCDate(d.getUTCDate() + dias)
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
  // data com horário (ISO): converte para o dia em Brasília antes
  const [a, m, d] = (data.length > 10 ? dataLocal(data) : data).split('-').map(Number)
  return `${d} ${MESES[m - 1]} ${a}`
}

/** "13/10" */
export function formatarDataCurta(data: string): string {
  const [, m, d] = (data.length > 10 ? dataLocal(data) : data).split('-')
  return `${d}/${m}`
}

/** Duração de treino por extenso: 125 → "2 min"; 3900 → "1 h 05 min" */
export function formatarDuracaoTreino(segundos: number): string {
  const min = Math.max(0, Math.round(segundos / 60))
  const h = Math.floor(min / 60)
  return h ? `${h} h ${doisDigitos(min % 60)} min` : `${min} min`
}

/** 75 → "1:15" ; 3725 → "1:02:05" */
export function formatarDuracao(segundos: number): string {
  const s = Math.max(0, Math.round(segundos))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = s % 60
  return h > 0 ? `${h}:${doisDigitos(m)}:${doisDigitos(r)}` : `${m}:${doisDigitos(r)}`
}

/** Máscara DD/MM/AAAA enquanto a pessoa digita (só números; barras automáticas). */
export function mascaraData(texto: string): string {
  const d = texto.replace(/\D/g, '').slice(0, 8)
  if (d.length <= 2) return d
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`
}

/** "08/07/1987" → "1987-07-08"; incompleta ou inexistente (ex: 31/02) → null. */
export function dataDigitadaParaIso(texto: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto)
  if (!m) return null
  const [dia, mes, ano] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const d = new Date(Date.UTC(ano, mes - 1, dia))
  if (d.getUTCFullYear() !== ano || d.getUTCMonth() !== mes - 1 || d.getUTCDate() !== dia) return null
  return `${m[3]}-${m[2]}-${m[1]}`
}

/** "1987-07-08" → "08/07/1987" */
export function isoParaDataDigitada(iso: string | undefined): string {
  const m = iso ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso) : null
  return m ? `${m[3]}/${m[2]}/${m[1]}` : ''
}
