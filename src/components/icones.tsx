// Ícones em SVG embutido (nenhum arquivo externo, nenhuma fonte de ícones da internet).
import type { SVGProps } from 'react'

function Base(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  )
}

export const IconeInicio = () => (
  <Base>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
  </Base>
)
export const IconePlano = () => (
  <Base>
    <rect x="3" y="4" width="18" height="17" rx="2" />
    <path d="M3 9h18M8 2v4M16 2v4" />
  </Base>
)
export const IconeHistorico = () => (
  <Base>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5M12 7v5l3 2" />
  </Base>
)
export const IconeSaude = () => (
  <Base>
    <path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 0 0-7.1 7.1L12 21.5l8.8-8.8a5 5 0 0 0 0-7.1z" />
  </Base>
)
export const IconeMais = () => (
  <Base>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </Base>
)
export const IconeVoltar = () => (
  <Base>
    <path d="M15 18l-6-6 6-6" />
  </Base>
)
