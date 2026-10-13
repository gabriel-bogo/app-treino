import { Cartao, Tela, Texto } from '../components/ui'
import { LembreteBackup } from '../components/LembreteBackup'
import { RegistroPesoHoje } from '../components/RegistroPesoHoje'

export function Inicio() {
  return (
    <Tela titulo="Início">
      <LembreteBackup />
      <RegistroPesoHoje />
      <Cartao>
        <Texto>O próximo treino sugerido vai aparecer aqui.</Texto>
      </Cartao>
    </Tela>
  )
}
