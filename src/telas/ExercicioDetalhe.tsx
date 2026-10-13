import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/banco'
import { salvarAjuste } from '../db/ajustes'
import { NOME_GRUPO, NOME_LIMITACAO, PESO_BARRA_PADRAO, ROTULO_CARGA, exercicioPorId } from '../domain/biblioteca'
import { Cartao, Etiqueta, Tela, Texto } from '../components/ui'
import { ComoFazer } from '../components/ComoFazer'
import { Interruptor } from '../components/Interruptor'
import { CampoNumero } from '../components/CampoNumero'

export function ExercicioDetalhe({ id }: { id: string }) {
  const ex = exercicioPorId(id)
  const ajuste = useLiveQuery(() => db.ajustesExercicio.get(id), [id])
  if (!ex) {
    return (
      <Tela titulo="Exercício" voltarPara="/biblioteca">
        <Texto>Exercício não encontrado.</Texto>
      </Tela>
    )
  }
  const incremento = ajuste?.incrementoCarga ?? ex.incrementoCarga
  return (
    <Tela titulo={ex.nome} voltarPara="/biblioteca">
      <div className="flex flex-wrap gap-1">
        <Etiqueta cor="marca">{NOME_GRUPO[ex.grupo]}</Etiqueta>
        {ex.contraindicacoes.map((c) => (
          <Etiqueta key={c.limitacao} cor={c.nivel === 'forte' ? 'perigo' : 'aviso'}>
            {NOME_LIMITACAO[c.limitacao]}: {c.nivel === 'forte' ? 'evitar' : 'cuidado'}
          </Etiqueta>
        ))}
      </div>
      <Cartao>
        <ComoFazer ex={ex} />
      </Cartao>

      <Cartao titulo="Na minha academia">
        <Interruptor
          rotulo="Indisponível"
          descricao="Minha academia não tem este equipamento"
          ligado={!!ajuste?.indisponivel}
          aoMudar={(v) => salvarAjuste(ex.id, { indisponivel: v })}
        />
        <Interruptor
          rotulo="Evitar"
          descricao="Não quero que o app sugira este exercício"
          ligado={!!ajuste?.evitar}
          aoMudar={(v) => salvarAjuste(ex.id, { evitar: v })}
        />
      </Cartao>

      <Cartao titulo="Carga">
        <Texto fraco>
          Registro em <strong>{ROTULO_CARGA[ex.tipoCarga]}</strong>
          {ex.tipoCarga === 'porLado' && ' (anilhas de um lado; o total soma a barra)'}
          {ex.tipoCarga === 'pesoCorpo' && ' (só repetições, ou repetições + carga extra)'}
          {ex.assistido && '. Aqui a carga é a AJUDA da máquina: quanto menos, mais difícil.'}
        </Texto>
        <div className="mt-3 flex flex-col gap-3">
          <CampoNumero
            rotulo="Menor salto de carga neste aparelho (kg)"
            valor={incremento}
            passo={0.5}
            minimo={0.5}
            aoMudar={(v) => salvarAjuste(ex.id, { incrementoCarga: v === ex.incrementoCarga ? undefined : v })}
            ajuda={`Padrão: ${ex.incrementoCarga} kg. O app nunca sugere uma carga fora desse salto.`}
          />
          {ex.tipoCarga === 'porLado' && (
            <CampoNumero
              rotulo="Peso da barra (kg)"
              valor={ajuste?.pesoBarraKg ?? PESO_BARRA_PADRAO}
              passo={1}
              minimo={0}
              aoMudar={(v) => salvarAjuste(ex.id, { pesoBarraKg: v === PESO_BARRA_PADRAO ? undefined : v })}
            />
          )}
        </div>
      </Cartao>
      <Texto fraco>Imagens e instruções originais: Free Exercise DB ({ex.nomeOriginal}), domínio público.</Texto>
    </Tela>
  )
}
