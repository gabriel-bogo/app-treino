// Tema claro / escuro / automático (segue o sistema).
// Guardado só neste aparelho (localStorage), aplicado antes de desenhar a tela
// pelo script do index.html.

export type Tema = 'auto' | 'claro' | 'escuro'

const CHAVE = 'app-treino:tema'
const consulta = () => window.matchMedia('(prefers-color-scheme: dark)')

export function lerTema(): Tema {
  try {
    const t = localStorage.getItem(CHAVE)
    return t === 'claro' || t === 'escuro' ? t : 'auto'
  } catch {
    return 'auto'
  }
}

export function aplicarTema(tema: Tema = lerTema()) {
  const escuro = tema === 'escuro' || (tema === 'auto' && consulta().matches)
  document.documentElement.classList.toggle('dark', escuro)
  const meta = document.querySelector('meta[name="theme-color"]')
  meta?.setAttribute('content', escuro ? '#0a0a0a' : '#fafafa')
}

export function salvarTema(tema: Tema) {
  try {
    localStorage.setItem(CHAVE, tema)
  } catch {
    // modo privado ou armazenamento bloqueado: só aplica nesta sessão
  }
  aplicarTema(tema)
}

/** Reaplica o tema quando o sistema muda de claro para escuro (modo automático). */
export function acompanharTemaDoSistema() {
  consulta().addEventListener('change', () => {
    if (lerTema() === 'auto') aplicarTema('auto')
  })
}
