import { useSyncExternalStore } from 'react'

// Navegação simples baseada no "#" da URL (ex: #/plano).
// Funciona offline e na Vercel sem configuração extra de servidor.

function lerCaminho(): string {
  const h = window.location.hash.replace(/^#/, '')
  return h.startsWith('/') ? h : '/'
}

function assinar(aviso: () => void) {
  window.addEventListener('hashchange', aviso)
  return () => window.removeEventListener('hashchange', aviso)
}

/** Caminho atual, ex: "/historico/12" → partes ["historico", "12"] */
export function useRota() {
  const caminho = useSyncExternalStore(assinar, lerCaminho, () => '/')
  const partes = caminho.split('/').filter(Boolean)
  return { caminho, partes }
}

export function navegar(caminho: string, opcoes: { substituir?: boolean } = {}) {
  const alvo = '#' + caminho
  if (opcoes.substituir) {
    window.history.replaceState(null, '', alvo)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  } else if (window.location.hash !== alvo) {
    window.location.hash = caminho
  }
}

export function voltar(padrao = '/') {
  if (window.history.length > 1) window.history.back()
  else navegar(padrao, { substituir: true })
}
