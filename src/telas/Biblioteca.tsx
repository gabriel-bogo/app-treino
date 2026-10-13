import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/banco'
import { BIBLIOTECA, GRUPOS, NOME_EQUIPAMENTO, NOME_GRUPO, mapaAjustes } from '../domain/biblioteca'
import type { Grupo } from '../domain/tipos'
import { navegar } from '../app/rotas'
import { Etiqueta, ItemLista, Lista, Tela, Texto } from '../components/ui'

function normalizar(t: string) {
  return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export function Biblioteca() {
  const ajustes = mapaAjustes(useLiveQuery(() => db.ajustesExercicio.toArray()))
  const [grupo, setGrupo] = useState<Grupo | 'todos'>('todos')
  const [busca, setBusca] = useState('')

  const lista = useMemo(() => {
    const termo = normalizar(busca.trim())
    return BIBLIOTECA.filter((e) => (grupo === 'todos' || e.grupo === grupo) && (!termo || normalizar(e.nome).includes(termo)))
  }, [grupo, busca])

  const indisponiveis = [...ajustes.values()].filter((a) => a.indisponivel).length

  return (
    <Tela titulo="Biblioteca" voltarPara="/mais">
      <input
        type="search"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar exercício"
        className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base dark:border-slate-700 dark:bg-slate-900"
        aria-label="Buscar exercício"
      />
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label="Filtrar por grupo muscular">
        {(['todos', ...GRUPOS] as const).map((g) => (
          <button
            key={g}
            type="button"
            role="tab"
            aria-selected={grupo === g}
            onClick={() => setGrupo(g)}
            className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-medium ${
              grupo === g
                ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950'
                : 'bg-white text-slate-700 ring-1 ring-slate-300 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700'
            }`}
          >
            {g === 'todos' ? 'Todos' : NOME_GRUPO[g]}
          </button>
        ))}
      </div>
      {indisponiveis > 0 && <Texto fraco>{indisponiveis} marcado(s) como indisponível na sua academia.</Texto>}
      {lista.length === 0 ? (
        <Texto fraco>Nenhum exercício encontrado.</Texto>
      ) : (
        <Lista>
          {lista.map((e) => {
            const aj = ajustes.get(e.id)
            return (
              <ItemLista
                key={e.id}
                onClick={() => navegar(`/biblioteca/${e.id}`)}
                titulo={e.nome}
                subtitulo={
                  <span className="flex flex-wrap items-center gap-1">
                    {NOME_GRUPO[e.grupo]} · {NOME_EQUIPAMENTO[e.equipamento]}
                    {aj?.indisponivel && <Etiqueta cor="perigo">Indisponível</Etiqueta>}
                    {aj?.evitar && <Etiqueta cor="aviso">Evitar</Etiqueta>}
                    {e.soAquecimento && <Etiqueta>Aquecimento</Etiqueta>}
                  </span>
                }
              />
            )
          })}
        </Lista>
      )}
    </Tela>
  )
}
