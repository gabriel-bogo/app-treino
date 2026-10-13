import { useEffect, useState } from 'react'
import type { SerieTreino } from '../../domain/tipos'
import { formatarKg } from '../../domain/progressao/carga'

// Uma linha de série (§3): nº, carga, reps e check. Carga e reps já vêm
// preenchidas; se fez igual, basta tocar no check.

function Passo({ valor, aoMudar, passo, rotulo, vazio, decimal }: { valor: number | null; aoMudar: (v: number | null) => void; passo: number; rotulo: string; vazio: string; decimal?: boolean }) {
  const [texto, setTexto] = useState(valor === null ? '' : decimal ? formatarKg(valor) : String(valor))
  useEffect(() => setTexto(valor === null ? '' : decimal ? formatarKg(valor) : String(valor)), [valor, decimal])
  const confirmar = () => {
    const t = texto.replace(',', '.').trim()
    if (!t) return aoMudar(null)
    const v = Number(t)
    if (Number.isFinite(v) && v >= 0) aoMudar(Math.round(v * 100) / 100)
    else setTexto(valor === null ? '' : String(valor))
  }
  const botao =
    'flex h-11 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xl font-bold active:bg-slate-200 dark:bg-slate-800 dark:active:bg-slate-700'
  return (
    <div className="flex min-w-0 flex-1 items-center gap-1">
      <button type="button" className={botao} aria-label={`Diminuir ${rotulo}`} onClick={() => aoMudar(Math.max(0, Math.round(((valor ?? 0) - passo) * 100) / 100))}>
        −
      </button>
      <input
        type="text"
        inputMode={decimal ? 'decimal' : 'numeric'}
        value={texto}
        placeholder={vazio}
        aria-label={rotulo}
        onChange={(e) => setTexto(e.target.value)}
        onBlur={confirmar}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        className="h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-white text-center text-lg font-semibold placeholder:text-sm placeholder:font-normal dark:border-slate-700 dark:bg-slate-900"
      />
      <button type="button" className={botao} aria-label={`Aumentar ${rotulo}`} onClick={() => aoMudar(Math.round(((valor ?? 0) + passo) * 100) / 100)}>
        +
      </button>
    </div>
  )
}

export function LinhaSerie({
  numero,
  serie,
  mostrarCarga,
  incremento,
  aoMudar,
  aoMarcar,
}: {
  numero: string
  serie: SerieTreino
  mostrarCarga: boolean
  incremento: number
  aoMudar: (v: { carga?: number | null; reps?: number | null }) => void
  aoMarcar: () => void
}) {
  const aquecimento = serie.tipo === 'aquecimento' || serie.tipo === 'aproximacao'
  return (
    <div
      className={`flex items-center gap-1.5 rounded-xl px-1.5 py-1.5 ${
        serie.feita ? 'bg-emerald-50 dark:bg-emerald-950/40' : aquecimento ? 'bg-sky-50 dark:bg-sky-950/30' : ''
      }`}
      data-testid="linha-serie"
    >
      <span className={`w-7 shrink-0 text-center text-sm font-bold ${aquecimento ? 'text-sky-700 dark:text-sky-300' : 'text-slate-500 dark:text-slate-400'}`}>{numero}</span>
      {mostrarCarga && <Passo valor={serie.carga} aoMudar={(carga) => aoMudar({ carga })} passo={incremento} rotulo={`carga da série ${numero}`} vazio="kg" decimal />}
      <Passo valor={serie.reps} aoMudar={(reps) => aoMudar({ reps })} passo={1} rotulo={`repetições da série ${numero}`} vazio="reps" />
      <button
        type="button"
        onClick={aoMarcar}
        aria-label={serie.feita ? `Desmarcar série ${numero}` : `Marcar série ${numero} como feita`}
        aria-pressed={serie.feita}
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 text-2xl font-bold ${
          serie.feita
            ? 'border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500 dark:text-slate-950'
            : 'border-slate-300 text-slate-300 active:bg-slate-100 dark:border-slate-600 dark:text-slate-600 dark:active:bg-slate-800'
        }`}
      >
        ✓
      </button>
    </div>
  )
}
