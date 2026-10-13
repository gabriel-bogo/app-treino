// Salvar arquivo no aparelho: no iPhone/Android usa a folha de compartilhamento
// (Web Share API: salvar em Arquivos, iCloud, WhatsApp...). Sem suporte, baixa
// o arquivo normalmente (seção 8).

export type ResultadoSalvar = 'compartilhado' | 'baixado' | 'cancelado'

export async function compartilharOuBaixar(conteudo: string, nomeArquivo: string, tipo = 'application/json'): Promise<ResultadoSalvar> {
  const arquivo = new File([conteudo], nomeArquivo, { type: tipo })
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
  if (nav.canShare?.({ files: [arquivo] })) {
    try {
      await nav.share({ files: [arquivo], title: nomeArquivo })
      return 'compartilhado'
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelado'
      // outro erro (ex: permissão): cai para o download
    }
  }
  const url = URL.createObjectURL(arquivo)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeArquivo
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return 'baixado'
}

export function lerArquivoTexto(arquivo: File): Promise<string> {
  return arquivo.text()
}
