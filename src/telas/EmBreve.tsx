import { Cartao, Tela, Texto } from '../components/ui'

// Marcador temporário para telas que serão construídas nas próximas etapas.
export function EmBreve({ titulo, voltarPara }: { titulo: string; voltarPara?: string }) {
  return (
    <Tela titulo={titulo} voltarPara={voltarPara}>
      <Cartao>
        <Texto>Esta tela ainda está sendo construída.</Texto>
      </Cartao>
    </Tela>
  )
}
