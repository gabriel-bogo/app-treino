import { useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/banco'
import { garantirPlano } from '../db/plano'

/** Plano ativo (garante que está em dia com o perfil ao abrir a tela). */
export function usePlano() {
  useEffect(() => {
    void garantirPlano()
  }, [])
  return useLiveQuery(async () => {
    const plano = await db.plano.get('atual')
    const dias = await db.diasPlano.orderBy('ordem').toArray()
    const exercicios = await db.exerciciosPlano.toArray()
    return { plano, dias, exercicios }
  })
}
