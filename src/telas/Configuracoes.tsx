import { useState } from 'react'
import { lerTema, salvarTema, type Tema } from '../app/tema'
import { Cartao, Tela } from '../components/ui'
import { Interruptor } from '../components/Interruptor'
import { useLiveQuery } from 'dexie-react-hooks'
import { atualizarConfiguracoes, db } from '../db/banco'
import { tocarFimDescanso, desbloquearAudio } from '../app/som'

const OPCOES: { valor: Tema; rotulo: string }[] = [
  { valor: 'auto', rotulo: 'Automático' },
  { valor: 'claro', rotulo: 'Claro' },
  { valor: 'escuro', rotulo: 'Escuro' },
]

export function Configuracoes() {
  const [tema, setTema] = useState<Tema>(lerTema())
  const config = useLiveQuery(() => db.configuracoes.get('app'))
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
      <Cartao titulo="Som">
        <Interruptor
          rotulo="Som no fim do descanso"
          descricao="Com o app aberto. No iPhone, o modo silencioso pode bloquear o som; o aviso na tela continua."
          ligado={config?.som ?? true}
          aoMudar={(v) => atualizarConfiguracoes({ som: v })}
        />
        <button
          type="button"
          className="mt-1 text-sm font-medium text-emerald-700 dark:text-emerald-400"
          onClick={() => {
            desbloquearAudio()
            tocarFimDescanso()
          }}
        >
          Testar som
        </button>
      </Cartao>
    </Tela>
  )
}
