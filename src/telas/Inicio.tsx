import { Cartao, Tela, Texto } from '../components/ui'
import { LembreteBackup } from '../components/LembreteBackup'

export function Inicio() {
  return (
    <Tela titulo="Início">
      <LembreteBackup />
      <Cartao>
        <Texto>O próximo treino sugerido vai aparecer aqui.</Texto>
      </Cartao>
    </Tela>
  )
}
