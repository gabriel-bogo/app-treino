import { CampoTexto, Deslizante, Multipla, Opcoes } from './Campos'
import { Cartao, Texto } from './ui'
import {
  DURACAO,
  OPCOES_DIAS,
  OPCOES_ENFASE,
  OPCOES_LIMITACAO,
  OPCOES_N,
  OPCOES_NIVEL,
  OPCOES_OBJETIVO,
  OPCOES_SEXO,
  avisoEnfases,
  opcoesTreinos,
  treinosRecomendados,
  textoDuracao,
  type ErrosPerfil,
  type RascunhoPerfil,
} from '../domain/perfil'
import { alertasObjetivo, avaliarPeso, mensagensClassificacao, objetivosRecomendados, type MensagemObjetivo } from '../domain/saude'

// Partes do formulário de perfil (§4), usadas no onboarding e na tela Perfil.

const CORES = { info: 'info', aviso: 'aviso', perigo: 'perigo' } as const

function Erro({ texto }: { texto?: string }) {
  return texto ? <p className="-mt-3 text-sm text-red-600 dark:text-red-400">{texto}</p> : null
}

/** Mensagem do IMC; a classificação (C7) fica em negrito e, fora da faixa adequada, num bloco vermelho. */
function Mensagem({ m, forte }: { m: MensagemObjetivo; forte?: boolean }) {
  const partes = m.destaque ? m.texto.split(m.destaque) : [m.texto]
  const conteudo = partes.flatMap((p, i) => (i === 0 ? [p] : [<strong key={i}>{m.destaque}</strong>, p]))
  if (forte && m.tipo === 'perigo') {
    return (
      <section className="rounded-2xl bg-red-600 p-4 text-white dark:bg-red-700" data-testid="mensagem-imc">
        <p className="leading-relaxed">{conteudo}</p>
      </section>
    )
  }
  return (
    <Cartao destaque={CORES[m.tipo]}>
      <Texto>{conteudo}</Texto>
    </Cartao>
  )
}

export function CamposPessoais({
  r,
  mudar,
  textos,
  setTextos,
  erros,
  hoje,
}: {
  r: RascunhoPerfil
  mudar: (m: RascunhoPerfil) => void
  textos: { altura: string; peso: string }
  setTextos: (t: { altura: string; peso: string }) => void
  erros: ErrosPerfil
  hoje: string
}) {
  return (
    <>
      <CampoTexto rotulo="Nome ou apelido" value={r.nome ?? ''} onChange={(e) => mudar({ nome: e.target.value })} autoComplete="off" erro={erros.nome} />
      <Opcoes rotulo="Sexo" ajuda="Usado só em ajustes finos de descanso e volume. Não define a ênfase do treino." valor={r.sexo} opcoes={OPCOES_SEXO} aoMudar={(v) => mudar({ sexo: v })} />
      <Erro texto={erros.sexo} />
      <CampoTexto rotulo="Data de nascimento" type="date" max={hoje} value={r.nascimento ?? ''} onChange={(e) => mudar({ nascimento: e.target.value })} erro={erros.nascimento} />
      <div className="grid grid-cols-2 gap-3">
        <CampoTexto rotulo="Altura (cm)" inputMode="numeric" placeholder="170" value={textos.altura} onChange={(e) => setTextos({ ...textos, altura: e.target.value })} erro={erros.alturaCm} />
        <CampoTexto rotulo="Peso (kg)" inputMode="decimal" placeholder="70,5" value={textos.peso} onChange={(e) => setTextos({ ...textos, peso: e.target.value })} erro={erros.pesoInicialKg} />
      </div>
    </>
  )
}

