import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/banco'
import { definirMusculosDoTreino } from '../db/perfil'
import { exercicioPorId } from '../domain/biblioteca'
import type { DiaPlano, ExercicioPlano, Grupo } from '../domain/tipos'
import { DialogoMusculos } from './DialogoMusculos'
import { letraDoTreino, treinosUnicos } from './PlanoAgrupado'

/** C11: músculos atuais de cada treino (o abdômen entra se o treino tiver exercício de abdômen). */
export function musculosAtuais(dias: DiaPlano[], exercicios: ExercicioPlano[]): Grupo[][] {
  return treinosUnicos(dias).map((d) => {
    const temCore = exercicios.some((e) => e.diaId === d.id && exercicioPorId(e.exercicioId)?.grupo === 'core')
    const grupos = d.grupos ?? []
    return temCore && !grupos.includes('core') ? [...grupos, 'core'] : grupos
  })
}

/** Estado + diálogo para "Mudar músculos deste treino". */
export function useMusculosNoPlano(dias: DiaPlano[] | undefined, exercicios: ExercicioPlano[] | undefined) {
  const [indice, setIndice] = useState<number | null>(null)
  const perfil = useLiveQuery(() => db.perfil.get('perfil'))
  const unicos = dias ? treinosUnicos(dias) : []
  const atuais = dias && exercicios ? musculosAtuais(dias, exercicios) : []
  const dialogo =
    indice !== null && unicos[indice] ? (
      <DialogoMusculos
        treino={`Treino ${letraDoTreino(unicos[indice].nome)}`}
        atuais={atuais[indice]}
        personalizado={!!perfil?.musculosPorTreino}
        aoFechar={() => setIndice(null)}
        aoSalvar={async (grupos) => {
          setIndice(null)
          await definirMusculosDoTreino(indice, grupos, atuais)
        }}
        aoRestaurar={async () => {
          setIndice(null)
          await definirMusculosDoTreino(indice, null, atuais)
        }}
      />
    ) : null
  return { abrir: (variante: string) => setIndice(unicos.findIndex((d) => d.variante === variante)), dialogo }
}
