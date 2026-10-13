import { useEffect, useRef } from 'react'
import type { TimerDescanso } from '../../domain/tipos'
import { restanteTimer, SEGUNDOS_AJUSTE_TIMER } from '../../domain/treino/sessao'
import { formatarDuracao } from '../../domain/datas'
import { tocarFimDescanso } from '../../app/som'

// Timer de descanso (§3): começa sozinho ao marcar a série, +15 s / −15 s,
// Pular, e toca um som ao terminar (com o app aberto).
export function PainelDescanso({
  timer,
  agora,
  som,
  aoAjustar,
  aoPular,
}: {
  timer: TimerDescanso
  agora: Date
  som: boolean
  aoAjustar: (delta: number) => void
  aoPular: () => void
}) {
  const restante = restanteTimer(timer, agora)
  const tocou = useRef<string | null>(null)
  useEffect(() => {
    if (restante <= 0 && tocou.current !== timer.inicio) {
      tocou.current = timer.inicio
      // não toca se o descanso já tinha acabado há muito tempo (app reaberto)
      if (som && restante > -5) tocarFimDescanso()
    }
  }, [restante, timer.inicio, som])
  const acabou = restante <= 0
  const total = timer.duracaoSeg + timer.ajusteSeg
  const fracao = total > 0 ? Math.min(1, Math.max(0, restante / total)) : 0
  const botao = 'min-h-12 flex-1 rounded-xl font-semibold active:opacity-80'
  return (
    <div
      className={`pb-seguro fixed inset-x-0 bottom-0 z-30 border-t px-4 pt-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] ${
        acabou ? 'border-emerald-500 bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
      }`}
      role="timer"
      aria-live="polite"
      data-testid="painel-descanso"
    >
      <div className="mx-auto max-w-xl">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium">{acabou ? 'Descanso terminado' : 'Descanso'}</span>
          <span className="text-4xl font-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {acabou ? (restante < 0 ? `+${formatarDuracao(-restante)}` : '0:00') : formatarDuracao(restante)}
          </span>
        </div>
        {!acabou && (
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div className="h-full bg-emerald-600 transition-[width] duration-300 dark:bg-emerald-500" style={{ width: `${fracao * 100}%` }} />
          </div>
        )}
        <div className="mt-2 flex gap-2 pb-1">
          <button type="button" className={`${botao} ${acabou ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`} onClick={() => aoAjustar(-SEGUNDOS_AJUSTE_TIMER)}>
            −15s
          </button>
          <button type="button" className={`${botao} ${acabou ? 'bg-white text-emerald-700 dark:bg-slate-950 dark:text-emerald-400' : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'}`} onClick={aoPular}>
            {acabou ? 'Fechar' : 'Pular'}
          </button>
          <button type="button" className={`${botao} ${acabou ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`} onClick={() => aoAjustar(SEGUNDOS_AJUSTE_TIMER)}>
            +15s
          </button>
        </div>
      </div>
    </div>
  )
}
