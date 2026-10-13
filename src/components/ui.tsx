import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { voltar } from '../app/rotas'
import { IconeVoltar } from './icones'

// Componentes visuais básicos. Mobile-first: alvos de toque grandes (mín. 48px).

export function Tela({
  titulo,
  voltarPara,
  acao,
  children,
}: {
  titulo: string
  /** mostra a seta de voltar; o valor é o destino caso não haja histórico */
  voltarPara?: string
  acao?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-xl flex-col">
      <header className="pt-seguro sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 px-4 pb-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="flex min-h-10 items-center gap-2">
          {voltarPara !== undefined && (
            <button
              type="button"
              onClick={() => voltar(voltarPara)}
              className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-slate-600 active:bg-slate-200 dark:text-slate-300 dark:active:bg-slate-800"
              aria-label="Voltar"
            >
              <IconeVoltar />
            </button>
          )}
          <h1 className="flex-1 truncate text-xl font-bold">{titulo}</h1>
          {acao}
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 px-4 py-4">{children}</main>
    </div>
  )
}

export function Cartao({
  titulo,
  children,
  className = '',
  destaque,
}: {
  titulo?: ReactNode
  children: ReactNode
  className?: string
  destaque?: 'aviso' | 'perigo' | 'sucesso' | 'info'
}) {
  const cores = {
    aviso: 'border-amber-300 bg-amber-50 dark:border-amber-700/60 dark:bg-amber-950/40',
    perigo: 'border-red-300 bg-red-50 dark:border-red-800/60 dark:bg-red-950/40',
    sucesso: 'border-emerald-300 bg-emerald-50 dark:border-emerald-800/60 dark:bg-emerald-950/40',
    info: 'border-sky-300 bg-sky-50 dark:border-sky-800/60 dark:bg-sky-950/40',
  }
  const base = destaque
    ? cores[destaque]
    : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
  return (
    <section className={`rounded-2xl border p-4 ${base} ${className}`}>
      {titulo && <h2 className="mb-2 text-base font-semibold">{titulo}</h2>}
      {children}
    </section>
  )
}

type Variante = 'primario' | 'secundario' | 'perigo' | 'fantasma'

export function Botao({
  variante = 'primario',
  grande,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante; grande?: boolean }) {
  const estilos: Record<Variante, string> = {
    primario:
      'bg-emerald-600 text-white active:bg-emerald-700 disabled:bg-slate-300 dark:bg-emerald-500 dark:text-slate-950 dark:active:bg-emerald-400 dark:disabled:bg-slate-700 dark:disabled:text-slate-400',
    secundario:
      'border border-slate-300 bg-white text-slate-900 active:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:active:bg-slate-800',
    perigo: 'bg-red-600 text-white active:bg-red-700 dark:bg-red-500',
    fantasma: 'text-emerald-700 active:bg-emerald-50 dark:text-emerald-400 dark:active:bg-slate-800',
  }
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 font-semibold transition-colors disabled:cursor-not-allowed ${
        grande ? 'min-h-14 text-lg' : 'min-h-12 text-base'
      } ${estilos[variante]} ${className}`}
      {...props}
    />
  )
}

export function Etiqueta({ children, cor = 'neutra' }: { children: ReactNode; cor?: 'neutra' | 'aviso' | 'marca' | 'perigo' }) {
  const cores = {
    neutra: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    aviso: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200',
    marca: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200',
    perigo: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200',
  }
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cores[cor]}`}>{children}</span>
}

/** Item de lista tocável (leva a outra tela). */
export function ItemLista({
  titulo,
  subtitulo,
  onClick,
  direita,
}: {
  titulo: ReactNode
  subtitulo?: ReactNode
  onClick?: () => void
  direita?: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left active:bg-slate-100 dark:active:bg-slate-800"
    >
      <span className="flex-1">
        <span className="block font-medium">{titulo}</span>
        {subtitulo && <span className="block text-sm text-slate-500 dark:text-slate-400">{subtitulo}</span>}
      </span>
      {direita ?? <span className="text-slate-400">›</span>}
    </button>
  )
}

export function Lista({ children }: { children: ReactNode }) {
  return (
    <div className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
      {children}
    </div>
  )
}

export function Texto({ children, fraco }: { children: ReactNode; fraco?: boolean }) {
  return <p className={fraco ? 'text-sm text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-300'}>{children}</p>
}
