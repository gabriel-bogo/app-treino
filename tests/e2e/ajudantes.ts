import { expect, type Page } from '@playwright/test'

// Dados FICTÍCIOS para os testes (repositório público).
export interface OpcoesOnboarding {
  nome?: string
  sexo?: 'Feminino' | 'Masculino'
  nascimento?: string
  altura?: string
  peso?: string
  nivel?: 'Iniciante' | 'Retornando' | 'Intermediário'
  objetivo?: 'Hipertrofia' | 'Emagrecimento' | 'Saúde geral'
  enfase?: 'Equilibrado' | 'Inferiores' | 'Superiores' | 'Glúteos'
  dias?: '2' | '3' | '4' | '5' | '6'
  duracao?: '30 min' | '45 min' | '60 min' | '75 min' | '90 min'
  limitacoes?: ('Joelho' | 'Lombar' | 'Ombro' | 'Punho')[]
}

export async function fazerOnboarding(page: Page, o: OpcoesOnboarding = {}) {
  await page.goto('/')
  await page.getByLabel('Li e entendi o aviso').check()
  await page.getByRole('button', { name: 'Começar' }).click()

  await page.getByLabel('Nome ou apelido').fill(o.nome ?? 'Pessoa Teste')
  await page.getByRole('radio', { name: o.sexo ?? 'Feminino' }).click()
  await page.getByLabel('Data de nascimento').fill(o.nascimento ?? '1992-03-15')
  await page.getByLabel('Altura (cm)').fill(o.altura ?? '168')
  await page.getByLabel('Peso (kg)').fill(o.peso ?? '64,5')
  await page.getByRole('button', { name: 'Continuar' }).click()

  await page.getByRole('radio', { name: new RegExp('^' + (o.nivel ?? 'Intermediário')) }).click()
  await page.getByRole('radio', { name: new RegExp('^' + (o.objetivo ?? 'Hipertrofia')) }).click()
  await page.getByRole('radio', { name: new RegExp('^' + (o.enfase ?? 'Equilibrado')) }).click()
  await page.getByRole('radiogroup', { name: 'Dias por semana' }).getByRole('radio', { name: o.dias ?? '4', exact: true }).click()
  await page.getByRole('radio', { name: o.duracao ?? '60 min' }).click()
  await page.getByRole('button', { name: 'Continuar' }).click()

  for (const l of o.limitacoes ?? []) await page.getByRole('button', { name: l, exact: true }).click()
  await page.getByRole('button', { name: 'Criar meu plano' }).click()
  await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toBeVisible()
}
