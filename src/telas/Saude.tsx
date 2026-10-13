import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/banco'
import { apagarRegistroCorpo } from '../db/corpo'
import { dataLocal, formatarData, somarDias } from '../domain/datas'
import {
  NOME_CLASSE,
  NOME_RISCO,
  avaliarPeso,
  pesoTendencia,
  registrosDePeso,
  resumoVariacao,
  serieGrafico,
} from '../domain/saude'
import { Botao, Cartao, Tela, Texto } from '../components/ui'
import { RegistroPesoHoje } from '../components/RegistroPesoHoje'
import { GraficoPeso } from '../components/GraficoPeso'
import { BarraIMC } from '../components/BarraIMC'
import { Dialogo } from '../components/Dialogo'

const fmt = (n: number) => n.toFixed(1).replace('.', ',')
const fmtVar = (n: number | null) => (n === null ? '—' : n === 0 ? '0,0 kg' : `${n > 0 ? '+' : '−'}${fmt(Math.abs(n))} kg`)

const PERIODOS = [
  { dias: 30, rotulo: '30 dias' },
  { dias: 90, rotulo: '90 dias' },
  { dias: 0, rotulo: 'Tudo' },
] as const

// Tela de saúde (§10): registro diário, peso de tendência (média de 7 dias),
// gráfico, IMC, faixa de peso adequado e cintura.
export function Saude() {
  const hoje = dataLocal()
  const perfil = useLiveQuery(() => db.perfil.get('perfil'))
  const registros = useLiveQuery(() => db.registrosCorpo.orderBy('data').toArray())
  const [periodo, setPeriodo] = useState<number>(90)
  const [apagar, setApagar] = useState<string | null>(null)
  const [todos, setTodos] = useState(false)

  if (!perfil || !registros) return <Tela titulo="Saúde">{null}</Tela>

  const pesos = registrosDePeso(registros)
  const tendencia = pesoTendencia(pesos, hoje)
  const variacao = resumoVariacao(pesos, hoje)
  const serie = serieGrafico(pesos).filter((p) => periodo === 0 || p.data >= somarDias(hoje, -periodo))
  const ultimaCintura = [...registros].reverse().find((r) => r.cinturaCm !== undefined)
  const av = tendencia
    ? avaliarPeso({ pesoKg: tendencia.valor, alturaCm: perfil.alturaCm, nascimento: perfil.nascimento, sexo: perfil.sexo, hoje, cinturaCm: ultimaCintura?.cinturaCm })
    : null

  return (
    <Tela titulo="Saúde">
      <RegistroPesoHoje completo />

      {tendencia && (
        <Cartao>
          <p className="text-sm text-slate-500 dark:text-slate-400">Peso de tendência</p>
          <p className="text-5xl font-bold">
            {fmt(tendencia.valor)}
            <span className="ml-1 text-2xl font-semibold text-slate-500 dark:text-slate-400">kg</span>
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {tendencia.fonte === 'media7' ? 'Média dos registros dos últimos 7 dias.' : 'Último registro (nenhum nos últimos 7 dias).'}
          </p>
          <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[
              ['Última semana', variacao.semana],
              ['4 semanas', variacao.quatroSemanas],
              ['Desde o início', variacao.desdeInicio],
            ].map(([rotulo, valor]) => (
              <div key={rotulo as string} className="rounded-xl bg-slate-50 p-2 dark:bg-slate-800/60">
                <dt className="text-xs text-slate-500 dark:text-slate-400">{rotulo}</dt>
                <dd className="font-semibold">{fmtVar(valor as number | null)}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            O peso oscila 1 a 2 kg de um dia para o outro (água, sal, intestino). Por isso o app compara médias, nunca um dia com o outro.
          </p>
        </Cartao>
      )}

      <Cartao titulo="Evolução">
        <div className="mb-3 flex gap-2" role="radiogroup" aria-label="Período do gráfico">
          {PERIODOS.map((p) => (
            <button
              key={p.dias}
              type="button"
              role="radio"
              aria-checked={periodo === p.dias}
              onClick={() => setPeriodo(p.dias)}
              className={`min-h-10 rounded-full px-4 text-sm font-medium ${
                periodo === p.dias ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {p.rotulo}
            </button>
          ))}
        </div>
        {serie.length >= 2 ? <GraficoPeso pontos={serie} /> : <Texto fraco>Registre o peso em mais dias para ver o gráfico.</Texto>}
      </Cartao>

      {av && (
        <Cartao titulo="Classificação">
          {av.faixa === 'menor' ? (
            <Texto>
              IMC {fmt(av.imc)}. Para menores de 18 anos o IMC depende de curvas por idade, então o app não classifica. Recomendamos
              avaliação com um profissional.
            </Texto>
          ) : (
            <>
              <p className="text-2xl font-bold">{NOME_CLASSE[av.classe]}</p>
              <p className="text-slate-600 dark:text-slate-300">
                IMC {fmt(av.imc)}
                {av.faixa === 'idoso' && ' · faixas para 60 anos ou mais'}
              </p>
              <BarraIMC imc={av.imc} faixa={av.faixa} />
              {av.faixaPeso && (
                <p className="mt-3 text-slate-700 dark:text-slate-300">
                  Para {(perfil.alturaCm / 100).toFixed(2).replace('.', ',')} m: {fmt(av.faixaPeso.min)} a {fmt(av.faixaPeso.max)} kg.
                  {av.distancia !== null && av.distancia !== 0 && (
                    <> Faltam {fmt(Math.abs(av.distancia))} kg para entrar na faixa.</>
                  )}
                  {av.distancia === 0 && <> Você está dentro da faixa.</>}
                </p>
              )}
            </>
          )}
          {av.cintura && (
            <div className="mt-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
              <p className="text-sm text-slate-500 dark:text-slate-400">Cintura ({formatarData(ultimaCintura!.data)})</p>
              <p className="font-semibold">
                {fmt(av.cintura.cm)} cm · {NOME_RISCO[av.cintura.risco]}
              </p>
            </div>
          )}
          {av.provavelMassaMuscular && (
            <Cartao destaque="info" className="mt-3">
              <Texto>Provável massa muscular: o IMC pode estar superestimando.</Texto>
            </Cartao>
          )}
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            IMC é uma estimativa. Não diferencia músculo de gordura: pessoas musculosas podem aparecer como sobrepeso. A cintura ajuda a
            complementar.
          </p>
        </Cartao>
      )}

      <Cartao titulo="Registros">
        {registros.length === 0 ? (
          <Texto fraco>Nenhum registro ainda.</Texto>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-1 font-medium">Data</th>
                <th className="py-1 text-right font-medium">Peso</th>
                <th className="py-1 text-right font-medium">Cintura</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {[...registros].reverse().slice(0, todos ? undefined : 14).map((r) => (
                <tr key={r.data}>
                  <td className="py-2">
                    {formatarData(r.data)}
                    {r.observacao && <span className="block text-xs text-slate-500 dark:text-slate-400">{r.observacao}</span>}
                  </td>
                  <td className="py-2 text-right">{r.pesoKg !== undefined ? `${fmt(r.pesoKg)} kg` : '—'}</td>
                  <td className="py-2 text-right">{r.cinturaCm !== undefined ? `${fmt(r.cinturaCm)} cm` : '—'}</td>
                  <td className="py-2 text-right">
                    <button type="button" onClick={() => setApagar(r.data)} className="h-10 w-10 rounded-lg text-slate-400 active:bg-slate-100 dark:active:bg-slate-800" aria-label={`Apagar registro de ${formatarData(r.data)}`}>
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!todos && registros.length > 14 && (
          <Botao variante="fantasma" className="mt-2 w-full" onClick={() => setTodos(true)}>
            Ver todos os {registros.length} registros
          </Botao>
        )}
      </Cartao>

      <Dialogo
        aberto={!!apagar}
        titulo="Apagar este registro?"
        aoFechar={() => setApagar(null)}
        acoes={
          <>
            <Botao
              variante="perigo"
              onClick={async () => {
                await apagarRegistroCorpo(apagar!)
                setApagar(null)
              }}
            >
              Apagar
            </Botao>
            <Botao variante="secundario" onClick={() => setApagar(null)}>
              Cancelar
            </Botao>
          </>
        }
      >
        {apagar && <p>Registro de {formatarData(apagar)}.</p>}
      </Dialogo>
    </Tela>
  )
}
