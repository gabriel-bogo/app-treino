import { useEffect, useState } from 'react'
import type { Exercicio } from '../domain/tipos'
import { NOME_EQUIPAMENTO } from '../domain/biblioteca'
import { Etiqueta } from './ui'

// "Como fazer" (§5): alterna as imagens a cada ~1 s para simular o movimento,
// mostra os passos e os erros comuns. O botão do YouTube é o único ponto que
// sai do app, sempre por ação do usuário.

export function AnimacaoExercicio({ ex, className = '' }: { ex: Exercicio; className?: string }) {
  const [quadro, setQuadro] = useState(0)
  useEffect(() => {
    if (ex.imagens.length < 2) return
    const t = setInterval(() => setQuadro((q) => (q + 1) % ex.imagens.length), 1000)
    return () => clearInterval(t)
  }, [ex.imagens.length])

  if (!ex.imagens.length) {
    return (
      <div className={`flex aspect-[3/2] items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400 ${className}`}>
        Sem imagem para este exercício
      </div>
    )
  }
  return (
    <div className={`relative aspect-[3/2] overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 ${className}`}>
      {ex.imagens.map((img, i) => (
        <img
          key={img}
          src={`/exercises/${img}`}
          alt={i === 0 ? `${ex.nome}: posição inicial` : `${ex.nome}: posição final`}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${i === quadro ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
          decoding="async"
        />
      ))}
    </div>
  )
}

export function ComoFazer({ ex }: { ex: Exercicio }) {
  const busca = `https://www.youtube.com/results?search_query=${encodeURIComponent(ex.nome + ' execução')}`
  return (
    <div className="flex flex-col gap-3">
      <AnimacaoExercicio ex={ex} />
      <div className="flex flex-wrap gap-1">
        <Etiqueta>{NOME_EQUIPAMENTO[ex.equipamento]}</Etiqueta>
        <Etiqueta>{ex.tipo === 'composto' ? 'Composto' : 'Isolado'}</Etiqueta>
        {ex.unilateral && <Etiqueta>Reps por lado</Etiqueta>}
      </div>
      <div>
        <h3 className="mb-1 font-semibold">Como fazer</h3>
        <ol className="list-decimal space-y-1 pl-5 text-slate-700 dark:text-slate-300">
          {ex.passos.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ol>
      </div>
      <div>
        <h3 className="mb-1 font-semibold">Erros comuns</h3>
        <ul className="list-disc space-y-1 pl-5 text-slate-700 dark:text-slate-300">
          {ex.errosComuns.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>
      <a
        href={busca}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 px-4 font-semibold text-slate-700 active:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:active:bg-slate-800"
      >
        Ver vídeo no YouTube ↗
      </a>
      <p className="text-xs text-slate-500 dark:text-slate-400">O vídeo abre fora do app e precisa de internet.</p>
    </div>
  )
}
