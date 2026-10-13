import { db } from './banco'
import type { AjusteExercicio } from '../domain/tipos'

/** Salva marcações/ajustes de um exercício; remove o registro se voltar tudo ao padrão. */
export async function salvarAjuste(exercicioId: string, mudancas: Partial<Omit<AjusteExercicio, 'exercicioId'>>) {
  await db.transaction('rw', db.ajustesExercicio, async () => {
    const atual = (await db.ajustesExercicio.get(exercicioId)) ?? { exercicioId }
    const novo: AjusteExercicio = { ...atual, ...mudancas }
    for (const k of Object.keys(novo) as (keyof AjusteExercicio)[]) {
      if (k !== 'exercicioId' && (novo[k] === undefined || novo[k] === false)) delete novo[k]
    }
    if (Object.keys(novo).length === 1) await db.ajustesExercicio.delete(exercicioId)
    else await db.ajustesExercicio.put(novo)
  })
}
