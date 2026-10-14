import { useState } from 'react'
import { NOME_GRUPO } from '../domain/biblioteca'
import type { Grupo } from '../domain/tipos'
import { Botao } from './ui'
import { Dialogo } from './Dialogo'
import { Multipla } from './Campos'

// C11: escolher quais músculos um treino trabalha. O app remonta os exercícios.

const ORDEM: Grupo[] = ['peito', 'costas', 'ombros', 'biceps', 'triceps', 'quadriceps', 'posteriores', 'gluteos', 'panturrilha', 'core']

export function DialogoMusculos({
  treino,
  atuais,
  personalizado,
  aoSalvar,
  aoRestaurar,
  aoFechar,
}: {
  /** ex: "Treino A" */
  treino: string
  atuais: Grupo[]
  /** a pessoa já mudou os músculos de algum treino */
  personalizado: boolean
  aoSalvar: (grupos: Grupo[]) => void
  aoRestaurar: () => void
  aoFechar: () => void
}) {
  const [marcados, setMarcados] = useState<Grupo[]>(atuais)
  return (
    <Dialogo
      aberto
      titulo={`Músculos do ${treino}`}
      aoFechar={aoFechar}
      acoes={
        <>
          <Botao disabled={!marcados.length} onClick={() => aoSalvar(ORDEM.filter((g) => marcados.includes(g)))}>
            Salvar e remontar o treino
          </Botao>
          {personalizado && (
            <Botao variante="secundario" onClick={aoRestaurar}>
              Voltar à divisão sugerida pelo app
            </Botao>
          )}
          <Botao variante="fantasma" onClick={aoFechar}>
            Cancelar
          </Botao>
        </>
      }
    >
      <Multipla
        rotulo="Quais músculos este treino trabalha?"
        ajuda="Os exercícios são escolhidos de novo para esses músculos."
        valores={marcados}
        opcoes={ORDEM.map((g) => ({ valor: g, rotulo: NOME_GRUPO[g] }))}
        aoMudar={setMarcados}
      />
      {!marcados.length && <p className="text-sm text-red-600 dark:text-red-400">Marque pelo menos um músculo.</p>}
    </Dialogo>
  )
}
