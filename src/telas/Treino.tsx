import { useCallback, useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/banco'
import { descartarSessao, finalizarSessao, salvarEstado, sessaoEmAndamento } from '../db/sessao'
import { navegar } from '../app/rotas'
import { useAgora } from '../app/useAgora'
import { useTelaLigada } from '../app/telaLigada'
import { desbloquearAudio } from '../app/som'
import { exercicioPorId, mapaAjustes, NOME_EQUIPAMENTO, ROTULO_CARGA } from '../domain/biblioteca'
import { formatarDuracao } from '../domain/datas'
import { cargaTotal, formatarKg } from '../domain/progressao/carga'
import { configDoExercicio } from '../domain/progressao/sugestao'
import {
  adicionarSerie,
  ajustarTimer,
  alterarSerie,
  contadorSeries,
  deixarParaDepois,
  irPara,
  itemAtual,
  marcarSerie,
  progresso,
  pularTimer,
  removerSerie,
  temTrabalhoFeito,
} from '../domain/treino/sessao'
import type { EstadoTreino, ItemTreino, Sessao } from '../domain/tipos'
import { Botao, Cartao, Etiqueta, Texto } from '../components/ui'
import { Dialogo } from '../components/Dialogo'
import { ComoFazer } from '../components/ComoFazer'
import { LinhaSerie } from '../components/treino/LinhaSerie'
import { PainelDescanso } from '../components/treino/PainelDescanso'

/**
 * Estado do treino na tela, salvo no IndexedDB a cada toque. Mantém uma cópia
 * local para responder na hora e não perder toques rápidos.
 */
function useEstadoTreino(sessao: Sessao | null | undefined) {
  const [estado, setEstado] = useState<EstadoTreino | null>(sessao?.estado ?? null)
  const atual = useRef<EstadoTreino | null>(sessao?.estado ?? null)
  const id = sessao?.id
  useEffect(() => {
    atual.current = sessao?.estado ?? null
    setEstado(sessao?.estado ?? null)
    // só recarrega do banco quando muda a sessão
  }, [id])
  const aplicar = useCallback(
    (fn: (e: EstadoTreino) => EstadoTreino) => {
      if (!atual.current || !id) return
      const novo = fn(atual.current)
      if (novo === atual.current) return
      atual.current = novo
      setEstado(novo)
      void salvarEstado(id, novo)
    },
    [id],
  )
  return { estado, aplicar }
}

export function Treino() {
  const sessao = useLiveQuery(async () => (await sessaoEmAndamento()) ?? null)
  const perfil = useLiveQuery(() => db.perfil.get('perfil'))
  const ajustes = mapaAjustes(useLiveQuery(() => db.ajustesExercicio.toArray()))
  const config = useLiveQuery(() => db.configuracoes.get('app'))
  const estadosProgressao = useLiveQuery(() => db.progressao.toArray())
  const { estado, aplicar } = useEstadoTreino(sessao)
  const agora = useAgora(500)
  const [comoFazer, setComoFazer] = useState<string | null>(null)
  const [finalizar, setFinalizar] = useState(false)
  const [confirmarDescarte, setConfirmarDescarte] = useState(false)
  const [salvando, setSalvando] = useState(false)
  useTelaLigada(!!sessao)

  if (sessao === undefined || perfil === undefined) return null
  if (sessao === null || !estado || !perfil) {
    return (
      <div className="pt-seguro mx-auto max-w-xl px-4">
        <Cartao>
          <Texto>Nenhum treino em andamento.</Texto>
          <Botao className="mt-3 w-full" onClick={() => navegar('/', { substituir: true })}>
            Voltar ao início
          </Botao>
        </Cartao>
      </div>
    )
  }

  const atual = itemAtual(estado)
  const prog = progresso(estado)
  const decorrido = (agora.getTime() - new Date(sessao.inicio).getTime()) / 1000
  const som = config?.som ?? true

  async function concluir() {
    setSalvando(true)
    const r = await finalizarSessao(sessao!.id)
    setSalvando(false)
    setFinalizar(false)
    navegar(r.status === 'concluida' ? `/treino/resumo/${sessao!.id}` : '/', { substituir: true })
  }

  return (
    <div className={`mx-auto flex min-h-dvh max-w-xl flex-col ${estado.timer ? 'pb-48' : 'pb-8'}`}>
      <header className="pt-seguro sticky top-0 z-20 border-b border-slate-200 bg-slate-50/95 px-4 pb-2 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="flex min-h-11 items-center gap-2">
          <button type="button" onClick={() => navegar('/')} className="-ml-2 h-11 rounded-full px-2 text-sm font-medium text-slate-600 dark:text-slate-300" aria-label="Sair da tela de treino (o treino continua salvo)">
            ‹ Início
          </button>
          <div className="flex-1 text-center">
            <p className="text-sm font-semibold leading-tight">{sessao.nomeDia}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400" style={{ fontVariantNumeric: 'tabular-nums' }} aria-label="Tempo de treino">
              ⏱ {formatarDuracao(decorrido)}
            </p>
          </div>
          <Botao variante="secundario" className="min-h-10 px-3 text-sm" onClick={() => setFinalizar(true)}>
            Finalizar
          </Botao>
        </div>
        <div className="mt-1 flex items-center gap-2" aria-label={`${prog.concluidos} de ${prog.total} exercícios concluídos`}>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div className="h-full bg-emerald-600 transition-[width] dark:bg-emerald-500" style={{ width: `${prog.total ? (prog.concluidos / prog.total) * 100 : 0}%` }} />
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {prog.concluidos}/{prog.total}
          </span>
        </div>
      </header>

      <main className="flex flex-col gap-4 px-4 py-4">
        {atual ? (
          <CartaoExercicio
            key={atual.uid}
            item={atual}
            sessao={sessao}
            incremento={(() => {
              const ex = exercicioPorId(atual.exercicioId)
              return ex ? configDoExercicio(ex, perfil, ajustes.get(ex.id), sessao.fase).incremento : 1
            })()}
            cargaReferencia={estadosProgressao?.find((p) => p.exercicioId === atual.exercicioId)?.cargaReferencia ?? null}
            pesoBarraKg={ajustes.get(atual.exercicioId)?.pesoBarraKg}
            aoMarcar={(serieUid) => {
              desbloquearAudio()
              aplicar((e) => marcarSerie(e, atual.uid, serieUid, new Date()))
            }}
            aoMudar={(serieUid, v) => aplicar((e) => alterarSerie(e, atual.uid, serieUid, v))}
            aoAdicionar={() => aplicar((e) => adicionarSerie(e, atual.uid))}
            aoRemover={() => aplicar((e) => removerSerie(e, atual.uid))}
            aoDepois={() => aplicar((e) => deixarParaDepois(e, atual.uid))}
            aoComoFazer={() => setComoFazer(atual.exercicioId)}
          />
        ) : (
          <Cartao destaque="sucesso" titulo="Todos os exercícios concluídos!">
            <Texto>Toque em Finalizar para salvar o treino.</Texto>
            <Botao className="mt-3 w-full" onClick={() => setFinalizar(true)}>
              Finalizar treino
            </Botao>
          </Cartao>
        )}

        <Cartao titulo="Exercícios do treino">
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {estado.itens.map((i) => {
              const ex = exercicioPorId(i.exercicioId)
              const c = contadorSeries(i)
              const ehAtual = i.uid === atual?.uid
              return (
                <li key={i.uid}>
                  <button
                    type="button"
                    onClick={() => aplicar((e) => irPara(e, i.uid))}
                    className={`flex min-h-12 w-full items-center gap-3 py-2 text-left ${ehAtual ? 'font-semibold' : ''}`}
                    aria-current={ehAtual ? 'step' : undefined}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm ${
                        i.status === 'concluido'
                          ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950'
                          : ehAtual
                            ? 'border-2 border-emerald-600 dark:border-emerald-500'
                            : 'border-2 border-slate-300 dark:border-slate-600'
                      }`}
                      aria-hidden="true"
                    >
                      {i.status === 'concluido' ? '✓' : ''}
                    </span>
                    <span className="flex-1">
                      {ex?.nome}
                      {i.papel === 'aquecimento_ombro' && <span className="ml-1 text-xs font-normal text-sky-700 dark:text-sky-300">aquecimento</span>}
                    </span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {c.feitas}/{c.total}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          <Texto fraco>Toque em qualquer exercício para fazer fora da ordem.</Texto>
        </Cartao>
      </main>

      {estado.timer && (
        <PainelDescanso
          timer={estado.timer}
          agora={agora}
          som={som}
          aoAjustar={(d) => aplicar((e) => ajustarTimer(e, d, new Date()))}
          aoPular={() => aplicar((e) => pularTimer(e))}
        />
      )}

      <Dialogo
        aberto={!!comoFazer}
        titulo={exercicioPorId(comoFazer ?? '')?.nome ?? ''}
        aoFechar={() => setComoFazer(null)}
        acoes={
          <Botao variante="secundario" onClick={() => setComoFazer(null)}>
            Fechar
          </Botao>
        }
      >
        {comoFazer && exercicioPorId(comoFazer) && <ComoFazer ex={exercicioPorId(comoFazer)!} />}
      </Dialogo>

      <Dialogo
        aberto={finalizar}
        titulo="Finalizar treino?"
        aoFechar={() => setFinalizar(false)}
        acoes={
          <>
            <Botao onClick={concluir} disabled={salvando}>
              {temTrabalhoFeito(estado) ? 'Finalizar e salvar' : 'Sair sem salvar'}
            </Botao>
            <Botao variante="secundario" onClick={() => setFinalizar(false)}>
              Continuar treinando
            </Botao>
            {temTrabalhoFeito(estado) && (
              <Botao variante="fantasma" className="text-red-600 dark:text-red-400" onClick={() => (setFinalizar(false), setConfirmarDescarte(true))}>
                Descartar treino
              </Botao>
            )}
          </>
        }
      >
        <p>
          {prog.concluidos} de {prog.total} exercícios concluídos em {formatarDuracao(decorrido)}.
        </p>
        {temTrabalhoFeito(estado) ? (
          <p>O que foi registrado será salvo e usado na progressão.</p>
        ) : (
          <p>Nenhuma série foi marcada, então nada será salvo.</p>
        )}
      </Dialogo>

      <Dialogo
        aberto={confirmarDescarte}
        titulo="Descartar este treino?"
        aoFechar={() => setConfirmarDescarte(false)}
        acoes={
          <>
            <Botao
              variante="perigo"
              onClick={async () => {
                await descartarSessao(sessao.id)
                navegar('/', { substituir: true })
              }}
            >
              Descartar
            </Botao>
            <Botao variante="secundario" onClick={() => setConfirmarDescarte(false)}>
              Cancelar
            </Botao>
          </>
        }
      >
        <p>As séries marcadas hoje não serão salvas nem contarão na progressão.</p>
      </Dialogo>
    </div>
  )
}

function CartaoExercicio({
  item,
  sessao,
  incremento,
  cargaReferencia,
  pesoBarraKg,
  aoMarcar,
  aoMudar,
  aoAdicionar,
  aoRemover,
  aoDepois,
  aoComoFazer,
}: {
  item: ItemTreino
  sessao: Sessao
  incremento: number
  cargaReferencia: number | null
  pesoBarraKg?: number
  aoMarcar: (serieUid: string) => void
  aoMudar: (serieUid: string, v: { carga?: number | null; reps?: number | null }) => void
  aoAdicionar: () => void
  aoRemover: () => void
  aoDepois: () => void
  aoComoFazer: () => void
}) {
  const ex = exercicioPorId(item.exercicioId)
  if (!ex) return null
  const aquecimento = item.papel === 'aquecimento_ombro'
  const mostrarCarga = ex.tipoCarga !== 'pesoCorpo' || item.cargaSugerida !== null || item.series.some((s) => s.carga !== null)
  const c = contadorSeries(item)
  const alvo = item.series.find((s) => s.tipo === 'trabalho')?.repsAlvo ?? null
  const cargaExemplo = item.series.find((s) => !s.feita && s.carga !== null)?.carga ?? null
  let numeroTrabalho = 0
  let numeroAquec = 0

  return (
    <Cartao>
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <h2 className="text-xl font-bold leading-tight">{ex.nome}</h2>
          <div className="mt-1 flex flex-wrap gap-1">
            <Etiqueta>{NOME_EQUIPAMENTO[ex.equipamento]}</Etiqueta>
            {aquecimento && <Etiqueta cor="marca">Aquecimento de ombro</Etiqueta>}
            {ex.unilateral && <Etiqueta>Reps por lado</Etiqueta>}
          </div>
        </div>
        <span className="rounded-full bg-slate-900 px-3 py-1 text-sm font-semibold text-white dark:bg-white dark:text-slate-900" aria-label={`${c.feitas} de ${c.total} séries`}>
          {c.feitas} de {c.total} séries
        </span>
      </div>

      {item.alerta && (
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">⚠ {item.alerta}</p>
      )}

      <div className="mt-2 space-y-0.5 text-sm text-slate-600 dark:text-slate-300">
        {aquecimento ? (
          <p>Leve, {item.series.length} × {item.repsMax}. Não conta na progressão.</p>
        ) : (
          <>
            <p>
              {alvo !== null ? (
                <>
                  Alvo: <strong>{alvo} reps</strong>
                  {ex.unilateral && ' por lado'}
                </>
              ) : (
                'Primeira vez: faça o máximo de repetições com boa execução.'
              )}
              {' · '}descanso {formatarDuracao(item.descansoSeg)}
            </p>
            <p>{sessao.fase === 'readaptacao' ? 'Termine cada série com 3 a 4 repetições sobrando.' : 'Termine cada série com 1 a 3 repetições sobrando.'}</p>
            {mostrarCarga && item.cargaSugerida === null && (
              <p className="font-medium text-sky-700 dark:text-sky-300">
                Comece leve: escolha uma carga para fazer cerca de {alvo ?? 8} repetições.
                {cargaReferencia !== null && ` Na readaptação você usou ${formatarKg(cargaReferencia)} kg.`}
              </p>
            )}
            {ex.tipoCarga === 'porLado' && cargaExemplo !== null && (
              <p>
                Total na barra: {formatarKg(cargaTotal(ex, cargaExemplo, { exercicioId: ex.id, pesoBarraKg }))} kg
              </p>
            )}
          </>
        )}
      </div>

      <div className="mt-3 flex items-center gap-1.5 px-1.5 text-xs font-medium text-slate-500 dark:text-slate-400" aria-hidden="true">
        <span className="w-7 text-center">#</span>
        {mostrarCarga && <span className="flex-1 text-center">{ex.assistido ? 'Ajuda (kg)' : ROTULO_CARGA[ex.tipoCarga]}</span>}
        <span className="flex-1 text-center">Reps{ex.unilateral ? ' por lado' : ''}</span>
        <span className="w-12 text-center">Feita</span>
      </div>
      <div className="mt-1 flex flex-col gap-1">
        {item.series.map((s) => {
          const ehAquec = s.tipo === 'aquecimento' || s.tipo === 'aproximacao'
          const numero = ehAquec ? `A${++numeroAquec}` : s.tipo === 'extra' ? `+${++numeroTrabalho}` : String(++numeroTrabalho)
          return (
            <LinhaSerie
              key={s.uid}
              numero={numero}
              serie={s}
              mostrarCarga={mostrarCarga}
              incremento={incremento}
              aoMudar={(v) => aoMudar(s.uid, v)}
              aoMarcar={() => aoMarcar(s.uid)}
            />
          )
        })}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Botao variante="secundario" className="text-sm" onClick={aoAdicionar}>
          + Série extra
        </Botao>
        <Botao variante="secundario" className="text-sm" onClick={aoRemover}>
          − Remover série
        </Botao>
        <Botao variante="secundario" className="text-sm" onClick={aoComoFazer}>
          Como fazer
        </Botao>
        <Botao variante="secundario" className="text-sm" onClick={aoDepois}>
          Deixar pra depois
        </Botao>
      </div>
    </Cartao>
  )
}
