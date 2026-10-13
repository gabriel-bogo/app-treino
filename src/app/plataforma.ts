// Recursos do navegador usados pelo app, sempre com tolerância a falhas:
// se o aparelho não suportar, o app segue funcionando.

/** Pede ao navegador para não apagar os dados do app (seção 2, iPhone). */
export async function pedirArmazenamentoPersistente(): Promise<boolean> {
  try {
    if (navigator.storage?.persist) {
      if (await navigator.storage.persisted()) return true
      return await navigator.storage.persist()
    }
  } catch {
    // sem suporte: segue sem garantia extra
  }
  return false
}

/** true quando o app está aberto como app instalado (tela de início). */
export function estaInstalado(): boolean {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true
  return iosStandalone || window.matchMedia('(display-mode: standalone)').matches
}

export function ehIOS(): boolean {
  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1)
}
