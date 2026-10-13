import { navegar } from '../app/rotas'
import { exercicioPorId, NOME_GRUPO } from '../domain/biblioteca'
import { formatarDuracao } from '../domain/datas'
import type { ExercicioPlano } from '../domain/tipos'
import { Botao, Cartao, Etiqueta } from './ui'

// Treinos do plano agrupados por músculo (C4, C5), como numa ficha de academia:
//   Treino A · Superior
//     Peito: exercício 1, exercício 2
//     Ombros: exercício 3 …
// Usado na proposta do plano (depois do onboarding) e na aba Plano.

export type ItemVisivel = Pick<ExercicioPlano, 'exercicioId' | 'papel' | 'series' | 'repsMin' | 'repsMax' | 'descansoSeg' | 'alerta'>

export interface TreinoVisivel {
  variante: string
  nome: string
  minutosEstimados: number
  exercicios: ItemVisivel[]
}

export function textoSeries(e: Pick<ItemVisivel, 'series' | 'repsMin' | 'repsMax' | 'exercicioId'>): string {
  const ex = exercicioPorId(e.exercicioId)
  const reps = e.repsMin === e.repsMax ? `${e.repsMin}` : ex?.tipoCarga === 'pesoCorpo' ? `até ${e.repsMax}` : `${e.repsMin}–${e.repsMax}`
  return `${e.series} × ${reps}${ex?.unilateral ? ' por lado' : ''}`
}

/** Seções consecutivas por músculo principal, na ordem do treino (o aquecimento de ombro vem à parte). */
export function secoesPorMusculo(itens: ItemVisivel[]): { titulo: string; itens: ItemVisivel[] }[] {
  const secoes: { chave: string; titulo: string; itens: ItemVisivel[] }[] = []
  for (const i of itens) {
    const ex = exercicioPorId(i.exercicioId)
    if (!ex) continue
    const chave = i.papel === 'aquecimento_ombro' ? 'aquecimento' : ex.grupo
    const ultima = secoes[secoes.length - 1]
    if (ultima?.chave === chave) ultima.itens.push(i)
    else secoes.push({ chave, titulo: chave === 'aquecimento' ? 'Aquecimento de ombro' : NOME_GRUPO[ex.grupo], itens: [i] })
  }
  return secoes
}

/** Treinos sem repetição, na ordem em que aparecem (A/B/A/B → A, B). */
export function treinosUnicos<T extends { variante: string }>(dias: T[]): T[] {
  const vistos = new Set<string>()
  return dias.filter((d) => !vistos.has(d.variante) && vistos.add(d.variante))
}

/** "Treino A · Superior" → "A" */
export function letraDoTreino(nome: string): string {
  return /^Treino ([A-Z])\b/.exec(nome)?.[1] ?? nome
}

/** Ordem dos treinos na semana: "A → B → A → B". */
export function textoSequencia(dias: { nome: string }[]): string {
  return dias.map((d) => letraDoTreino(d.nome)).join(' → ')
}

export function CartaoTreino({
  treino,
  proximo,
  aoTrocar,
}: {
  treino: TreinoVisivel
  proximo?: boolean
  /** mostra o botão "Trocar" em cada exercício */
  aoTrocar?: (exercicioId: string, idsDoTreino: string[]) => void
}) {
  const ids = treino.exercicios.map((e) => e.exercicioId)
  return (
    <Cartao
      titulo={
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-lg">{treino.nome}</span>
          {proximo && <Etiqueta cor="marca">Próximo</Etiqueta>}
          <span className="ml-auto text-sm font-normal text-slate-500 dark:text-slate-400">~{treino.minutosEstimados} min</span>
        </span>
      }
    >
      <div className="flex flex-col gap-3" data-testid="treino-do-plano">
        {secoesPorMusculo(treino.exercicios).map((s, n) => (
          <section key={n}>
            <h3 className="text-sm font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">{s.titulo}</h3>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {s.itens.map((e, k) => {
                const ex = exercicioPorId(e.exercicioId)!
                return (
                  <li key={k} className="flex items-center gap-2">
                    <button type="button" onClick={() => navegar(`/biblioteca/${ex.id}`)} className="flex min-h-12 flex-1 flex-col justify-center py-2 text-left">
                      <span className="flex flex-wrap items-center gap-1 font-medium">
                        {ex.nome}
                        {e.alerta && <Etiqueta cor="aviso">⚠ cuidado</Etiqueta>}
                      </span>
                      <span className="block text-sm text-slate-500 dark:text-slate-400">
                        {textoSeries(e)}
                        {e.papel === 'trabalho' && ` · descanso ${formatarDuracao(e.descansoSeg)}`}
                      </span>
                      {e.alerta && <span className="block text-xs text-amber-700 dark:text-amber-300">{e.alerta}</span>}
                    </button>
                    {aoTrocar && e.papel === 'trabalho' && (
                      <Botao variante="secundario" className="min-h-10 px-3 text-sm" onClick={() => aoTrocar(ex.id, ids)} aria-label={`Trocar ${ex.nome}`}>
                        Trocar
                      </Botao>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </Cartao>
  )
}
