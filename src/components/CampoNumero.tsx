import { useEffect, useState } from 'react'

// Campo numérico com botões − / + grandes (uso com uma mão).
export function CampoNumero({
  rotulo,
  valor,
  passo,
  minimo = 0,
  maximo,
  aoMudar,
  ajuda,
  casas = 1,
}: {
  rotulo: string
  valor: number
  passo: number
  minimo?: number
  maximo?: number
  aoMudar: (v: number) => void
  ajuda?: string
  casas?: number
}) {
  const [texto, setTexto] = useState(String(valor))
  useEffect(() => setTexto(String(valor)), [valor])

  const limitar = (v: number) => {
    let r = Math.max(minimo, v)
    if (maximo !== undefined) r = Math.min(maximo, r)
    return Number(r.toFixed(casas))
  }
  const confirmar = () => {
    const v = Number(texto.replace(',', '.'))
    if (Number.isFinite(v) && v >= minimo) aoMudar(limitar(v))
    else setTexto(String(valor))
  }
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{rotulo}</span>
      <span className="flex items-center gap-2">
        <button
          type="button"
          className="h-12 w-12 shrink-0 rounded-xl border border-slate-300 text-xl font-bold active:bg-slate-100 dark:border-slate-700 dark:active:bg-slate-800"
          onClick={() => aoMudar(limitar(valor - passo))}
          aria-label={`Diminuir ${rotulo}`}
        >
          −
        </button>
        <input
          type="text"
          inputMode="decimal"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onBlur={confirmar}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          className="h-12 w-full min-w-0 rounded-xl border border-slate-300 bg-white text-center text-lg font-semibold dark:border-slate-700 dark:bg-slate-900"
        />
        <button
          type="button"
          className="h-12 w-12 shrink-0 rounded-xl border border-slate-300 text-xl font-bold active:bg-slate-100 dark:border-slate-700 dark:active:bg-slate-800"
          onClick={() => aoMudar(limitar(valor + passo))}
          aria-label={`Aumentar ${rotulo}`}
        >
          +
        </button>
      </span>
      {ajuda && <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{ajuda}</span>}
    </label>
  )
}
