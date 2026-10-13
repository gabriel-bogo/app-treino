import type { FaixaEtaria } from '../domain/saude'

// Barra visual com as faixas de IMC e um marcador da posição atual (§10).
// Linguagem neutra: só a faixa adequada tem cor; as outras são tons de cinza.

const FAIXAS: Record<'adulto' | 'idoso', { ate: number; nome: string; adequada?: boolean }[]> = {
  adulto: [
    { ate: 18.5, nome: 'Abaixo' },
    { ate: 25, nome: 'Adequado', adequada: true },
    { ate: 30, nome: 'Sobrepeso' },
    { ate: 35, nome: 'Ob. I' },
    { ate: 40, nome: 'Ob. II' },
    { ate: 45, nome: 'Ob. III' },
  ],
  idoso: [
    { ate: 22, nome: 'Baixo peso' },
    { ate: 27, nome: 'Adequado', adequada: true },
    { ate: 35, nome: 'Sobrepeso' },
  ],
}

export function BarraIMC({ imc, faixa }: { imc: number; faixa: FaixaEtaria }) {
  if (faixa === 'menor') return null
  const faixas = FAIXAS[faixa]
  const inicio = 15
  const fim = faixas[faixas.length - 1].ate
  const pos = (v: number) => ((Math.min(Math.max(v, inicio), fim) - inicio) / (fim - inicio)) * 100
  let anterior = inicio
  return (
    <div className="mt-2" aria-hidden="true">
      <div className="relative h-8">
        <div className="absolute -translate-x-1/2 text-xs font-semibold" style={{ left: `${pos(imc)}%` }}>
          <div className="whitespace-nowrap rounded bg-slate-900 px-1.5 py-0.5 text-white dark:bg-white dark:text-slate-900">
            {imc.toFixed(1).replace('.', ',')}
          </div>
          <div className="mx-auto h-0 w-0 border-x-4 border-t-4 border-x-transparent border-t-slate-900 dark:border-t-white" />
        </div>
      </div>
      <div className="flex h-3 gap-0.5 overflow-hidden rounded-full">
        {faixas.map((f, i) => {
          const largura = pos(f.ate) - pos(anterior)
          anterior = f.ate
          return (
            <div
              key={f.nome}
              style={{ width: `${largura}%` }}
              className={f.adequada ? 'bg-emerald-600 dark:bg-emerald-500' : i % 2 ? 'bg-slate-300 dark:bg-slate-600' : 'bg-slate-200 dark:bg-slate-700'}
            />
          )
        })}
      </div>
      <div className="relative mt-1 h-4 text-[11px] text-slate-500 dark:text-slate-400" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {faixas.slice(0, -1).map((f) => (
          <span key={f.ate} className="absolute -translate-x-1/2" style={{ left: `${pos(f.ate)}%` }}>
            {String(f.ate).replace('.', ',')}
          </span>
        ))}
      </div>
    </div>
  )
}
