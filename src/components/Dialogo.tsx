import { useEffect, type ReactNode } from 'react'

// Janela de confirmação/escolha por cima da tela (bottom sheet no celular).
export function Dialogo({
  aberto,
  titulo,
  children,
  acoes,
  aoFechar,
}: {
  aberto: boolean
  titulo: string
  children?: ReactNode
  acoes: ReactNode
  aoFechar?: () => void
}) {
  useEffect(() => {
    if (!aberto || !aoFechar) return
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar()
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [aberto, aoFechar])

  if (!aberto) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={titulo}>
      <div className="absolute inset-0 bg-black/50" onClick={aoFechar} />
      <div className="pb-seguro relative max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-3xl dark:bg-slate-900">
        <h2 className="mb-3 text-lg font-bold">{titulo}</h2>
        {children && <div className="mb-4 space-y-2 text-slate-700 dark:text-slate-300">{children}</div>}
        <div className="flex flex-col gap-2">{acoes}</div>
      </div>
    </div>
  )
}
