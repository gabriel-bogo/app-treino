import { useEffect } from 'react'

// Mantém a tela ligada durante o treino (§2: Screen Wake Lock API se
// disponível, com falha silenciosa).
export function useTelaLigada(ativo: boolean) {
  useEffect(() => {
    if (!ativo) return
    let trava: { release: () => Promise<void> } | null = null
    let cancelado = false
    const pedir = async () => {
      try {
        const wl = (navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }).wakeLock
        if (!wl || document.visibilityState !== 'visible') return
        trava = await wl.request('screen')
        if (cancelado) void trava.release().catch(() => {})
      } catch {
        // sem suporte ou negado: segue sem manter a tela ligada
      }
    }
    const aoVoltar = () => {
      if (document.visibilityState === 'visible') void pedir()
    }
    void pedir()
    document.addEventListener('visibilitychange', aoVoltar)
    return () => {
      cancelado = true
      document.removeEventListener('visibilitychange', aoVoltar)
      void trava?.release().catch(() => {})
    }
  }, [ativo])
}
