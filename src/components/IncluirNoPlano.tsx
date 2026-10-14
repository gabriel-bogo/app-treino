import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/banco'
import { incluirNoPlano } from '../db/plano'
import { BIBLIOTECA, mapaAjustes, NOME_EQUIPAMENTO, NOME_GRUPO, exercicioPermitido } from '../domain/biblioteca'
import { MIN_POR_SERIE } from '../domain/motor/regras'
import type { Grupo } from '../domain/tipos'
import { Botao, Etiqueta } from './ui'
import { Dialogo } from './Dialogo'
import { ComoFazer } from './ComoFazer'

// C14: "+ incluir exercício": todos os exercícios do músculo, com o tempo
// aproximado (3 séries, pela regra da §6.4), para adicionar ao treino.

const SERIES = 3

interface Alvo {
  variante: string
  treino: string
  grupo: Grupo
  ids: string[]
  minutos: number
}

export function useIncluirNoPlano() {
  const [alvo, setAlvo] = useState<Alvo | null>(null)
  const [aberto, setAberto] = useState<string | null>(null)
  const perfil = useLiveQuery(() => db.perfil.get('perfil'))
  const ajustes = mapaAjustes(useLiveQuery(() => db.ajustesExercicio.toArray()))

  const lista =
    alvo && perfil
      ? BIBLIOTECA.filter((e) => e.grupo === alvo.grupo && !e.soAquecimento && !alvo.ids.includes(e.id) && exercicioPermitido(e, perfil.limitacoes, ajustes)).sort(
          (a, b) => a.prioridade - b.prioridade || a.nome.localeCompare(b.nome),
        )
      : []

  const dialogo =
    alvo && perfil ? (
      <Dialogo
        aberto
        titulo={`Incluir exercício de ${NOME_GRUPO[alvo.grupo].toLowerCase()}`}
        aoFechar={() => setAlvo(null)}
        acoes={
          <Botao variante="secundario" onClick={() => setAlvo(null)}>
            Cancelar
          </Botao>
        }
      >
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {alvo.treino} hoje tem ~{alvo.minutos} min; seu tempo é de {perfil.duracaoMin} min.
        </p>
        {lista.length === 0 ? (
          <p>Nenhum outro exercício disponível para esse músculo.</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800" data-testid="lista-incluir">
            {lista.map((e) => {
              const min = SERIES * MIN_POR_SERIE[e.tipo]
              const passa = alvo.minutos + min > perfil.duracaoMin
              return (
                <li key={e.id} className="py-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <p className="font-medium">{e.nome}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {SERIES} séries · ~{min} min
                        {passa && <span className="text-amber-700 dark:text-amber-300"> · passa do seu tempo</span>}
                      </p>
                      <Etiqueta>{NOME_EQUIPAMENTO[e.equipamento]}</Etiqueta>
                    </div>
                    <Botao variante="fantasma" className="min-h-10 px-2 text-sm" onClick={() => setAberto(aberto === e.id ? null : e.id)}>
                      Como fazer
                    </Botao>
                    <Botao
                      className="min-h-10 px-3 text-sm"
                      aria-label={`Incluir ${e.nome}`}
                      onClick={async () => {
                        const v = alvo.variante
                        setAlvo(null)
                        await incluirNoPlano(v, e.id)
                      }}
                    >
                      Incluir
                    </Botao>
                  </div>
                  {aberto === e.id && (
                    <div className="mt-2">
                      <ComoFazer ex={e} />
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </Dialogo>
    ) : null

  return { abrir: (a: Alvo) => setAlvo(a), dialogo }
}
