import { useEffect, useMemo, useRef, useState } from 'react'
import { formatarDataCurta, diasEntre, paraDate } from '../domain/datas'

// Gráfico de peso (§10): pontos do peso diário (secundários) + linha da média
// móvel de 7 dias (destaque). Um eixo só, grade discreta, rótulo só no fim da
// linha e leitura por toque/hover (linha vertical que encontra a data).
// Cores validadas para daltonismo/contraste nos dois temas (ver PALETA abaixo).

const PALETA = {
  claro: { media: '#047857', dia: '#10b981', grade: '#e2e8f0', superficie: '#ffffff' },
  escuro: { media: '#1aa67c', dia: '#05704f', grade: '#1e293b', superficie: '#0f172a' },
}

export interface PontoPeso {
  data: string
  peso: number
  media: number
}

function passoBonito(amplitude: number): number {
  const bruto = amplitude / 4
  for (const p of [0.5, 1, 2, 5, 10, 20]) if (bruto <= p) return p
  return 50
}

function fmt(n: number) {
  return n.toFixed(1).replace('.', ',')
}

function usarTemaEscuro() {
  const [escuro, setEscuro] = useState(() => document.documentElement.classList.contains('dark'))
  useEffect(() => {
    const obs = new MutationObserver(() => setEscuro(document.documentElement.classList.contains('dark')))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])
  return escuro
}

export function GraficoPeso({ pontos }: { pontos: PontoPeso[] }) {
  const caixa = useRef<HTMLDivElement>(null)
  const [largura, setLargura] = useState(320)
  const [foco, setFoco] = useState<number | null>(null)
  const cores = usarTemaEscuro() ? PALETA.escuro : PALETA.claro

  useEffect(() => {
    const el = caixa.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setLargura(Math.max(240, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const altura = 200
  const margem = { esq: 36, dir: 52, cima: 12, baixo: 24 }
  const geo = useMemo(() => {
    if (pontos.length === 0) return null
    const valores = pontos.flatMap((p) => [p.peso, p.media])
    let min = Math.min(...valores)
    let max = Math.max(...valores)
    if (max - min < 1) {
      min -= 0.5
      max += 0.5
    }
    const passo = passoBonito(max - min)
    min = Math.floor(min / passo) * passo
    max = Math.ceil(max / passo) * passo
    const ticks: number[] = []
    for (let v = min; v <= max + 1e-9; v += passo) ticks.push(Math.round(v * 10) / 10)
    const inicio = pontos[0].data
    const totalDias = Math.max(1, diasEntre(inicio, pontos[pontos.length - 1].data))
    const larguraUtil = largura - margem.esq - margem.dir
    const alturaUtil = altura - margem.cima - margem.baixo
    const x = (data: string) => margem.esq + (pontos.length === 1 ? larguraUtil / 2 : (diasEntre(inicio, data) / totalDias) * larguraUtil)
    const y = (v: number) => margem.cima + (1 - (v - min) / (max - min)) * alturaUtil
    return { ticks, x, y, larguraUtil }
  }, [pontos, largura, margem.esq, margem.dir, margem.cima, margem.baixo])

  if (!geo) return null
  const { ticks, x, y } = geo
  const ultimo = pontos[pontos.length - 1]
  const caminho = pontos.map((p, i) => `${i ? 'L' : 'M'}${x(p.data).toFixed(1)},${y(p.media).toFixed(1)}`).join(' ')

  function aoMover(e: React.PointerEvent<SVGSVGElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * largura
    let melhor = 0
    let dist = Infinity
    pontos.forEach((p, i) => {
      const d = Math.abs(x(p.data) - px)
      if (d < dist) {
        dist = d
        melhor = i
      }
    })
    setFoco(melhor)
  }

  const pf = foco !== null ? pontos[foco] : null
  const xFoco = pf ? x(pf.data) : 0

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-300" aria-hidden="true">
        <span className="flex items-center gap-1.5">
          <svg width="10" height="10">
            <circle cx="5" cy="5" r="4" fill={cores.dia} />
          </svg>
          Peso do dia
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="18" height="10">
            <line x1="1" y1="5" x2="17" y2="5" stroke={cores.media} strokeWidth="2" strokeLinecap="round" />
          </svg>
          Média de 7 dias
        </span>
      </div>
      <div ref={caixa} className="relative select-none">
        <svg
          width={largura}
          height={altura}
          role="img"
          aria-label={`Gráfico de peso. Média de 7 dias mais recente: ${fmt(ultimo.media)} kg em ${formatarDataCurta(ultimo.data)}.`}
          onPointerMove={aoMover}
          onPointerDown={aoMover}
          onPointerLeave={() => setFoco(null)}
          style={{ touchAction: 'pan-y' }}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={margem.esq} x2={largura - margem.dir} y1={y(t)} y2={y(t)} stroke={cores.grade} strokeWidth="1" />
              <text x={margem.esq - 6} y={y(t)} textAnchor="end" dominantBaseline="middle" className="fill-slate-500 text-[11px] dark:fill-slate-400" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {Number.isInteger(t) ? t : fmt(t)}
              </text>
            </g>
          ))}
          <text x={margem.esq} y={altura - 6} className="fill-slate-500 text-[11px] dark:fill-slate-400">
            {formatarDataCurta(pontos[0].data)}
          </text>
          {pontos.length > 1 && (
            <text x={largura - margem.dir} y={altura - 6} textAnchor="end" className="fill-slate-500 text-[11px] dark:fill-slate-400">
              {formatarDataCurta(ultimo.data)}
            </text>
          )}

          {pf && <line x1={xFoco} x2={xFoco} y1={margem.cima} y2={altura - margem.baixo} stroke={cores.grade} strokeWidth="1" />}

          {pontos.map((p) => (
            <circle key={p.data} cx={x(p.data)} cy={y(p.peso)} r="4" fill={cores.dia} stroke={cores.superficie} strokeWidth="2" />
          ))}
          {pontos.length > 1 && <path d={caminho} fill="none" stroke={cores.media} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}
          <circle cx={x(ultimo.data)} cy={y(ultimo.media)} r="4" fill={cores.media} stroke={cores.superficie} strokeWidth="2" />
          <text x={x(ultimo.data) + 8} y={y(ultimo.media)} dominantBaseline="middle" className="fill-slate-900 text-xs font-semibold dark:fill-slate-100">
            {fmt(ultimo.media)}
          </text>
          {pf && <circle cx={xFoco} cy={y(pf.media)} r="5" fill={cores.media} stroke={cores.superficie} strokeWidth="2" />}
        </svg>
        {pf && (
          <div
            className="pointer-events-none absolute top-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg dark:border-slate-700 dark:bg-slate-800"
            style={{ left: Math.min(Math.max(xFoco - 70, 0), largura - 140), width: 140 }}
          >
            <div className="text-xs text-slate-500 dark:text-slate-400">{paraDate(pf.data).toLocaleDateString('pt-BR')}</div>
            <div className="flex items-center gap-1.5">
              <svg width="12" height="6">
                <line x1="1" y1="3" x2="11" y2="3" stroke={cores.media} strokeWidth="2" strokeLinecap="round" />
              </svg>
              <strong>{fmt(pf.media)} kg</strong>
              <span className="text-xs text-slate-500 dark:text-slate-400">média</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg width="12" height="6">
                <circle cx="6" cy="3" r="3" fill={cores.dia} />
              </svg>
              <span>{fmt(pf.peso)} kg</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">no dia</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
