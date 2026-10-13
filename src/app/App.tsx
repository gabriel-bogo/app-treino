import { useEffect, type ReactNode } from 'react'
import { navegar, useRota } from './rotas'
import { IconeHistorico, IconeInicio, IconeMais, IconePlano, IconeSaude } from '../components/icones'
import { Mais } from '../telas/Mais'
import { Sobre } from '../telas/Sobre'
import { Instalar } from '../telas/Instalar'
import { Configuracoes } from '../telas/Configuracoes'
import { EmBreve } from '../telas/EmBreve'
import { Backup } from '../telas/Backup'
import { Inicio } from '../telas/Inicio'
import { Biblioteca } from '../telas/Biblioteca'
import { ExercicioDetalhe } from '../telas/ExercicioDetalhe'
import { Onboarding } from '../telas/Onboarding'
import { Perfil } from '../telas/Perfil'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/banco'

const ABAS: { caminho: string; rotulo: string; icone: ReactNode }[] = [
  { caminho: '/', rotulo: 'Início', icone: <IconeInicio /> },
  { caminho: '/plano', rotulo: 'Plano', icone: <IconePlano /> },
  { caminho: '/historico', rotulo: 'Histórico', icone: <IconeHistorico /> },
  { caminho: '/saude', rotulo: 'Saúde', icone: <IconeSaude /> },
  { caminho: '/mais', rotulo: 'Mais', icone: <IconeMais /> },
]

function abaAtiva(partes: string[]): string {
  const p = partes[0]
  if (!p) return '/'
  if (['plano'].includes(p)) return '/plano'
  if (['historico'].includes(p)) return '/historico'
  if (['saude'].includes(p)) return '/saude'
  return '/mais'
}

function BarraInferior({ ativa }: { ativa: string }) {
  return (
    <nav
      className="pb-seguro fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95"
      aria-label="Navegação principal"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-5">
        {ABAS.map((a) => {
          const sel = a.caminho === ativa
          return (
            <li key={a.caminho}>
              <button
                type="button"
                onClick={() => navegar(a.caminho)}
                aria-current={sel ? 'page' : undefined}
                className={`flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-xs font-medium ${
                  sel ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {a.icone}
                {a.rotulo}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function Conteudo({ partes }: { partes: string[] }) {
  switch (partes[0]) {
    case undefined:
      return <Inicio />
    case 'plano':
      return <EmBreve titulo="Plano da semana" />
    case 'historico':
      return <EmBreve titulo="Histórico" />
    case 'saude':
      return <EmBreve titulo="Saúde" />
    case 'mais':
      return <Mais />
    case 'sobre':
      return <Sobre />
    case 'instalar':
      return <Instalar />
    case 'configuracoes':
      return <Configuracoes />
    case 'biblioteca':
      return partes[1] ? <ExercicioDetalhe id={partes[1]} /> : <Biblioteca />
    case 'perfil':
      return <Perfil />
    case 'backup':
      return <Backup />
    default:
      return <EmBreve titulo="Página não encontrada" voltarPara="/" />
  }
}

export function App() {
  const { caminho, partes } = useRota()
  // cada tela nova começa do topo
  useEffect(() => window.scrollTo(0, 0), [caminho])
  // undefined = carregando; null = ainda não fez o onboarding
  const perfil = useLiveQuery(async () => (await db.perfil.get('perfil')) ?? null)

  if (perfil === undefined) return null
  // Sem perfil: onboarding. Backup, Sobre e Instalar continuam acessíveis
  // (para restaurar um backup antes de começar).
  if (perfil === null && !['backup', 'sobre', 'instalar'].includes(partes[0] ?? '')) return <Onboarding />
  return (
    <div className="min-h-dvh pb-24">
      <Conteudo partes={partes} />
      <BarraInferior ativa={abaAtiva(partes)} />
    </div>
  )
}
