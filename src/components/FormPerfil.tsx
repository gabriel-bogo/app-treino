import { CampoTexto, Multipla, Opcoes } from './Campos'
import { Cartao, Texto } from './ui'
import {
  OPCOES_DIAS,
  OPCOES_DURACAO,
  OPCOES_ENFASE,
  OPCOES_LIMITACAO,
  OPCOES_N,
  OPCOES_NIVEL,
  OPCOES_OBJETIVO,
  OPCOES_SEXO,
  type ErrosPerfil,
  type RascunhoPerfil,
} from '../domain/perfil'
import { avaliarPeso, mensagensObjetivo } from '../domain/saude'

// Partes do formulário de perfil (§4), usadas no onboarding e na tela Perfil.

const CORES = { info: 'info', aviso: 'aviso', perigo: 'perigo' } as const

function Erro({ texto }: { texto?: string }) {
  return texto ? <p className="-mt-3 text-sm text-red-600 dark:text-red-400">{texto}</p> : null
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
  const msgs = avaliacao ? mensagensObjetivo(avaliacao, r.objetivo) : []
  return (
    <>
      <Opcoes rotulo="Nível" valor={r.nivel} opcoes={OPCOES_NIVEL} aoMudar={(v) => mudar({ nivel: v })} colunas={2} />
      <Erro texto={erros.nivel} />
      <Opcoes rotulo="Objetivo" valor={r.objetivo} opcoes={OPCOES_OBJETIVO} aoMudar={(v) => mudar({ objetivo: v })} />
      <Erro texto={erros.objetivo} />
      {msgs.map((m) => (
        <Cartao key={m.texto} destaque={CORES[m.tipo]}>
          <Texto>{m.texto}</Texto>
        </Cartao>
      ))}
      <Opcoes rotulo="Ênfase" ajuda="Onde você quer um pouco mais de volume." valor={r.enfase} opcoes={OPCOES_ENFASE} aoMudar={(v) => mudar({ enfase: v })} />
      <Erro texto={erros.enfase} />
      <Opcoes rotulo="Dias por semana" valor={r.diasSemana} opcoes={OPCOES_DIAS} aoMudar={(v) => mudar({ diasSemana: v })} colunas={5} />
      <Erro texto={erros.diasSemana} />
      <Opcoes rotulo="Duração de cada treino" valor={r.duracaoMin} opcoes={OPCOES_DURACAO} aoMudar={(v) => mudar({ duracaoMin: v })} colunas={3} />
      <Erro texto={erros.duracaoMin} />
    </>
  )
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
