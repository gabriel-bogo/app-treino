import { navegar } from '../app/rotas'
import { exercicioPorId } from '../domain/biblioteca'
import { formatarDuracao } from '../domain/datas'
import type { ExercicioPlano } from '../domain/tipos'
import { Etiqueta } from './ui'

export function textoSeries(e: Pick<ExercicioPlano, 'series' | 'repsMin' | 'repsMax' | 'exercicioId'>): string {
  const ex = exercicioPorId(e.exercicioId)
  const reps = e.repsMin === e.repsMax ? `${e.repsMin}` : ex?.tipoCarga === 'pesoCorpo' ? `até ${e.repsMax}` : `${e.repsMin}–${e.repsMax}`
  return `${e.series} × ${reps}${ex?.unilateral ? ' por lado' : ''}`
}

export function ListaExerciciosDia({ exercicios }: { exercicios: ExercicioPlano[] }) {
  return (
    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
      {[...exercicios]
        .sort((a, b) => a.ordem - b.ordem)
        .map((e) => {
          const ex = exercicioPorId(e.exercicioId)
          if (!ex) return null
          return (
            <li key={e.id}>
              <button type="button" onClick={() => navegar(`/biblioteca/${ex.id}`)} className="flex min-h-12 w-full items-center gap-2 py-2 text-left">
                <span className="flex-1">
                  <span className="flex flex-wrap items-center gap-1 font-medium">
                    {ex.nome}
                    {e.papel === 'aquecimento_ombro' && <Etiqueta cor="marca">Aquecimento</Etiqueta>}
                    {e.alerta && <Etiqueta cor="aviso">⚠ cuidado</Etiqueta>}
                  </span>
                  <span className="block text-sm text-slate-500 dark:text-slate-400">
                    {textoSeries(e)}
                    {e.papel === 'trabalho' && ` · descanso ${formatarDuracao(e.descansoSeg)}`}
                  </span>
                  {e.alerta && <span className="block text-xs text-amber-700 dark:text-amber-300">{e.alerta}</span>}
                </span>
                <span className="text-slate-400">›</span>
              </button>
            </li>
          )
        })}
    </ul>
  )
}
