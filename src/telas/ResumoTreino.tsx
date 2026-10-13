import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/banco'
import { dispensarOferta, escolherCargaExtra, trocarExercicioNoPlano } from '../db/progressao'
import { mapaAjustes, exercicioPermitido } from '../domain/biblioteca'
import { navegar } from '../app/rotas'
import { exercicioPorId } from '../domain/biblioteca'
import { formatarDuracao } from '../domain/datas'
import { descreverCarga } from '../domain/progressao/carga'
import type { EstadoProgressao, EventoProgressao, Exercicio } from '../domain/tipos'
import { Botao, Cartao, Tela, Texto } from '../components/ui'

function textoEvento(ev: EventoProgressao, ex: Exercicio): string {
  const carga = (c: number | null) => (c === null ? '' : descreverCarga(ex, c))
  switch (ev.tipo) {
    case 'aumento_reps':
      return `Meta confirmada! Próximo alvo: ${ev.para.alvo} reps.`
    case 'aumento_carga':
      return ex.assistido ? `Menos ajuda no próximo: ${carga(ev.para.carga)}, alvo ${ev.para.alvo} reps.` : `Carga sobe para ${carga(ev.para.carga)}, alvo volta a ${ev.para.alvo} reps.`
    case 'regressao':
      return `Hoje foi difícil: o próximo volta para ${ev.para.alvo} reps${ev.para.carga !== ev.de.carga && ev.para.carga !== null ? ` com ${carga(ev.para.carga)}` : ''}, para consolidar.`
    case 'carga_nova':
      return `Carga nova registrada: ${carga(ev.para.carga)}. O ciclo recomeça em ${ev.para.alvo} reps.`
    case 'inicio':
      return ev.para.carga !== null ? `Carga inicial registrada: ${carga(ev.para.carga)}.` : `Primeiro registro: alvo de ${ev.para.alvo} reps.`
    case 'retorno_pausa':
      return 'Carga ajustada pelo retorno após pausa.'
  }
}

function proximoAlvo(e: EstadoProgressao | undefined, ex: Exercicio): string | null {
  if (!e || e.alvo === null) return null
  if (e.modo === 'reps') return `${e.alvo} reps`
  return e.carga === null ? `${e.alvo} reps` : `${e.alvo} reps com ${descreverCarga(ex, e.carga)}`
}

// Resumo depois de finalizar: o que foi feito e o que muda no próximo treino.
export function ResumoTreino({ id }: { id: string }) {
  const sessao = useLiveQuery(() => db.sessoes.get(id), [id])
  const eventos = useLiveQuery(() => db.eventosProgressao.filter((e) => e.sessaoId === id).toArray(), [id])
  const estados = useLiveQuery(() => db.progressao.toArray())
  const perfil = useLiveQuery(() => db.perfil.get('perfil'))
  const ajustes = mapaAjustes(useLiveQuery(() => db.ajustesExercicio.toArray()))
  if (!sessao || !eventos || !estados || !perfil) return <Tela titulo="Resumo">{null}</Tela>
  const permitido = (id: string | undefined) => {
    const x = id ? exercicioPorId(id) : undefined
    return x && exercicioPermitido(x, perfil.limitacoes, ajustes) ? x : undefined
  }
  const trabalho = sessao.estado.itens.filter((i) => i.papel === 'trabalho')
  const series = trabalho.reduce((s, i) => s + i.series.filter((x) => x.feita && x.tipo !== 'aproximacao').length, 0)
  return (
    <Tela titulo="Treino concluído">
      <Cartao destaque="sucesso">
        <p className="text-2xl font-bold">{sessao.nomeDia}</p>
        <Texto>
          {formatarDuracao(sessao.duracaoSeg ?? 0)} · {series} séries · {trabalho.filter((i) => i.status === 'concluido').length} de {trabalho.length} exercícios
        </Texto>
      </Cartao>
      <Cartao titulo="Próximo treino de cada exercício">
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {trabalho.map((i) => {
            const ex = exercicioPorId(i.exercicioId)
            if (!ex) return null
            const evs = eventos.filter((e) => e.exercicioId === ex.id)
            const estado = estados.find((e) => e.exercicioId === ex.id)
            const prox = proximoAlvo(estado, ex)
            return (
              <li key={i.uid} className="py-2">
                <p className="font-medium">{ex.nome}</p>
                {evs.map((ev) => (
                  <p key={ev.id} className="text-sm text-slate-700 dark:text-slate-300">
                    {textoEvento(ev, ex)}
                  </p>
                ))}
                {!evs.length && i.series.some((s) => s.feita) && prox && <p className="text-sm text-slate-500 dark:text-slate-400">Repete a meta: {prox}.</p>}
                {!i.series.some((s) => s.feita) && <p className="text-sm text-slate-500 dark:text-slate-400">Não foi feito hoje.</p>}
                {estado?.sugerirAssistida && (() => {
                  const assistida = ex.versaoAssistida?.map(permitido).find(Boolean)
                  if (!assistida) return null
                  return (
                    <div className="mt-2 rounded-xl bg-sky-50 p-3 dark:bg-sky-950/30">
                      <p className="text-sm">Abaixo de 5 repetições, a versão assistida ajuda a progredir: {assistida.nome}.</p>
                      <div className="mt-2 flex gap-2">
                        <Botao className="min-h-10 flex-1 text-sm" onClick={() => trocarExercicioNoPlano(ex.id, assistida.id)}>
                          Usar no plano
                        </Botao>
                        <Botao variante="secundario" className="min-h-10 flex-1 text-sm" onClick={() => dispensarOferta(ex.id)}>
                          Continuar assim
                        </Botao>
                      </div>
                    </div>
                  )
                })()}
                {estado?.noTeto && (() => {
                  const dificil = permitido(ex.variacaoMaisDificil)
                  return (
                    <div className="mt-2 rounded-xl bg-sky-50 p-3 dark:bg-sky-950/30">
                      <p className="text-sm">
                        {ex.assistido
                          ? 'Você não precisa mais de ajuda na máquina!'
                          : `Você chegou ao teto de ${ex.tetoReps ?? 12} repetições.`}{' '}
                        Como quer continuar?
                      </p>
                      <div className="mt-2 flex flex-col gap-2">
                        {!ex.assistido && ex.tipoCarga === 'pesoCorpo' && (
                          <Botao className="min-h-10 text-sm" onClick={() => escolherCargaExtra(ex.id)}>
                            Adicionar carga (cinto, colete ou halter)
                          </Botao>
                        )}
                        {dificil && (
                          <Botao variante="secundario" className="min-h-10 text-sm" onClick={() => trocarExercicioNoPlano(ex.id, dificil.id)}>
                            Passar para {dificil.nome}
                          </Botao>
                        )}
                        <Botao variante="fantasma" className="min-h-10 text-sm" onClick={() => dispensarOferta(ex.id)}>
                          Decidir depois
                        </Botao>
                      </div>
                    </div>
                  )
                })()}
              </li>
            )
          })}
        </ul>
      </Cartao>
      <Botao grande onClick={() => navegar('/', { substituir: true })}>
        Voltar ao início
      </Botao>
    </Tela>
  )
}
