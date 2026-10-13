// Chave liga/desliga grande, fácil de tocar.
export function Interruptor({
  ligado,
  aoMudar,
  rotulo,
  descricao,
}: {
  ligado: boolean
  aoMudar: (v: boolean) => void
  rotulo: string
  descricao?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      onClick={() => aoMudar(!ligado)}
      className="flex min-h-14 w-full items-center gap-3 py-2 text-left"
    >
      <span className="flex-1">
        <span className="block font-medium">{rotulo}</span>
        {descricao && <span className="block text-sm text-slate-500 dark:text-slate-400">{descricao}</span>}
      </span>
      <span
        className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${ligado ? 'bg-emerald-600 dark:bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
      >
        <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${ligado ? 'left-7' : 'left-1'}`} />
      </span>
    </button>
  )
}
