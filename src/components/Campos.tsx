import type { ReactNode } from 'react'

// Campos de formulário grandes, pensados para o celular.

export function Rotulo({ children, ajuda }: { children: ReactNode; ajuda?: ReactNode }) {
  return (
    <span className="mb-2 block">
      <span className="block font-semibold">{children}</span>
      {ajuda && <span className="block text-sm text-slate-500 dark:text-slate-400">{ajuda}</span>}
    </span>
  )
}

export function Opcoes<T extends string | number>({
  rotulo,
  ajuda,
  valor,
  opcoes,
  aoMudar,
  colunas = 2,
}: {
  rotulo: string
  ajuda?: ReactNode
  valor: T | undefined
  opcoes: { valor: T; rotulo: string; descricao?: string }[]
  aoMudar: (v: T) => void
  colunas?: 2 | 3 | 5
}) {
  const grade = { 2: 'grid-cols-2', 3: 'grid-cols-3', 5: 'grid-cols-5' }[colunas]
  return (
    <fieldset>
      <legend className="contents">
        <Rotulo ajuda={ajuda}>{rotulo}</Rotulo>
      </legend>
      <div className={`grid gap-2 ${grade}`} role="radiogroup" aria-label={rotulo}>
        {opcoes.map((o) => {
          const sel = o.valor === valor
          return (
            <button
              key={String(o.valor)}
              type="button"
              role="radio"
              aria-checked={sel}
              onClick={() => aoMudar(o.valor)}
              className={`min-h-12 rounded-xl border px-3 py-2 ${o.descricao ? 'text-left' : 'text-center'} ${
                sel
                  ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-600 dark:border-emerald-500 dark:bg-emerald-950/50 dark:ring-emerald-500'
                  : 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900'
              }`}
            >
              <span className="block font-medium">{o.rotulo}</span>
              {o.descricao && <span className="block text-xs text-slate-500 dark:text-slate-400">{o.descricao}</span>}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

export function Multipla<T extends string>({
  rotulo,
  ajuda,
  valores,
  opcoes,
  aoMudar,
  rotuloNenhuma,
  recomendados = [],
}: {
  rotulo: string
  ajuda?: ReactNode
  valores: T[]
  opcoes: { valor: T; rotulo: string; descricao?: string }[]
  aoMudar: (v: T[]) => void
  rotuloNenhuma?: string
  /** opções com o rótulo em negrito e a etiqueta "recomendado" */
  recomendados?: readonly T[]
}) {
  const alternar = (v: T) => aoMudar(valores.includes(v) ? valores.filter((x) => x !== v) : [...valores, v])
  const comDescricao = opcoes.some((o) => o.descricao)
  const estilo = (sel: boolean) =>
    `min-h-12 rounded-xl border px-3 py-2 ${comDescricao ? 'text-left' : ''} ${
      sel
        ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-600 dark:border-emerald-500 dark:bg-emerald-950/50 dark:ring-emerald-500'
        : 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900'
    }`
  return (
    <fieldset>
      <legend className="contents">
        <Rotulo ajuda={ajuda}>{rotulo}</Rotulo>
      </legend>
      <div className="grid grid-cols-2 gap-2">
        {rotuloNenhuma && (
          <button type="button" aria-pressed={valores.length === 0} onClick={() => aoMudar([])} className={`${estilo(valores.length === 0)} font-medium`}>
            {rotuloNenhuma}
          </button>
        )}
        {opcoes.map((o) => {
          const recomendado = recomendados.includes(o.valor)
          return (
            <button key={o.valor} type="button" aria-pressed={valores.includes(o.valor)} onClick={() => alternar(o.valor)} className={estilo(valores.includes(o.valor))}>
              <span className={`block ${recomendado ? 'font-extrabold' : 'font-medium'}`}>{o.rotulo}</span>
              {o.descricao && <span className="block text-xs text-slate-500 dark:text-slate-400">{o.descricao}</span>}
              {recomendado && <span className="mt-1 block text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Recomendado</span>}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

/** Barra deslizante com o valor escolhido em destaque (ex: duração do treino). */
export function Deslizante({
  rotulo,
  ajuda,
  valor,
  min,
  max,
  passo,
  formatar,
  aoMudar,
}: {
  rotulo: string
  ajuda?: ReactNode
  valor: number
  min: number
  max: number
  passo: number
  formatar: (v: number) => string
  aoMudar: (v: number) => void
}) {
  return (
    <label className="block">
      <Rotulo ajuda={ajuda}>{rotulo}</Rotulo>
      <span className="mb-1 block text-center text-3xl font-bold" aria-hidden="true" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {formatar(valor)}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={passo}
        value={valor}
        aria-valuetext={formatar(valor)}
        onChange={(e) => aoMudar(Number(e.target.value))}
        className="h-12 w-full cursor-pointer accent-emerald-600 dark:accent-emerald-500"
      />
      <span className="flex justify-between text-sm text-slate-500 dark:text-slate-400" aria-hidden="true">
        <span>{formatar(min)}</span>
        <span>{formatar(max)}</span>
      </span>
    </label>
  )
}

export function CampoTexto({
  rotulo,
  ajuda,
  erro,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { rotulo: string; ajuda?: ReactNode; erro?: string }) {
  return (
    <label className="block">
      <Rotulo ajuda={ajuda}>{rotulo}</Rotulo>
      <input
        {...props}
        className={`min-h-12 w-full rounded-xl border bg-white px-4 text-lg dark:bg-slate-900 ${
          erro ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
        }`}
      />
      {erro && <span className="mt-1 block text-sm text-red-600 dark:text-red-400">{erro}</span>}
    </label>
  )
}
