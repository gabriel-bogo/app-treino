import { navegar } from '../app/rotas'
import { usePlano } from '../app/usePlano'
import { dispensarMensagemFase } from '../db/plano'
import { exercicioPorId } from '../domain/biblioteca'
import { Botao, Cartao, Etiqueta, Tela, Texto } from '../components/ui'
import { LembreteBackup } from '../components/LembreteBackup'
import { RegistroPesoHoje } from '../components/RegistroPesoHoje'

// Início (§3 tela 2): próximo treino sugerido, botão "Começar treino",
// lembretes de backup e de peso.
export function Inicio() {
  const dados = usePlano()
  const plano = dados?.plano
  const proximo = dados?.dias.find((d) => d.ordem === plano?.proximoIndice)
  const exercicios = proximo ? dados!.exercicios.filter((e) => e.diaId === proximo.id && e.papel === 'trabalho').sort((a, b) => a.ordem - b.ordem) : []

  return (
    <Tela titulo="Início">
      {plano?.mensagemFase && (
        <Cartao destaque="sucesso" titulo="Nova fase">
          <Texto>{plano.mensagemFase}</Texto>
          <Botao variante="secundario" className="mt-3 w-full" onClick={dispensarMensagemFase}>
            Entendi
          </Botao>
        </Cartao>
      )}
      <LembreteBackup />

      {proximo && (
        <Cartao>
          <div className="flex items-center gap-2">
            <p className="text-sm text-slate-500 dark:text-slate-400">Próximo treino</p>
            {plano?.fase === 'readaptacao' && <Etiqueta cor="marca">Readaptação</Etiqueta>}
          </div>
          <p className="text-2xl font-bold">{proximo.nome}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {exercicios.length} exercícios · ~{proximo.minutosEstimados} min
          </p>
          <ul className="mt-2 space-y-0.5 text-slate-700 dark:text-slate-300">
            {exercicios.map((e) => (
              <li key={e.id}>
                · {exercicioPorId(e.exercicioId)?.nome}
                {e.alerta && ' ⚠'}
              </li>
            ))}
          </ul>
          <Botao grande className="mt-4 w-full" onClick={() => navegar('/treino')}>
            Começar treino
          </Botao>
          <Botao variante="fantasma" className="mt-1 w-full" onClick={() => navegar('/plano')}>
            Ver plano da semana
          </Botao>
        </Cartao>
      )}

      <RegistroPesoHoje />
    </Tela>
  )
}
