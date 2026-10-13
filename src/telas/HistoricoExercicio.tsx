import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/banco'
import { exercicioPorId } from '../domain/biblioteca'
import { formatarData } from '../domain/datas'
import { descreverCarga, formatarKg } from '../domain/progressao/carga'
import type { EventoProgressao, Exercicio, RegistroSerie } from '../domain/tipos'
import { Cartao, Tela, Texto } from '../components/ui'

function textoEvento(ev: EventoProgressao, ex: Exercicio): string {
  const passo = (p: EventoProgressao['de']) =>
    p.carga === null ? `${p.alvo ?? '—'} reps` : `${descreverCarga(ex, p.carga)} × ${p.alvo ?? '—'}`
  switch (ev.tipo) {
    case 'aumento_reps':
      return `Subiu repetições: ${passo(ev.de)} → ${passo(ev.para)}`
    case 'aumento_carga':
      return `Subiu carga: ${passo(ev.de)} → ${passo(ev.para)}`
    case 'regressao':
      return `Regressão: ${passo(ev.de)} → ${passo(ev.para)}`
    case 'carga_nova':
      return `Carga nova: ${passo(ev.para)}`
    case 'inicio':
      return `Início: ${passo(ev.para)}`
    case 'retorno_pausa':
      return `Ajuste de pausa: ${passo(ev.de)} → ${passo(ev.para)}`
  }
}

// Evolução de um exercício em tabela (gráfico fica para a Fase 2): cada
// treino com suas séries e o histórico de aumentos e regressões (§6.8).
export function HistoricoExercicio({ id }: { id: string }) {
  const ex = exercicioPorId(id)
  const registros = useLiveQuery(() => db.series.where('exercicioId').equals(id).toArray(), [id])
  const eventos = useLiveQuery(() => db.eventosProgressao.where('exercicioId').equals(id).toArray(), [id])
  const estado = useLiveQuery(() => db.progressao.get(id), [id])
  if (!ex || !registros || !eventos) return <Tela titulo="Exercício" voltarPara="/historico">{null}</Tela>

  const trabalho = registros.filter((r) => r.tipo === 'trabalho' || r.tipo === 'extra')
  const porSessao = new Map<string, RegistroSerie[]>()
  for (const r of trabalho.sort((a, b) => a.feitaEm.localeCompare(b.feitaEm))) {
    porSessao.set(r.sessaoId, [...(porSessao.get(r.sessaoId) ?? []), r])
  }
  const linhas = [...porSessao.values()].reverse()

  return (
    <Tela titulo={ex.nome} voltarPara="/historico">
      {estado && estado.alvo !== null && (
        <Cartao>
          <p className="text-sm text-slate-500 dark:text-slate-400">Próximo treino</p>
          <p className="text-xl font-bold">
            {estado.modo === 'carga' && estado.carga !== null ? `${descreverCarga(ex, estado.carga)} × ${estado.alvo} reps` : `${estado.alvo} reps`}
          </p>
          <Texto fraco>
            {estado.segurando ? 'Consolidando depois de uma regressão. ' : ''}
            {estado.confirmacoes > 0 ? `${estado.confirmacoes} confirmação(ões) nesta meta.` : ''}
          </Texto>
        </Cartao>
      )}

      <Cartao titulo="Treinos">
        {linhas.length === 0 ? (
          <Texto fraco>Nenhum registro.</Texto>
        ) : (
          <table className="w-full text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
            <thead className="text-left text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-1 font-medium">Data</th>
                <th className="py-1 font-medium">Séries (carga × reps)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {linhas.map((rs) => (
                <tr key={rs[0].sessaoId}>
                  <td className="py-1.5 pr-2 align-top whitespace-nowrap">{formatarData(rs[0].data)}</td>
                  <td className="py-1.5">
                    {rs.map((r) => `${r.carga === null ? '' : `${formatarKg(r.carga)}×`}${r.reps ?? '—'}${r.tipo === 'extra' ? '*' : ''}`).join('  ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Texto fraco>
          Carga em {ex.tipoCarga === 'porLado' ? 'kg por lado' : ex.tipoCarga === 'porHalter' ? 'kg por halter' : ex.tipoCarga === 'pesoCorpo' ? 'kg extra' : 'kg'}. * série extra.
        </Texto>
      </Cartao>

      {eventos.length > 0 && (
        <Cartao titulo="Aumentos e regressões">
          <ul className="space-y-1 text-sm">
            {[...eventos]
              .sort((a, b) => b.data.localeCompare(a.data))
              .map((ev) => (
                <li key={ev.id}>
                  <span className="text-slate-500 dark:text-slate-400">{formatarData(ev.data)}</span> · {textoEvento(ev, ex)}
                </li>
              ))}
          </ul>
        </Cartao>
      )}
    </Tela>
  )
}
