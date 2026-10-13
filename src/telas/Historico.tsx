import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/banco'
import { navegar } from '../app/rotas'
import { exercicioPorId, NOME_GRUPO } from '../domain/biblioteca'
import { formatarData, formatarDuracao } from '../domain/datas'
import { descreverCarga } from '../domain/progressao/carga'
import { Cartao, Etiqueta, ItemLista, Lista, Tela, Texto } from '../components/ui'

// Histórico básico (§3 tela 5, Fase 1): sessões passadas e tabela de
// evolução por exercício. Gráficos por exercício ficam para a Fase 2 (B2).

type Aba = 'treinos' | 'exercicios'

export function Historico() {
  const [aba, setAba] = useState<Aba>('treinos')
  const sessoes = useLiveQuery(() => db.sessoes.where('status').equals('concluida').reverse().sortBy('inicio'))
  const estados = useLiveQuery(() => db.progressao.toArray())
  const series = useLiveQuery(() => db.series.toArray())

  return (
    <Tela titulo="Histórico">
      <div className="grid grid-cols-2 gap-2" role="tablist">
        {(['treinos', 'exercicios'] as const).map((a) => (
          <button
            key={a}
            type="button"
            role="tab"
            aria-selected={aba === a}
            onClick={() => setAba(a)}
            className={`min-h-11 rounded-xl font-medium ${aba === a ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-white ring-1 ring-slate-300 dark:bg-slate-900 dark:ring-slate-700'}`}
          >
            {a === 'treinos' ? 'Treinos' : 'Exercícios'}
          </button>
        ))}
      </div>

      {aba === 'treinos' &&
        (!sessoes?.length ? (
          <Cartao>
            <Texto>Nenhum treino concluído ainda. Eles aparecem aqui depois de finalizar.</Texto>
          </Cartao>
        ) : (
          <Lista>
            {sessoes.map((s) => {
              const feitas = s.estado.itens.reduce((n, i) => n + i.series.filter((x) => x.feita && (x.tipo === 'trabalho' || x.tipo === 'extra')).length, 0)
              return (
                <ItemLista
                  key={s.id}
                  onClick={() => navegar(`/historico/${s.id}`)}
                  titulo={
                    <span className="flex flex-wrap items-center gap-1">
                      {s.nomeDia}
                      {s.fase === 'readaptacao' && <Etiqueta cor="marca">Readaptação</Etiqueta>}
                      {s.substituicoes.length > 0 && <Etiqueta>Trocas</Etiqueta>}
                      {s.estado.itens.some((i) => i.dor) && <Etiqueta cor="aviso">Dor</Etiqueta>}
                    </span>
                  }
                  subtitulo={`${formatarData(s.inicio)} · ${formatarDuracao(s.duracaoSeg ?? 0)} · ${feitas} séries`}
                />
              )
            })}
          </Lista>
        ))}

      {aba === 'exercicios' &&
        (() => {
          const ids = [...new Set((series ?? []).filter((r) => r.tipo === 'trabalho' || r.tipo === 'extra').map((r) => r.exercicioId))]
          if (!ids.length)
            return (
              <Cartao>
                <Texto>Os exercícios que você registrar aparecem aqui com a evolução de carga e repetições.</Texto>
              </Cartao>
            )
          const ultimaData = (id: string) => (series ?? []).filter((r) => r.exercicioId === id).map((r) => r.data).sort().pop() ?? ''
          return (
            <Lista>
              {ids
                .sort((a, b) => ultimaData(b).localeCompare(ultimaData(a)))
                .map((id) => {
                  const ex = exercicioPorId(id)
                  if (!ex) return null
                  const e = estados?.find((x) => x.exercicioId === id)
                  const atual = e?.alvo ? (e.modo === 'reps' || e.carga === null ? `alvo ${e.alvo} reps` : `${descreverCarga(ex, e.carga)} × ${e.alvo}`) : ''
                  return (
                    <ItemLista
                      key={id}
                      onClick={() => navegar(`/historico/exercicio/${id}`)}
                      titulo={ex.nome}
                      subtitulo={`${NOME_GRUPO[ex.grupo]} · último ${formatarData(ultimaData(id))}${atual ? ` · próximo: ${atual}` : ''}`}
                    />
                  )
                })}
            </Lista>
          )
        })()}
    </Tela>
  )
}
