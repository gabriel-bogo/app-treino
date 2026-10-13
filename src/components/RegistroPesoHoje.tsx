import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/banco'
import { salvarRegistroCorpo } from '../db/corpo'
import { dataLocal } from '../domain/datas'
import { lerNumero } from '../domain/perfil'
import { sugerirCintura } from '../domain/saude'
import { Botao, Cartao } from './ui'

const fmt = (n: number) => n.toFixed(1).replace('.', ',')

/**
 * Card "Registrar peso de hoje" (§10). Um registro por dia; registrar de novo
 * substitui. Cintura opcional, sugerida 1x por semana. Sem registro hoje, o
 * card aparece destacado (lembrete visual, sem notificação).
 */
export function RegistroPesoHoje({ completo = false }: { completo?: boolean }) {
  const hoje = dataLocal()
  const registros = useLiveQuery(() => db.registrosCorpo.toArray())
  const deHoje = registros?.find((r) => r.data === hoje)
  const [editando, setEditando] = useState(false)
  const [peso, setPeso] = useState('')
  const [cintura, setCintura] = useState('')
  const [obs, setObs] = useState('')
  const [erro, setErro] = useState('')

  if (!registros) return null
  const pedirCintura = sugerirCintura(registros, hoje)
  const registrado = deHoje?.pesoKg !== undefined

  function abrir() {
    setPeso(deHoje?.pesoKg !== undefined ? fmt(deHoje.pesoKg) : '')
    setCintura(deHoje?.cinturaCm !== undefined ? fmt(deHoje.cinturaCm) : '')
    setObs(deHoje?.observacao ?? '')
    setErro('')
    setEditando(true)
  }

  async function salvar() {
    const p = lerNumero(peso)
    const c = cintura.trim() ? lerNumero(cintura) : undefined
    if (p === undefined || p < 25 || p > 350) return setErro('Digite um peso entre 25 e 350 kg.')
    if (cintura.trim() && (c === undefined || c < 40 || c > 250)) return setErro('Cintura entre 40 e 250 cm.')
    await salvarRegistroCorpo(hoje, { pesoKg: p, cinturaCm: c, observacao: completo ? obs : undefined })
    setEditando(false)
  }

  if (registrado && !editando) {
    return (
      <Cartao>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm text-slate-500 dark:text-slate-400">Peso de hoje</p>
            <p className="text-2xl font-bold">
              {fmt(deHoje!.pesoKg!)} kg
              {deHoje?.cinturaCm !== undefined && <span className="ml-2 text-base font-medium text-slate-500 dark:text-slate-400">· cintura {fmt(deHoje.cinturaCm)} cm</span>}
            </p>
          </div>
          <Botao variante="secundario" onClick={abrir}>
            Editar
          </Botao>
        </div>
        {pedirCintura && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Dica: meça a cintura 1x por semana.</p>}
      </Cartao>
    )
  }

  if (!editando) {
    return (
      <Cartao destaque="info" titulo="Registrar peso de hoje">
        <p className="text-sm text-slate-600 dark:text-slate-300">Você ainda não registrou o peso hoje.</p>
        <Botao className="mt-3 w-full" onClick={abrir}>
          Registrar peso
        </Botao>
      </Cartao>
    )
  }

  return (
    <Cartao titulo="Registrar peso de hoje">
      <div className="flex flex-col gap-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Peso (kg)</span>
          <input
            autoFocus
            inputMode="decimal"
            value={peso}
            onChange={(e) => setPeso(e.target.value)}
            placeholder="70,5"
            className="min-h-14 w-full rounded-xl border border-slate-300 bg-white px-4 text-2xl font-semibold dark:border-slate-700 dark:bg-slate-900"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">
            Cintura (cm) <span className="font-normal text-slate-500 dark:text-slate-400">opcional{pedirCintura ? ' · sugerido medir hoje' : ''}</span>
          </span>
          <input
            inputMode="decimal"
            value={cintura}
            onChange={(e) => setCintura(e.target.value)}
            placeholder="Ex: 82"
            className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-lg dark:border-slate-700 dark:bg-slate-900"
          />
        </label>
        {completo && (
          <label className="block">
            <span className="mb-1 block text-sm font-medium">
              Observação <span className="font-normal text-slate-500 dark:text-slate-400">opcional</span>
            </span>
            <input value={obs} onChange={(e) => setObs(e.target.value)} className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 dark:border-slate-700 dark:bg-slate-900" />
          </label>
        )}
        {erro && <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>}
        <div className="flex gap-2">
          <Botao variante="secundario" className="flex-1" onClick={() => setEditando(false)}>
            Cancelar
          </Botao>
          <Botao className="flex-[2]" onClick={salvar}>
            Salvar
          </Botao>
        </div>
      </div>
    </Cartao>
  )
}
