import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/banco'
import { usePlano } from '../app/usePlano'
import { navegar } from '../app/rotas'
import { mapaAjustes } from '../domain/biblioteca'
import { gerarPlano } from '../domain/motor/gerar'
import { totalTreinosReadaptacao } from '../domain/motor/regras'
import { Botao, Cartao, Tela, Texto } from '../components/ui'
import { CartaoTreino, textoSequencia, treinosUnicos, type TreinoVisivel } from '../components/PlanoAgrupado'
import { TrocaNoPlano } from '../components/TrocaNoPlano'
import { useMusculosNoPlano } from '../components/MusculosNoPlano'
import { useIncluirNoPlano } from '../components/IncluirNoPlano'
import { desfazerExclusao, excluirDoPlano, removerDoPlano } from '../db/plano'
import { letraDoTreino } from '../components/PlanoAgrupado'

// C5: depois do onboarding, o app apresenta o programa de treino montado
// (Treino A, Treino B…, agrupado por músculo) para a pessoa aprovar, trocar
// exercícios ou voltar e mudar as escolhas.

export function PropostaPlano() {
  const dados = usePlano()
  const perfil = useLiveQuery(() => db.perfil.get('perfil'))
  const ajustes = useLiveQuery(() => db.ajustesExercicio.toArray())
  const config = useLiveQuery(() => db.configuracoes.get('app'))
  const [verDepois, setVerDepois] = useState(false)
  const [troca, setTroca] = useState<{ exercicioId: string; ids: string[] } | null>(null)
  const musculos = useMusculosNoPlano(dados?.dias, dados?.exercicios)
  const incluir = useIncluirNoPlano()
  const configPlano = useLiveQuery(() => db.configuracoes.get('app'))

  if (!dados?.plano || !perfil || !dados.dias.length) {
    return (
      <Tela titulo="Seu plano de treino">
        <Texto fraco>Montando seu plano…</Texto>
      </Tela>
    )
  }

  const { plano, dias, exercicios } = dados
  const treinos: TreinoVisivel[] = treinosUnicos(dias).map((d) => ({
    variante: d.variante,
    nome: d.nome,
    minutosEstimados: d.minutosEstimados,
    exercicios: exercicios.filter((e) => e.diaId === d.id).sort((a, b) => a.ordem - b.ordem),
  }))
  const aoTrocar = (exercicioId: string, ids: string[]) => setTroca({ exercicioId, ids })

  const readaptacao = plano.fase === 'readaptacao'
  const porNivel = perfil.nivel === 'iniciante' || perfil.nivel === 'retornando'
  const total = totalTreinosReadaptacao(perfil.diasSemana)
  const depois =
    readaptacao && verDepois
      ? gerarPlano({
          perfil,
          fase: 'normal',
          semanaReadaptacao: 0,
          nivelVolume: {},
          ajustes: mapaAjustes(ajustes),
          trocasNoPlano: config?.trocasNoPlano ?? {},
        })
      : null

  return (
    <Tela titulo="Seu plano de treino">
      <Texto>
        Este é o programa que o app montou para você. Toque em <strong>Trocar</strong> para mudar um exercício, em <strong>Mudar músculos</strong> para escolher o que cada treino trabalha ou em{' '}
        <strong>Mudar minhas escolhas</strong> para ajustar dias, duração, objetivo ou ênfase.
      </Texto>

      {readaptacao ? (
        <Cartao titulo="Primeiro: 3 semanas de readaptação" destaque="info">
          <div className="flex flex-col gap-2">
            <p className="text-lg font-bold">{plano.divisao}</p>
            <Texto>
              {porNivel
                ? `Como você marcou nível ${perfil.nivel === 'iniciante' ? 'iniciante' : 'retornando'}, os primeiros ${total} treinos são mais leves: 2 a 3 séries de 12 a 15 repetições, para o corpo se acostumar.`
                : `Pelo IMC, os primeiros ${total} treinos são mais leves: 2 a 3 séries de 12 a 15 repetições.`}
            </Texto>
            <Texto>Os treinos e exercícios são os mesmos de depois. Depois da readaptação sobem para 3 a 4 séries de 8 a 12 repetições.</Texto>
            {porNivel && <Texto fraco>Já treina com regularidade? Toque em &quot;Mudar minhas escolhas&quot; e marque nível intermediário.</Texto>}
            <Botao variante="secundario" onClick={() => setVerDepois((v) => !v)}>
              {verDepois ? 'Esconder o plano de depois' : 'Ver como fica depois da readaptação'}
            </Botao>
          </div>
        </Cartao>
      ) : (
        <Cartao>
          <p className="text-lg font-bold">{plano.divisao}</p>
          <Texto fraco>Ciclo de 8 a 12 repetições. Termine cada série com 1 a 3 repetições sobrando.</Texto>
        </Cartao>
      )}

      {plano.avisos.map((a) => (
        <Cartao key={a} destaque="aviso">
          <Texto>{a}</Texto>
        </Cartao>
      ))}

      <Texto fraco>
        Ordem dos treinos: {textoSequencia(dias)}. O próximo é sempre o seguinte da lista, não importa o dia da semana.
      </Texto>

      {treinos.map((t) => (
        <CartaoTreino
          key={t.variante}
          treino={t}
          aoTrocar={aoTrocar}
          aoMudarMusculos={() => musculos.abrir(t.variante)}
          aoIncluir={(grupo, ids) => incluir.abrir({ variante: t.variante, treino: `Treino ${letraDoTreino(t.nome)}`, grupo, ids, minutos: t.minutosEstimados })}
          aoRemover={(id) => void removerDoPlano(t.variante, id)}
          aoExcluir={(id) => void excluirDoPlano(t.variante, id)}
          excluidos={(configPlano?.excluidosNoPlano ?? []).filter((x) => x.variante === t.variante).map((x) => x.exercicioId)}
          aoDesfazerExclusao={(id) => void desfazerExclusao(t.variante, id)}
        />
      ))}

      {depois && (
        <>
          <h2 className="mt-2 text-xl font-bold">Depois da readaptação</h2>
          <Texto fraco>
            {depois.divisao}. Ordem: {textoSequencia(depois.dias)}. As trocas que você fizer valem aqui também.
          </Texto>
          {treinosUnicos(depois.dias).map((d) => (
            <CartaoTreino key={d.variante} treino={d} aoTrocar={aoTrocar} />
          ))}
        </>
      )}

      <div className="mt-2 flex flex-col gap-2">
        <Botao grande onClick={() => navegar('/', { substituir: true })}>
          Aprovar plano
        </Botao>
        <Botao variante="secundario" onClick={() => navegar('/perfil/proposta')}>
          Mudar minhas escolhas
        </Botao>
        <Texto fraco>Depois você encontra o plano na aba Plano e pode trocar exercícios por lá também.</Texto>
      </div>

      <TrocaNoPlano alvo={troca} aoFechar={() => setTroca(null)} />
      {musculos.dialogo}
      {incluir.dialogo}
    </Tela>
  )
}
