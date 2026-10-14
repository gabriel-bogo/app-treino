import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/banco'
import { usePlano } from '../app/usePlano'
import { NOME_GRUPO, GRUPOS } from '../domain/biblioteca'
import { gerarPlano, volumeDoPlano } from '../domain/motor/gerar'
import { totalTreinosReadaptacao } from '../domain/motor/regras'
import { Cartao, Tela, Texto } from '../components/ui'
import { CartaoTreino, textoSequencia, treinosUnicos } from '../components/PlanoAgrupado'
import { TrocaNoPlano } from '../components/TrocaNoPlano'

// Plano da semana (§3 tela 3): todos os dias de treino gerados.
export function PlanoSemana() {
  const dados = usePlano()
  const perfil = useLiveQuery(() => db.perfil.get('perfil'))
  const [verVolume, setVerVolume] = useState(false)
  const [troca, setTroca] = useState<{ exercicioId: string; ids: string[] } | null>(null)
  if (!dados?.plano || !perfil) return <Tela titulo="Plano da semana">{null}</Tela>
  const { plano, dias, exercicios } = dados
  const readaptacao = plano.fase === 'readaptacao'
  const volume = volumeDoPlano(exercicios)
  const { alvos } = gerarPlano({ perfil, fase: 'normal', semanaReadaptacao: 0, nivelVolume: plano.nivelVolume, ajustes: new Map(), trocasNoPlano: {} })

  return (
    <Tela titulo="Plano da semana">
      <Cartao>
        <p className="text-lg font-bold">{plano.divisao}</p>
        {readaptacao ? (
          <Texto>
            Fase de readaptação: treino {Math.min(plano.treinosNaFase + 1, totalTreinosReadaptacao(perfil.diasSemana))} de{' '}
            {totalTreinosReadaptacao(perfil.diasSemana)}. Use cargas leves e termine cada série com 3 a 4 repetições sobrando. Depois
            os mesmos treinos passam para 3 a 4 séries de 8 a 12 repetições.
          </Texto>
        ) : (
          <Texto>Ciclo de 8 a 12 repetições. Termine cada série com 1 a 3 repetições sobrando.</Texto>
        )}
        <Texto fraco>Ordem dos treinos: {textoSequencia(dias)}. O próximo é sempre o seguinte da lista, não importa o dia da semana.</Texto>
      </Cartao>

      {plano.avisos.map((a) => (
        <Cartao key={a} destaque="aviso">
          <Texto>{a}</Texto>
        </Cartao>
      ))}

      {treinosUnicos(dias).map((d) => (
        <CartaoTreino
          key={d.id}
          treino={{ ...d, exercicios: exercicios.filter((e) => e.diaId === d.id).sort((x, y) => x.ordem - y.ordem) }}
          proximo={dias[plano.proximoIndice]?.variante === d.variante}
          aoTrocar={(exercicioId, ids) => setTroca({ exercicioId, ids })}
        />
      ))}

      {!readaptacao && (
        <Cartao titulo="Séries por semana">
          <button type="button" className="text-sm font-medium text-emerald-700 dark:text-emerald-400" onClick={() => setVerVolume((v) => !v)}>
            {verVolume ? 'Esconder' : 'Ver volume por grupo muscular'}
          </button>
          {verVolume && (
            <table className="mt-2 w-full text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
              <thead className="text-left text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-1 font-medium">Grupo</th>
                  <th className="py-1 text-right font-medium">Séries</th>
                  <th className="py-1 text-right font-medium">Alvo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {GRUPOS.map((g) => (
                  <tr key={g}>
                    <td className="py-1.5">{NOME_GRUPO[g]}</td>
                    <td className="py-1.5 text-right">{String(volume[g]).replace('.', ',')}</td>
                    <td className="py-1.5 text-right text-slate-500 dark:text-slate-400">{alvos[g]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <Texto fraco>Série de exercício que trabalha o grupo como secundário conta meia série.</Texto>
        </Cartao>
      )}
      <TrocaNoPlano alvo={troca} aoFechar={() => setTroca(null)} />
    </Tela>
  )
}
