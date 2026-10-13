import { Component, type ReactNode } from 'react'

// Se algo inesperado quebrar a tela (ex: um backup com dados estragados),
// mostra uma saída em vez de deixar o app em branco.
export class ProtecaoErro extends Component<{ children: ReactNode }, { erro: Error | null }> {
  state = { erro: null as Error | null }

  static getDerivedStateFromError(erro: Error) {
    return { erro }
  }

  render() {
    if (!this.state.erro) return this.props.children
    return (
      <div className="pt-seguro mx-auto max-w-xl px-4">
        <div className="mt-6 rounded-2xl border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/40">
          <h1 className="text-lg font-bold">Algo deu errado</h1>
          <p className="mt-2 text-slate-700 dark:text-slate-300">Seus dados continuam salvos neste aparelho. Tente recarregar o app.</p>
          <p className="mt-2 break-words text-xs text-slate-500">{this.state.erro.message}</p>
          <div className="mt-4 flex flex-col gap-2">
            <button type="button" className="min-h-12 rounded-xl bg-emerald-600 font-semibold text-white" onClick={() => window.location.reload()}>
              Recarregar
            </button>
            <button
              type="button"
              className="min-h-12 rounded-xl border border-slate-300 font-semibold dark:border-slate-700"
              onClick={() => {
                window.location.hash = '/backup'
                window.location.reload()
              }}
            >
              Ir para o backup
            </button>
          </div>
        </div>
      </div>
    )
  }
}
