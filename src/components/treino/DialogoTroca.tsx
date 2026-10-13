import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/banco'
import { exercicioPorId, mapaAjustes, NOME_EQUIPAMENTO } from '../../domain/biblioteca'
import { candidatosSubstituicao, type FiltroEquipamento } from '../../domain/treino/substituicao'
import type { Exercicio, MotivoTroca, Perfil } from '../../domain/tipos'
import { Botao, Etiqueta } from '../ui'
import { Dialogo } from '../Dialogo'
import { ComoFazer } from '../ComoFazer'

// "Trocar exercício" (§6.10): motivo em 1 toque, até 3 sugestões com
// etiqueta de equipamento e "como fazer", filtro com/sem máquina, "ver
// todos" e, depois de escolher, "Só hoje" (padrão) ou "Trocar no plano".

const MOTIVOS: { valor: MotivoTroca; rotulo: string }[] = [
  { valor: 'ocupado', rotulo: 'Aparelho ocupado' },
  { valor: 'sem_equipamento', rotulo: 'Academia não tem o equipamento' },
  { valor: 'dor', rotulo: 'Desconforto / dor' },
  { valor: 'outro', rotulo: 'Outro' },
]

const FILTROS: { valor: FiltroEquipamento; rotulo: string }[] = [
  { valor: 'todos', rotulo: 'Todos' },
  { valor: 'com_maquina', rotulo: 'Com máquina' },
  { valor: 'sem_maquina', rotulo: 'Sem máquina' },
]

export interface EscolhaTroca {
  substitutoId: string
  motivo: MotivoTroca
  escopo: 'hoje' | 'plano'
  marcarIndisponivel: boolean
}

export function DialogoTroca({
  original,
  idsDoDia,
  perfil,
  aoFechar,
  aoEscolher,
  aoPular,
}: {
  original: Exercicio
  idsDoDia: string[]
  perfil: Perfil
  aoFechar: () => void
  aoEscolher: (e: EscolhaTroca) => void
  aoPular: () => void
}) {
  const ajustes = mapaAjustes(useLiveQuery(() => db.ajustesExercicio.toArray()))
  const [motivo, setMotivo] = useState<MotivoTroca | null>(null)
  const [filtro, setFiltro] = useState<FiltroEquipamento>('todos')
  const [verTodos, setVerTodos] = useState(false)
  const [aberto, setAberto] = useState<string | null>(null)
  const [escolhido, setEscolhido] = useState<string | null>(null)
  const [marcarIndisponivel, setMarcarIndisponivel] = useState(false)

  if (!motivo) {
    return (
      <Dialogo aberto titulo={`Trocar ${original.nome}`} aoFechar={aoFechar} acoes={<Botao variante="secundario" onClick={aoFechar}>Cancelar</Botao>}>
        <p>Por que você quer trocar?</p>
        <div className="grid gap-2">
          {MOTIVOS.map((m) => (
            <Botao key={m.valor} variante="secundario" className="justify-start" onClick={() => setMotivo(m.valor)}>
              {m.rotulo}
            </Botao>
          ))}
        </div>
      </Dialogo>
    )
  }

  if (escolhido) {
    const sub = exercicioPorId(escolhido)!
    const confirmar = (escopo: 'hoje' | 'plano') => aoEscolher({ substitutoId: escolhido, motivo, escopo, marcarIndisponivel })
    return (
      <Dialogo
        aberto
        titulo={`Trocar por ${sub.nome}`}
        aoFechar={aoFechar}
        acoes={
          <>
            <Botao onClick={() => confirmar('hoje')}>Só hoje</Botao>
            <Botao variante="secundario" onClick={() => confirmar('plano')}>
              Trocar no plano
            </Botao>
            <Botao variante="fantasma" onClick={() => setEscolhido(null)}>
              Voltar
            </Botao>
          </>
        }
      >
        <p>Mantém as séries, a faixa de repetições e o descanso do exercício original.</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          &quot;Trocar no plano&quot; usa {sub.nome} no lugar de {original.nome} nos próximos treinos também.
        </p>
        {motivo === 'sem_equipamento' && (
          <label className="flex min-h-12 items-center gap-3 font-medium">
            <input type="checkbox" className="h-6 w-6 accent-emerald-600" checked={marcarIndisponivel} onChange={(e) => setMarcarIndisponivel(e.target.checked)} />
            Marcar {original.nome} como indisponível na minha academia
          </label>
        )}
      </Dialogo>
    )
  }

  const r = candidatosSubstituicao({
    original,
    motivo,
    idsDoDia,
    limitacoes: perfil.limitacoes,
    ajustes,
    nivel: perfil.nivel,
    filtro,
  })
  const lista = verTodos ? r.todos : r.sugestoes

  return (
    <Dialogo aberto titulo={`Trocar ${original.nome}`} aoFechar={aoFechar} acoes={<Botao variante="secundario" onClick={aoFechar}>Cancelar</Botao>}>
      <div className="flex gap-2" role="radiogroup" aria-label="Filtro de equipamento">
        {FILTROS.map((f) => (
          <button
            key={f.valor}
            type="button"
            role="radio"
            aria-checked={filtro === f.valor}
            onClick={() => setFiltro(f.valor)}
            className={`min-h-10 rounded-full px-3 text-sm font-medium ${
              filtro === f.valor ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {f.rotulo}
          </button>
        ))}
      </div>
      {r.porSecundario && <p className="text-sm text-slate-500 dark:text-slate-400">Sem opções para o mesmo músculo; estas trabalham ele como músculo secundário.</p>}
      {lista.length === 0 ? (
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
          <p>Nenhum substituto disponível{filtro !== 'todos' ? ' com esse filtro' : ''}.</p>
          {filtro === 'todos' && (
            <Botao variante="secundario" className="mt-2 w-full" onClick={aoPular}>
              Pular exercício
            </Botao>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800" data-testid="candidatos-troca">
          {lista.map((e) => (
            <li key={e.id} className="py-2">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <p className="font-medium">{e.nome}</p>
                  <Etiqueta>{NOME_EQUIPAMENTO[e.equipamento]}</Etiqueta>
                </div>
                <Botao variante="fantasma" className="min-h-10 px-2 text-sm" onClick={() => setAberto(aberto === e.id ? null : e.id)}>
                  Como fazer
                </Botao>
                <Botao className="min-h-10 px-3 text-sm" onClick={() => setEscolhido(e.id)} aria-label={`Escolher ${e.nome}`}>
                  Escolher
                </Botao>
              </div>
              {aberto === e.id && (
                <div className="mt-2">
                  <ComoFazer ex={e} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {!verTodos && r.todos.length > r.sugestoes.length && (
        <Botao variante="fantasma" className="w-full" onClick={() => setVerTodos(true)}>
          Ver todos ({r.todos.length})
        </Botao>
      )}
    </Dialogo>
  )
}
