// Gera os ícones do PWA a partir de um desenho SVG simples (halter).
// Rodar só quando quiser mudar o ícone: npm run icones
import sharp from 'sharp'
import { writeFile, mkdir } from 'node:fs/promises'

const FUNDO = '#059669'

// escala: tamanho do halter em relação ao ícone (o maskable precisa de margem)
function svg({ arredondado, escala }) {
  const r = arredondado ? 96 : 0
  const s = escala
  const t = (512 - 512 * s) / 2
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${r}" fill="${FUNDO}"/>
  <g transform="translate(${t} ${t}) scale(${s})" fill="#ffffff">
    <rect x="56" y="196" width="40" height="120" rx="12"/>
    <rect x="104" y="152" width="56" height="208" rx="14"/>
    <rect x="160" y="236" width="192" height="40" rx="10"/>
    <rect x="352" y="152" width="56" height="208" rx="14"/>
    <rect x="416" y="196" width="40" height="120" rx="12"/>
  </g>
</svg>`
}

await mkdir('public/icons', { recursive: true })
await writeFile('public/icons/icon.svg', svg({ arredondado: true, escala: 0.82 }))

const png = (conteudo, tamanho, arquivo) =>
  sharp(Buffer.from(conteudo)).resize(tamanho, tamanho).png().toFile(`public/icons/${arquivo}`)

await png(svg({ arredondado: true, escala: 0.82 }), 192, 'icon-192.png')
await png(svg({ arredondado: true, escala: 0.82 }), 512, 'icon-512.png')
// maskable e Apple: fundo até a borda (o sistema recorta) e desenho com margem
await png(svg({ arredondado: false, escala: 0.62 }), 512, 'icon-maskable-512.png')
await png(svg({ arredondado: false, escala: 0.72 }), 180, 'apple-touch-icon.png')
console.log('Ícones gerados em public/icons/')
