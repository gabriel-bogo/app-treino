import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/banco'
import { garantirPlano } from '../db/plano'
import { trocarExercicioNoPlano } from '../db/progressao'
import { exercicioPorId } from '../domain/biblioteca'
import { DialogoTroca } from './treino/DialogoTroca'

/** C5: trocar um exercício direto no plano (vale para os próximos treinos em que ele aparece). */
export function TrocaNoPlano({ alvo, aoFechar }: { alvo: { exercicioId: string; ids: string[] } | null; aoFechar: () => void }) {
  const perfil = useLiveQuery(() => db.perfil.get('perfil'))
  const original = alvo ? exercicioPorId(alvo.exercicioId) : undefined
  if (!alvo || !original || !perfil) return null
  return (
    <DialogoTroca
      noPlano
      original={original}
      idsDoDia={alvo.ids}
      perfil={perfil}
      aoFechar={aoFechar}
      aoEscolher={async (e) => {
        aoFechar()
        await trocarExercicioNoPlano(original.id, e.substitutoId)
        await garantirPlano()
      }}
    />
  )
}
