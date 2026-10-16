import { useLiveQuery } from 'dexie-react-hooks'
import { navegar } from '../app/rotas'
import { db } from '../db/banco'
import { sessaoEmAndamento } from '../db/sessao'
import { gruposTreinadosRecentemente, textoAviso48h } from '../domain/treino/descanso48h'
import { ComecarTreino } from '../components/ComecarTreino'
import { desfazerPulo, pularTreino } from '../db/plano'
import { usePlano } from '../app/usePlano'
import { dispensarMensagemFase } from '../db/plano'
import { exercicioPorId } from '../domain/biblioteca'
import { Botao, Cartao, Etiqueta, Tela, Texto } from '../components/ui'
import { LembreteBackup } from '../components/LembreteBackup'
import { RegistroPesoHoje } from '../components/RegistroPesoHoje'

// Início (§3 tela 2): próximo treino sugerido, botão "Começar treino",
// lembretes de backup e de peso.
export function Inicio() {
  const dados = usePlano()
  const andamento = useLiveQuery(async () => (await sessaoEmAndamento()) ?? null)
  const recentes = useLiveQuery(async () => {
    const limite = new Date(Date.now() - 48 * 3600 * 1000).toISOString()
    const sessoes = await db.sessoes.where('inicio').above(limite).filter((s) => s.status === 'concluida').toArray()
    return sessoes.map((s) => ({ inicio: s.inicio, exercicios: s.estado.itens.filter((i) => i.papel === 'trabalho' && i.series.some((x) => x.feita)).map((i) => i.exercicioId) }))
  })
  const plano = dados?.plano
  const proximo = dados?.dias.find((d) => d.ordem === plano?.proximoIndice)
  const exercicios = proximo ? dados!.exercicios.filter((e) => e.diaId === proximo.id && e.papel === 'trabalho').sort((a, b) => a.ordem - b.ordem) : []
  // A11: só avisa se o próximo treino repete grupo treinado há menos de 48 h
  const aviso48h = recentes ? gruposTreinadosRecentemente({ proximos: exercicios.map((e) => e.exercicioId), recentes, agora: new Date() }) : []

  return (
    <Tela titulo="Início">
      {plano?.mensagemFase && (
        <Cartao destaque="sucesso" titulo="Nova fase">
          <Texto>{plano.mensagemFase}</Texto>
          <Botao variante="secundario" className="mt-3 w-full" onClick={dispensarMensagemFase}>
            Entendi
          </Botao>
        </Cartao>
      )}
      <LembreteBackup />

      {andamento && (
        <Cartao destaque="info" titulo="Treino em andamento">
          <Texto>{andamento.nomeDia}</Texto>
          <Botao grande className="mt-3 w-full" onClick={() => navegar('/treino')}>
            Continuar treino
          </Botao>
        </Cartao>
      )}

      {proximo && !andamento && (
        <Cartao>
          <div className="flex items-center gap-2">
            <p className="text-sm text-slate-500 dark:text-slate-400">Próximo treino</p>
            {plano?.fase === 'readaptacao' && <Etiqueta cor="marca">Readaptação</Etiqueta>}
          </div>
          <p className="text-2xl font-bold">{proximo.nome}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {exercicios.length} exercícios · ~{proximo.minutosEstimados} min
          </p>
          <ul className="mt-2 space-y-0.5 text-slate-700 dark:text-slate-300">
            {exercicios.map((e) => (
              <li key={e.id}>
                · {exercicioPorId(e.exercicioId)?.nome}
                {e.alerta && ' ⚠'}
              </li>
            ))}
          </ul>
          {aviso48h.length > 0 && (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">{textoAviso48h(aviso48h)}</p>
          )}
          <ComecarTreino />
          {dados!.dias.length > 1 && (
            <div className="mt-2 flex gap-2">
              <Botao variante="secundario" className="flex-1" onClick={() => void pularTreino()}>
                Pular treino
              </Botao>
              {(plano?.pulos?.length ?? 0) > 0 && (
                <Botao
                  variante="secundario"
                  className="w-12 shrink-0 px-0"
                  onClick={() => void desfazerPulo()}
                  aria-label={`Desfazer pulo (voltar para ${dados!.dias.find((d) => d.ordem === plano!.pulos![plano!.pulos!.length - 1])?.nome.split(' · ')[0] ?? 'o treino anterior'})`}
                  title="Desfazer pulo"
                >
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 12a9 9 0 1 0 3-6.7" />
                    <path d="M3 4v5h5" />
                  </svg>
                </Botao>
              )}
            </div>
          )}
          <Botao variante="fantasma" className="mt-1 w-full" onClick={() => navegar('/plano')}>
            Ver plano da semana
          </Botao>
        </Cartao>
      )}

      <RegistroPesoHoje />
    </Tela>
  )
}
