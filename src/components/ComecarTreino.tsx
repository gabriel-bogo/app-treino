import { useState } from 'react'
import { db } from '../db/banco'
import { iniciarSessao } from '../db/sessao'
import { aplicarPausaNosExercicios, pausaPendente } from '../db/progressao'
import { garantirPlano } from '../db/plano'
import { navegar } from '../app/rotas'
import type { RegraPausa } from '../domain/progressao/pausa'
import { Botao } from './ui'
import { Dialogo } from './Dialogo'

// Botão "Começar treino" (§3). Antes de começar, verifica o retorno após
// pausa (§6.12): mostra o card explicando o ajuste e, com mais de 60 dias,
// pergunta se quer refazer a readaptação.
export function ComecarTreino() {
  const [iniciando, setIniciando] = useState(false)
  const [pausa, setPausa] = useState<(RegraPausa & { ultimaSessaoId: string }) | null>(null)

  async function comecar(regra?: RegraPausa & { ultimaSessaoId: string }) {
    setIniciando(true)
    try {
      const perfil = await db.perfil.get('perfil')
      if (regra && perfil) await aplicarPausaNosExercicios(regra, perfil)
      await iniciarSessao(new Date(), regra ? { dias: regra.dias, fator: regra.fator, alvoOito: regra.alvoOito, texto: regra.texto } : undefined)
      navegar('/treino')
    } finally {
      setIniciando(false)
      setPausa(null)
    }
  }

  async function refazerReadaptacao(regra: RegraPausa & { ultimaSessaoId: string }) {
    setIniciando(true)
    const plano = await db.plano.get('atual')
    const config = await db.configuracoes.get('app')
    if (plano) {
      await db.plano.put({
        ...plano,
        fase: 'readaptacao',
        inicioFase: new Date().toISOString(),
        treinosNaFase: 0,
        proximoIndice: 0,
        mensagemFase: null,
      })
    }
    if (config) await db.configuracoes.put({ ...config, pausaAplicadaApos: regra.ultimaSessaoId })
    await garantirPlano()
    await iniciarSessao()
    setIniciando(false)
    setPausa(null)
    navegar('/treino')
  }

  return (
    <>
      <Botao
        grande
        className="mt-4 w-full"
        disabled={iniciando}
        onClick={async () => {
          const regra = await pausaPendente()
          if (regra) setPausa(regra)
          else await comecar()
        }}
      >
        Começar treino
      </Botao>
      <Dialogo
        aberto={!!pausa}
        titulo="Retorno após pausa"
        aoFechar={() => setPausa(null)}
        acoes={
          pausa?.perguntarReadaptacao ? (
            <>
              <Botao onClick={() => refazerReadaptacao(pausa)} disabled={iniciando}>
                Refazer a readaptação
              </Botao>
              <Botao variante="secundario" onClick={() => comecar(pausa)} disabled={iniciando}>
                Não, só reduzir as cargas
              </Botao>
            </>
          ) : (
            <>
              <Botao onClick={() => comecar(pausa!)} disabled={iniciando}>
                Começar treino
              </Botao>
              <Botao variante="secundario" onClick={() => setPausa(null)}>
                Agora não
              </Botao>
            </>
          )
        }
      >
        {pausa && <p>{pausa.texto}</p>}
        {pausa?.perguntarReadaptacao && (
          <p>Como foram mais de 60 dias, você pode refazer a fase de readaptação (3 semanas de treinos mais leves, 12 a 15 repetições).</p>
        )}
        <p className="text-sm text-slate-500 dark:text-slate-400">Depois disso a progressão segue normal a partir das cargas reduzidas.</p>
      </Dialogo>
    </>
  )
}
