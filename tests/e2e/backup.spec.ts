import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'

// Seção 8: exportar gera app-treino-backup-AAAA-MM-DD.json com dados + versão.
test('exportar backup gera arquivo com o nome e a estrutura certos', async ({ page }) => {
  await page.goto('/#/backup')
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Exportar backup' }).click()
  const arquivo = await download
  expect(arquivo.suggestedFilename()).toMatch(/^app-treino-backup-\d{4}-\d{2}-\d{2}\.json$/)
  const conteudo = JSON.parse(await readFile((await arquivo.path())!, 'utf8'))
  expect(conteudo.app).toBe('app-treino')
  expect(conteudo.schemaVersion).toBe(1)
  expect(conteudo.tabelas.configuracoes).toHaveLength(1)
  await expect(page.getByText(/Último backup:/)).toBeVisible()
})

test('importar arquivo inválido mostra erro e não altera nada', async ({ page }) => {
  await page.goto('/#/backup')
  await page.getByTestId('arquivo-backup').setInputFiles({
    name: 'qualquer.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"app":"outro"}'),
  })
  await expect(page.getByText('Este arquivo não é um backup do App Treino.')).toBeVisible()
})
