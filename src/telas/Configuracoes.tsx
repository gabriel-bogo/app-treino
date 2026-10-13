import { useState } from 'react'
import { lerTema, salvarTema, type Tema } from '../app/tema'
import { Cartao, Tela } from '../components/ui'

const OPCOES: { valor: Tema; rotulo: string }[] = [
  { valor: 'auto', rotulo: 'Automático' },
  { valor: 'claro', rotulo: 'Claro' },
  { valor: 'escuro', rotulo: 'Escuro' },
]

export function Configuracoes() {
  const [tema, setTema] = useState<Tema>(lerTema())
  return (
    <Tela titulo="Aparência e som" voltarPara="/mais">
      <Cartao titulo="Tema">
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tema">
          {OPCOES.map((o) => (
            <button
              key={o.valor}
              type="button"
              role="radio"
              aria-checked={tema === o.valor}
              onClick={() => {
                setTema(o.valor)
                salvarTema(o.valor)
              }}
              className={`min-h-12 rounded-xl border font-medium ${
                tema === o.valor
                  ? 'border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500 dark:text-slate-950'
                  : 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900'
              }`}
            >
              {o.rotulo}
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Automático segue o modo do seu celular.</p>
      </Cartao>
    </Tela>
  )
}
