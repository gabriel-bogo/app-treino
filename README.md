# App Treino

App de academia **pessoal**, que roda no celular como aplicativo (PWA), **funciona sem internet** e guarda tudo **só no seu aparelho**. Sem cadastro, sem login, sem propaganda, sem servidor.

> 🚧 Em construção (Fase 1). O guia completo de instalação e publicação será finalizado ao fim da Fase 1.

## ⚠️ Aviso de saúde

Este app dá sugestões gerais de treino. Ele **não substitui** médico, fisioterapeuta, educador físico ou nutricionista. Se você tem alguma condição de saúde, lesão ou sente dor, procure avaliação profissional antes de começar. **O uso é por sua conta e risco.**

## Rodar no computador (para quem vai mexer no código)

Requisitos: [Node.js](https://nodejs.org) 22 ou mais novo.

```bash
npm install
npm run dev        # abre em http://localhost:5173
npm test           # testes de lógica (Vitest)
npm run build      # gera a versão de produção em dist/
npm run test:e2e   # testes no navegador (Playwright), depois do build
```

## Créditos

- Exercícios, instruções originais e imagens: [Free Exercise DB](https://github.com/yuhonas/free-exercise-db), licença Unlicense (domínio público). Nomes e instruções traduzidos e adaptados para o português do Brasil.

## Licença

[MIT](LICENSE). A especificação do produto está em [`docs/app-treino-spec.md`](docs/app-treino-spec.md).
