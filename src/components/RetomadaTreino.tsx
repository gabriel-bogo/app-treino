import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { HORAS_SESSAO_LONGA, finalizarSessao, sessaoEmAndamento } from '../db/sessao'
import { navegar } from '../app/rotas'
import { exercicioPorId } from '../domain/biblioteca'
import { contadorSeries, itemAtual, restanteTimer } from '../domain/treino/sessao'
import { formatarDuracao } from '../domain/datas'
import { Botao } from './ui'
import { Dialogo } from './Dialogo'

// §3: se o app fechar no meio do treino, ao abrir de novo pergunta
// "Continuar treino em andamento?" mostrando o ponto exato e o timer.
// Aberta há mais de 4 h: pergunta se quer finalizar com o que foi registrado.
let perguntouNestaAbertura = false

export function RetomadaTreino({ naTelaDeTreino }: { naTelaDeTreino: boolean }) {
  const sessao = useLiveQuery(async () => (await sessaoEmAndamento()) ?? null)
  const [fechado, setFechado] = useState(perguntouNestaAbertura)
  // quem já está na tela de treino não precisa da pergunta ao voltar ao início
  useEffect(() => {
    if (naTelaDeTreino) {
      perguntouNestaAbertura = true
      setFechado(true)
    }
  }, [naTelaDeTreino])
  if (!sessao || fechado || naTelaDeTreino) return null
  const agora = new Date()
  const horas = (agora.getTime() - new Date(sessao.inicio).getTime()) / 3600000
  const longa = horas > HORAS_SESSAO_LONGA
  const atual = itemAtual(sessao.estado)
  const ex = atual ? exercicioPorId(atual.exercicioId) : undefined
  const c = atual ? contadorSeries(atual) : null
  const restante = sessao.estado.timer ? restanteTimer(sessao.estado.timer, agora) : null
  const fechar = () => {
    perguntouNestaAbertura = true
    setFechado(true)
  }
  return (
    <Dialogo
      aberto
      titulo={longa ? 'Treino aberto há mais de 4 horas' : 'Continuar treino em andamento?'}
      aoFechar={fechar}
      acoes={
        longa ? (
          <>
            <Botao
              onClick={async () => {
                fechar()
                const r = await finalizarSessao(sessao.id)
                navegar(r.status === 'concluida' ? `/treino/resumo/${sessao.id}` : '/')
              }}
            >
              Finalizar com o que foi registrado
            </Botao>
            <Botao
              variante="secundario"
              onClick={() => {
                fechar()
                navegar('/treino')
              }}
            >
              Continuar treinando
            </Botao>
          </>
        ) : (
          <>
            <Botao
              onClick={() => {
                fechar()
                navegar('/treino')
              }}
            >
              Continuar treino
            </Botao>
            <Botao variante="secundario" onClick={fechar}>
              Agora não
            </Botao>
          </>
        )
      }
    >
      <p className="font-medium">{sessao.nomeDia}</p>
      {ex && c && (
        <p>
          Parou em: {ex.nome}, série {Math.min(c.feitas + 1, c.total)} de {c.total}.
        </p>
      )}
      {restante !== null && <p>{restante > 0 ? `Descanso: faltam ${formatarDuracao(restante)}.` : 'O descanso já terminou.'}</p>}
      {longa && <p>Se você já terminou, finalize para salvar o que foi feito.</p>}
    </Dialogo>
  )
}
