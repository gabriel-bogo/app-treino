import { db } from './banco'
import type { RegistroCorpo } from '../domain/tipos'

/** Um registro por dia; registrar de novo no mesmo dia substitui (§10). */
export async function salvarRegistroCorpo(data: string, valores: Omit<RegistroCorpo, 'data'>) {
  await db.transaction('rw', db.registrosCorpo, async () => {
    const atual = await db.registrosCorpo.get(data)
    const novo: RegistroCorpo = { ...atual, data }
    if (valores.pesoKg !== undefined) novo.pesoKg = Math.round(valores.pesoKg * 10) / 10
    if (valores.cinturaCm !== undefined) novo.cinturaCm = Math.round(valores.cinturaCm * 10) / 10
    if (valores.observacao !== undefined) novo.observacao = valores.observacao.trim() || undefined
    await db.registrosCorpo.put(novo)
  })
}

export async function apagarRegistroCorpo(data: string) {
  await db.registrosCorpo.delete(data)
}
