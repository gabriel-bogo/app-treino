# App Treino

App de academia **pessoal**, que funciona no celular como um aplicativo (PWA). Ele monta seu treino automaticamente a partir do seu perfil, registra cargas e repetições e diz quando é hora de progredir.

- **Sem cadastro, sem login, sem propaganda, sem servidor.**
- **Funciona sem internet** depois de instalado.
- **Seus dados ficam só no seu celular.** Ninguém mais tem acesso, nem quem publicou o app.

## ⚠️ Aviso de saúde

Este app dá sugestões gerais de treino. Ele **não substitui** médico, fisioterapeuta, educador físico ou nutricionista. Se você tem alguma condição de saúde, lesão ou sente dor, procure avaliação profissional antes de começar. **O uso é por sua conta e risco.**

## O que o app faz

- **Perfil:** um ou mais objetivos, nível, dias por semana, quantos treinos diferentes (A, B, C… revezando nos dias), duração do treino (30 min a 2 h), ênfase opcional (inferiores, superiores e/ou glúteos) e limitações (joelho, lombar, ombro, punho).
- **Plano automático:** divisão de 2 a 6 dias (Treino A, B, C…), volume semanal por grupo muscular, exercícios agrupados por músculo e descanso. Respeita a duração escolhida e as limitações. Marcando só "Superiores", o treino vira uma ficha com foco em superiores (ex: ombros + tríceps / peito + costas + bíceps / pernas). Quem está começando (ou voltando) passa por 3 semanas de readaptação, nos mesmos treinos, mais leves.
- **Você aprova o plano:** ao terminar o cadastro, o app mostra o programa completo. Dá para trocar qualquer exercício ou voltar e mudar as escolhas antes de começar.
- **Treino guiado:**
  - carga e repetições já preenchidas: se você fez igual, basta tocar no ✓;
  - timer de descanso automático com som;
  - aquecimento e séries de aproximação;
  - troca de exercício (aparelho ocupado, sem equipamento, dor);
  - exercícios fora da ordem.
- **Progressão 8 → 12:** cada exercício sobe uma repetição por vez até 12 e então sobe a carga. Se ficar pesado demais, volta um degrau.
- **Saúde:** peso diário com média de 7 dias, gráfico, IMC, faixa de peso adequado e cintura.
- **Histórico** de treinos e da evolução de cada exercício.
- **Biblioteca** de 104 exercícios em português, com imagens e "como fazer".
- **Backup:** exportar e importar um arquivo com todos os seus dados.

## Instalar no celular

Você precisa do link do app publicado (o seu, ou o de quem compartilhou com você).

**iPhone (precisa de iOS 16.4 ou mais novo):**
1. Abra o link no **Safari**. Pelo Chrome do iPhone não funciona.
2. Toque no botão **Compartilhar** (o quadrado com a seta para cima).
3. Role e toque em **Adicionar à Tela de Início** e depois em **Adicionar**.
4. Abra sempre pelo ícone novo. Depois da primeira abertura, funciona sem internet.

**Android:**
1. Abra o link no **Chrome**.
2. Toque no menu **⋮** e depois em **Instalar app** (ou **Adicionar à tela inicial**).

## Backup (importante)

Os dados ficam só no aparelho. Se você trocar de celular, apagar o app ou limpar os dados do navegador, **tudo some**. Faça backup de vez em quando:

- **Mais › Backup › Exportar backup** gera o arquivo `app-treino-backup-AAAA-MM-DD.json`. Salve em Arquivos, iCloud, Google Drive ou mande para você mesmo.
- **Celular novo:** instale o app e, na primeira tela, toque em **Já tenho um backup**.

O app lembra você na tela inicial quando o último backup tem mais de 14 dias.

> ⚠️ Nunca coloque seu arquivo de backup no GitHub. Ele tem seus dados pessoais.

## Publicar a sua própria cópia (passo a passo, sem programar)

Assim você tem o seu próprio link do app, de graça.

**1. Crie uma conta no GitHub** (se ainda não tiver): <https://github.com/signup>.

**2. Faça uma cópia ("fork") do código:**
1. Abra <https://github.com/gabriel-bogo/app-treino>.
2. Clique em **Fork** (canto superior direito) e depois em **Create fork**.
3. Pronto: agora existe `github.com/SEU-USUARIO/app-treino`.

**3. Publique na Vercel (hospedagem grátis):**
1. Entre em <https://vercel.com/signup> e escolha **Continue with GitHub**. Se perguntar o plano, escolha **Hobby** (grátis).
2. No painel, clique em **Add New…** e depois em **Project**.
3. Ache **app-treino** na lista e clique em **Import**. Se ele não aparecer, clique em **Configure GitHub App**, libere o repositório e volte.
4. Não mude nada (a Vercel reconhece sozinha que é um projeto "Vite"). Clique em **Deploy**.
5. Em cerca de 1 minuto aparece o link, algo como `app-treino-xxxx.vercel.app`. Esse é o seu app.

**4. Instale no celular** seguindo a seção "Instalar no celular" acima.

**Para receber atualizações depois:**
1. No GitHub, abra o seu `app-treino` e clique em **Sync fork** e depois em **Update branch**.
2. A Vercel publica a versão nova sozinha.
3. No celular, feche o app (arraste para cima) e abra de novo. Às vezes precisa repetir 2 vezes.

## Para quem vai mexer no código

Requisitos: [Node.js](https://nodejs.org) 22 ou mais novo.

```bash
npm install
npm run dev          # abre em http://localhost:5173
npm test             # testes de lógica (Vitest)
npm run build        # versão de produção em dist/
npm run test:e2e     # testes no navegador (Playwright), depois do build
```

**Organização:**

```
docs/                     especificação, decisões, biblioteca e contraindicações
scripts/curadoria/        gera a biblioteca a partir do Free Exercise DB (roda só no build)
public/exercises/         imagens dos exercícios (dentro do app, nada vem da internet)
src/data/                 exercises.ptbr.json (biblioteca gerada)
src/domain/               LÓGICA PURA, testada: motor de treino, progressão, saúde, sessão
src/db/                   banco local (IndexedDB/Dexie) e backup
src/telas/, src/components/  interface (React + Tailwind)
tests/e2e/                testes no navegador (offline, sem rede, retomada, backup…)
```

- As regras de negócio citam as seções da especificação (`§6.8`) e as decisões (`A1`, `B6`). Veja `docs/app-treino-spec.md` e `docs/decisoes-fase1.md`.
- **Mudar a biblioteca de exercícios ou as contraindicações:** edite `scripts/curadoria/dados.ts` e rode `node scripts/curadoria/gerar.ts`.
- Testes e exemplos usam **apenas dados fictícios**. Nunca coloque dados pessoais reais, segredos ou backups no repositório.

## Créditos

- Exercícios, instruções originais e imagens: [Free Exercise DB](https://github.com/yuhonas/free-exercise-db), licença Unlicense (domínio público). Nomes e instruções foram traduzidos e adaptados para o português do Brasil.

## Licença

[MIT](LICENSE). Qualquer pessoa pode copiar, publicar e usar.
