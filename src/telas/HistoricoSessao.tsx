import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/banco'
import { exercicioPorId } from '../domain/biblioteca'
import { formatarData, formatarDuracao, formatarDuracaoTreino, formatarHora } from '../domain/datas'
import { formatarKg } from '../domain/progressao/carga'
import type { MotivoTroca, SerieTreino } from '../domain/tipos'
import { Cartao, Etiqueta, Tela, Texto } from '../components/ui'

const MOTIVO: Record<MotivoTroca, string> = {
  ocupado: 'aparelho ocupado',
  sem_equipamento: 'sem o equipamento',
  dor: 'desconforto/dor',
  outro: 'outro motivo',
}

function rotuloSerie(s: SerieTreino, n: number) {
  if (s.tipo === 'aproximacao') return 'Aprox.'
  if (s.tipo === 'aquecimento') return 'Aquec.'
  if (s.tipo === 'extra') return `Extra`
  return `${n}ª`
}

// Detalhe de um treino: exercícios, séries (carga × reps, descanso real),
// trocas com motivo e marcações de dor.
export function HistoricoSessao({ id }: { id: string }) {
  const s = useLiveQuery(() => db.sessoes.get(id), [id])
  if (!s) return <Tela titulo="Treino" voltarPara="/historico">{null}</Tela>
  return (
    <Tela titulo={s.nomeDia} voltarPara="/historico">
      <Texto fraco>
        {formatarData(s.inicio)} às {formatarHora(s.inicio)} · duração {formatarDuracaoTreino(s.duracaoSeg ?? 0)}
        {s.fase === 'readaptacao' && ' · readaptação'}
      </Texto>
      {s.ajustePausa && (
        <Cartao destaque="info">
          <Texto>{s.ajustePausa.texto}</Texto>
        </Cartao>
      )}
      {s.estado.itens
        .filter((i) => i.series.some((x) => x.feita) || i.status === 'pulado' || i.originalId)
        .map((i) => {
          const ex = exercicioPorId(i.exercicioId)
          let n = 0
          return (
            <Cartao
              key={i.uid}
              titulo={
                <span className="flex flex-wrap items-center gap-1">
                  {ex?.nome ?? i.exercicioId}
                  {i.papel === 'aquecimento_ombro' && <Etiqueta cor="marca">Aquecimento</Etiqueta>}
                  {i.status === 'pulado' && <Etiqueta>Pulado</Etiqueta>}
                  {i.dor && <Etiqueta cor="aviso">Dor</Etiqueta>}
                </span>
              }
            >
              {i.originalId && (
                <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
                  No lugar de {exercicioPorId(i.originalId)?.nome} ({MOTIVO[i.motivoTroca ?? 'outro']})
                </p>
              )}
              {i.series.some((x) => x.feita) ? (
                <table className="w-full text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  <thead className="text-left text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="py-1 font-medium">Série</th>
                      <th className="py-1 text-right font-medium">Carga</th>
                      <th className="py-1 text-right font-medium">Reps</th>
                      <th className="py-1 text-right font-medium">Descanso</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {i.series
                      .filter((x) => x.feita)
                      .map((x) => {
                        if (x.tipo === 'trabalho') n++
                        return (
                          <tr key={x.uid} className={x.tipo === 'aproximacao' || x.tipo === 'aquecimento' ? 'text-sky-700 dark:text-sky-300' : ''}>
                            <td className="py-1.5">{rotuloSerie(x, n)}</td>
                            <td className="py-1.5 text-right">{x.carga === null ? '—' : `${formatarKg(x.carga)} kg`}</td>
                            <td className="py-1.5 text-right">
                              {x.reps ?? '—'}
                              {x.repsAlvo !== null && x.tipo === 'trabalho' && <span className="text-slate-400"> /{x.repsAlvo}</span>}
                            </td>
                            <td className="py-1.5 text-right">{x.descansoRealSeg !== undefined ? formatarDuracao(x.descansoRealSeg) : '—'}</td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              ) : (
                <Texto fraco>Nenhuma série feita.</Texto>
              )}
            </Cartao>
          )
        })}
      <Texto fraco>Reps mostram o feito / o alvo. Descanso é o tempo real entre uma série e a anterior.</Texto>
    </Tela>
  )
}
