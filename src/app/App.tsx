import { useEffect, type ReactNode } from 'react'
import { navegar, useRota } from './rotas'
import { IconeHistorico, IconeInicio, IconeMais, IconePlano, IconeSaude } from '../components/icones'
import { Mais } from '../telas/Mais'
import { Sobre } from '../telas/Sobre'
import { Instalar } from '../telas/Instalar'
import { Configuracoes } from '../telas/Configuracoes'
import { NaoEncontrada } from '../telas/NaoEncontrada'
import { Backup } from '../telas/Backup'
import { Inicio } from '../telas/Inicio'
import { Biblioteca } from '../telas/Biblioteca'
import { ExercicioDetalhe } from '../telas/ExercicioDetalhe'
import { Onboarding } from '../telas/Onboarding'
import { Perfil } from '../telas/Perfil'
import { Saude } from '../telas/Saude'
import { PlanoSemana } from '../telas/PlanoSemana'
import { PropostaPlano } from '../telas/PropostaPlano'
import { Treino } from '../telas/Treino'
import { ResumoTreino } from '../telas/ResumoTreino'
import { RetomadaTreino } from '../components/RetomadaTreino'
import { Historico } from '../telas/Historico'
import { HistoricoSessao } from '../telas/HistoricoSessao'
import { HistoricoExercicio } from '../telas/HistoricoExercicio'
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
      return partes[1] === 'proposta' ? <PropostaPlano /> : <PlanoSemana />
    case 'treino':
      return partes[1] === 'resumo' && partes[2] ? <ResumoTreino id={partes[2]} /> : <Treino />
    case 'historico':
      if (partes[1] === 'exercicio' && partes[2]) return <HistoricoExercicio id={partes[2]} />
      return partes[1] ? <HistoricoSessao id={partes[1]} /> : <Historico />
    case 'saude':
      return <Saude />
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
      // "/perfil/proposta": veio de "Mudar minhas escolhas" na proposta do plano (C5)
      return <Perfil voltarPara={partes[1] === 'proposta' ? '/plano/proposta' : undefined} />
    case 'backup':
      return <Backup />
    default:
      return <NaoEncontrada />
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
  // durante o treino a tela é cheia (sem a barra de navegação)
  const telaTreino = partes[0] === 'treino' && partes[1] !== 'resumo'
  return (
    <div className={`min-h-dvh ${telaTreino ? '' : 'pb-24'}`}>
      <Conteudo partes={partes} />
      {!telaTreino && <BarraInferior ativa={abaAtiva(partes)} />}
      {perfil && <RetomadaTreino naTelaDeTreino={telaTreino} />}
    </div>
  )
}