export function CamposTreino({ r, mudar, erros, hoje }: { r: RascunhoPerfil; mudar: (m: RascunhoPerfil) => void; erros: ErrosPerfil; hoje: string }) {
  const avaliacao =
    r.pesoInicialKg && r.alturaCm && r.nascimento && r.sexo
      ? avaliarPeso({ pesoKg: r.pesoInicialKg, alturaCm: r.alturaCm, nascimento: r.nascimento, sexo: r.sexo, hoje })
      : null
  const enfases = r.enfases ?? []
  const aviso = avisoEnfases(enfases)
  return (
    <>
      <Opcoes rotulo="Nível" valor={r.nivel} opcoes={OPCOES_NIVEL} aoMudar={(v) => mudar({ nivel: v })} colunas={2} />
      <Erro texto={erros.nivel} />
      {/* C7: o contexto do IMC vem antes das opções de objetivo */}
      {avaliacao && mensagensClassificacao(avaliacao).map((m) => <Mensagem key={m.texto} m={m} forte />)}
      <Multipla
        rotulo="Objetivo"
        ajuda="Pode marcar mais de um."
        valores={r.objetivos ?? []}
        opcoes={OPCOES_OBJETIVO}
        recomendados={avaliacao ? objetivosRecomendados(avaliacao) : []}
        aoMudar={(v) => mudar({ objetivos: v })}
      />
      <Erro texto={erros.objetivos} />
      {avaliacao && alertasObjetivo(avaliacao, r.objetivos).map((m) => <Mensagem key={m.texto} m={m} />)}
      <Multipla
        rotulo="Ênfase (opcional)"
        ajuda="Onde você quer um pouco mais de volume. Sem nada marcado, o treino é equilibrado."
        valores={enfases}
        opcoes={OPCOES_ENFASE}
        aoMudar={(v) => mudar({ enfases: v })}
      />
      {aviso && (
        <Cartao destaque="info">
          <Texto>{aviso}</Texto>
        </Cartao>
      )}
      <Opcoes
        rotulo="Dias por semana"
        valor={r.diasSemana}
        opcoes={OPCOES_DIAS}
        // C10: ao mudar os dias, o número de treinos vai para a sugestão
        aoMudar={(v) => mudar({ diasSemana: v, treinos: treinosRecomendados(v) })}
        colunas={5}
      />
      <Erro texto={erros.diasSemana} />
      {r.diasSemana && (
        <>
          <Opcoes
            rotulo="Quantos treinos diferentes?"
            ajuda={`Os treinos se revezam nos dias. Ex: ${r.diasSemana} dias com ${r.treinos ?? treinosRecomendados(r.diasSemana)} treinos = ${sequenciaExemplo(r.diasSemana, r.treinos ?? treinosRecomendados(r.diasSemana))}…`}
            valor={r.treinos}
            opcoes={opcoesTreinos(r.diasSemana).map((o) => ({ ...o, rotulo: `${o.valor} treinos`, descricao: o.rotulo }))}
            recomendado={treinosRecomendados(r.diasSemana)}
            aoMudar={(v) => mudar({ treinos: v })}
            colunas={2}
          />
          <Erro texto={erros.treinos} />
        </>
      )}
      <Deslizante
        rotulo="Duração de cada treino"
        ajuda="Inclui uns 8 minutos de aquecimento."
        valor={r.duracaoMin ?? DURACAO.padrao}
        min={DURACAO.min}
        max={DURACAO.max}
        passo={DURACAO.passo}
        formatar={textoDuracao}
        aoMudar={(v) => mudar({ duracaoMin: v })}
      />
      <Erro texto={erros.duracaoMin} />
    </>
  )
}

/** 5 dias, 3 treinos → "A, B, C, A, B" */
function sequenciaExemplo(dias: number, treinos: number): string {
  return Array.from({ length: dias }, (_, i) => String.fromCharCode(65 + (i % treinos))).join(', ')
}

export function CamposLimitacoes({ r, mudar }: { r: RascunhoPerfil; mudar: (m: RascunhoPerfil) => void }) {
  return (
    <>
      <Multipla
        rotulo="Limitações"
        ajuda="Marque só se tiver. Dá para mudar a qualquer momento no perfil."
        valores={r.limitacoes ?? []}
        opcoes={OPCOES_LIMITACAO}
        aoMudar={(v) => mudar({ limitacoes: v })}
        rotuloNenhuma="Nenhuma"
      />
      <Cartao destaque="info">
        <Texto>Confirme com seu fisioterapeuta quais exercícios evitar.</Texto>
        <Texto fraco>Você também pode marcar qualquer exercício como &quot;evitar&quot; na biblioteca.</Texto>
      </Cartao>
    </>
  )
}

export function CampoN({ r, mudar }: { r: RascunhoPerfil; mudar: (m: RascunhoPerfil) => void }) {
  return (
    <Opcoes
      rotulo="Treinos para confirmar cada avanço"
      ajuda="Quantas vezes você precisa bater a meta antes de o app subir repetições ou carga."
      valor={r.nConfirmacoes}
      opcoes={OPCOES_N}
      aoMudar={(v) => mudar({ nConfirmacoes: v })}
      colunas={3}
    />
  )
}
