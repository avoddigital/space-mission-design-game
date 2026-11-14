# Carlos: tarefas e formato dos dados (`carlos/data`)

Guia interno da equipe Tupi Orbit, em português. O código, os textos do jogo, os comentários e os commits continuam em **inglês**, como diz o [CLAUDE.md](CLAUDE.md).

**Concluído:** tabelas `parts.js`, `rockets.js`, `orbits.js` e `scenarios.js`, com o equilíbrio de orçamentos ajustado. Os 50 testes passavam no `main` em 13/11; hoje (14/11) são 198 testes, incluindo campanha, conquistas, Biblioteca e traduções. 🎉

**PRD:** o seu PRD virou a versão 0.3, juntando o que ele propôs com o que já estava pronto. Leia a **seção 0.1** do [PRD](prd-space-mission-design-game.md): ela resume o que vale. Em resumo:
- **Mantidos** o motor, as suas tabelas e a pontuação de 0 a 100.
- **Entram do seu PRD** a experiência e a educação: Learn, quiz, GO/NO-GO, 5 medidores, eventos com semente, 4 fases, 3D e roadmap.
- **Ficam para o P1** os campos de física (sol, sinal, RTG, arrasto).

**Novidades de 14/11 (v0.5 do PRD, seção 15):** campanha, Biblioteca de Missões, conquistas, nova identidade visual, sons e três idiomas. O que muda para você está na **seção 6** deste guia: há tabelas novas e todo texto agora existe em inglês, português e espanhol.

---

## 1. Como trabalhamos sem depender um do outro

Cada um mexe só nos seus arquivos. Assim não há conflito e ninguém espera ninguém.

| Carlos mexe em | Silvio mexe em |
|---|---|
| `src/data/` (tabelas, `content.js`, `events.js`) | `src/engine/`, `src/state/`, `src/ui/`, `src/view3d/`, `src/main.js` |
| `README.md`, `docs/` (pitch, roteiro do vídeo) | `tests/`, `index.html`, `package.json`, configurações |
| `prd-space-mission-design-game.md` (combinar com o Silvio) | `CLAUDE.md` |

**Regras:**
- O formato de cada arquivo está combinado aqui, na seção 3. O Silvio programa lendo **exatamente esses nomes**. Se precisar mudar um nome ou acrescentar um campo novo, **avise antes**.
- Acrescentar itens (mais instrumentos, eventos, textos) pode à vontade.
- Antes de cada commit, rode `npm test`. Só envie com todos os testes passando.
- Se um teste falhar e você não entender o motivo, não mude o teste: chame o Silvio.
- **Até o Silvio terminar as telas, os textos não aparecem no jogo.** Isso é normal: o jogo vai ler `content.js` e `events.js` quando as telas estiverem prontas. Se um texto faltar, o jogo mostra um texto genérico e não quebra.

**Rotina diária:**
```
git switch carlos/data
git pull
git merge main      # traz o que o Silvio já juntou no main
npm install
npm test
```
Ao terminar uma tarefa: `npm test`, depois commit e `git push`, e avise o Silvio. Ele junta no `main`.

---

## 2. Suas tarefas, em ordem de prioridade

| # | Tarefa | Arquivo | Depende do Silvio? |
|---|---|---|---|
| 1 | `description` em todos os itens e `difficulty` nos cenários | as 4 tabelas | Não |
| 2 | Mensagens dos problemas da missão | `content.js` → `issues` | Não |
| 3 | Caixas "Learn" das etapas e explicações dos medidores | `content.js` → `learn`, `meters` | Não |
| 4 | Cenários: pergunta, briefing, fato, missões reais e quiz | `content.js` → `scenarios` | Não |
| 5 | Eventos aleatórios | `events.js` | Não |
| 6 | README: como jogar, como rodar, créditos | `README.md` | Não |
| 7 | Roteiro do pitch e do vídeo (em inglês) | `docs/pitch.md`, `docs/demo-script.md` | Não para escrever; sim para gravar (precisa das telas) |
| 8 | Testes de jogo e ajuste fino dos números | as tabelas | **Sim**: precisa das telas no `main` |
| 9 | Campos de física (P1): sol, sinal, RTG, arrasto | `orbits.js`, `parts.js` | **Sim**: só depois que o Silvio avisar que o motor suporta |

Faça um commit por tarefa, por exemplo `Add issue messages to content`.

---

## 3. Formato de cada tarefa

**Regras de texto, para todas as tarefas:**
- Inglês simples, para estudantes do ensino médio. Frases curtas, sem jargão. Quando usar um termo técnico, explique.
- Tom amigável e encorajador ("Try a bigger solar panel"), nunca de bronca.
- Nada de afirmar como exato o que é aproximado.

### Tarefa 1: `description` e `difficulty`

Acrescente um campo `description` (1 ou 2 frases em inglês) a **cada item** de `parts.js`, `rockets.js`, `orbits.js` e `scenarios.js`. Ele aparece no cartão, então diga para que serve o item e qual a troca envolvida.

```js
{
  id: 'hd-camera',
  name: 'High-Resolution Camera',
  description: 'Takes very detailed pictures. Great science, but it produces a lot of data.',
  type: 'instrument',
  // ...other fields stay the same
},
```

Nos cenários, acrescente também `difficulty`: `'easy'` (Terra), `'medium'` (Lua) ou `'hard'` (Marte). É só um rótulo e não muda a pontuação.

### `src/data/content.js`: estrutura geral (tarefas 2, 3 e 4)

Todos os textos longos ficam num arquivo só, com 4 partes. Pode criar o arquivo já com as 4 partes vazias e ir preenchendo:
```js
// Player-facing text. Plain English for beginners.
export const content = {
  issues: {},     // task 2
  learn: {},      // task 3
  meters: {},     // task 3
  scenarios: {},  // task 4
  glossary: {},   // optional: short definitions of technical terms
};
```

### Tarefa 2: `content.issues`

O motor de regras detecta os problemas abaixo e devolve um **código** com números. Para cada código, escreva:
- `title`: título curto;
- `text`: o que aconteceu, com os números;
- `tip`: como corrigir;
- `learn`: a regra que isso ensina, numa frase. Ela aparece no relatório, em "What to learn".

Os números entram com `{nome}` entre chaves, e o jogo substitui pelo valor. Use **somente** os nomes listados para cada código.

| Código | Quando acontece | Valores disponíveis | Tipo |
|---|---|---|---|
| `NO_ROCKET` | não escolheu foguete | nenhum | erro |
| `NO_ORBIT` | não escolheu órbita | nenhum | erro |
| `MISSING_REQUIRED_TYPE` | falta um tipo de peça obrigatório | `{type}` (instrument, power ou comms) | erro |
| `ORBIT_NOT_ALLOWED` | órbita não serve para este cenário | `{orbitId}` | erro |
| `ROCKET_CANNOT_REACH_ORBIT` | o foguete não chega a essa órbita | `{rocketId}`, `{orbitId}` | erro |
| `PAYLOAD_TOO_HEAVY` | a nave é pesada demais para o foguete | `{excessKg}`, `{capacityKg}` | erro |
| `LOW_MASS_MARGIN` | cabe, mas sobra menos de 10% | `{marginKg}`, `{marginPct}` | aviso |
| `POWER_DEFICIT` | falta energia | `{missingW}` | erro |
| `OVER_BUDGET` | estourou o orçamento | `{excessMUsd}` | erro |
| `OVER_TIME` | a missão passa do prazo | `{excessDays}` | erro |
| `NO_COMMS` | não tem antena | nenhum | erro |
| `DATA_BACKLOG` | a antena não consegue enviar todos os dados | `{excessGbPerDay}` | aviso |
| `LOW_SCIENCE` | ciência abaixo do objetivo | `{scienceValue}`, `{minScience}` | aviso |

```js
issues: {
  POWER_DEFICIT: {
    title: 'Not enough power',
    text: 'Your spacecraft needs {missingW} W more than your power system produces.',
    tip: 'Add a bigger solar panel, or remove an instrument that uses a lot of power.',
    learn: 'Every instrument must be powered all the time. Power is a budget, just like money.',
  },
  // ...one entry for every code in the table above
},
```

### Tarefa 3: `content.learn` e `content.meters`

`learn` é a caixa "Learn" de cada etapa: no máximo 3 frases (`text`) e uma "regra de bolso" (`rule`).
`meters` é o que abre quando o jogador toca num medidor. São 5 medidores; dados e comunicação viram um só, "Data downlink".

```js
learn: {
  objective: { text: 'Scientists start with a question. Engineers then build the spacecraft that can answer it.', rule: '...' },
  spacecraft: { text: '...', rule: 'Every gram you add must be launched and powered.' },
  launch: { text: '...', rule: '...' },
  simulation: { text: '...', rule: '...' },
  report: { text: '...', rule: '...' },
},
meters: {
  budget: { name: 'Budget', unit: 'million USD', text: '...' },
  mass: { name: 'Mass', unit: 'kg', text: 'How heavy your spacecraft is. Your rocket can only carry so much.' },
  power: { name: 'Power', unit: 'W', text: '...' },
  data: { name: 'Data downlink', unit: 'GB/day', text: '...' },
  time: { name: 'Time', unit: 'days', text: '...' },
},
```
As chaves (`objective`, `spacecraft`, `launch`, `simulation`, `report` e `budget`, `mass`, `power`, `data`, `time`) são fixas.

### Tarefa 4: `content.scenarios`

Uma entrada por cenário, usando o `id` de `scenarios.js`:
```js
scenarios: {
  'earth-observation': {
    question: "How are Earth's forests, ice and cities changing?",
    briefing: '2 to 4 sentences that tell the player the mission ("NASA needs a satellite to...").',
    fact: 'Did you know? Landsat satellites have photographed every part of Earth since 1972.',
    realMissions: [
      {
        name: 'Landsat 9',
        launchYear: 2021,
        summary: 'Images all of Earth to track changes in land, forests and water.',
        lesson: 'One sentence about what this mission teaches about mission design.',
        url: 'https://science.nasa.gov/...',
      },
    ],
    quiz: {
      q: 'Why do Earth-observing satellites often use a sun-synchronous orbit?',
      options: ['Same lighting on every pass', 'It is the only orbit rockets can reach', 'It is closer to the Sun'],
      answer: 0,               // index of the right option
      why: 'Same lighting every pass makes it easy to compare images over the years.',
    },
  },
  'moon-exploration': { /* ... */ },
  'mars-study': { /* ... */ },
},
```
**Importante:**
- **Missões reais** (2 a 3 por cenário): aqui os fatos são reais, não simplificados. Confira cada dado (nome, ano de lançamento, objetivo) na página oficial da NASA e coloque o link em `url`. Se não conseguir confirmar um dado, deixe-o de fora.
- **Quiz:** 3 opções e uma certa. O quiz dá o selo "Mission expert", sem pontos.

### Tarefa 5: `src/data/events.js`

São os imprevistos da simulação. A cada lançamento, o jogo sorteia 1 ou 2 eventos.

**A regra que o jogo ensina:**
- **Sobra de pelo menos 15%** no recurso `protectedBy`: nada acontece. O cartão fica verde e mostra `safeText`.
- **Menos de 15%:** a missão perde `scienceLossPct` da ciência. O cartão fica âmbar e mostra `hurtText`.
- Um evento sozinho não destrói a missão.

| Campo | O que é |
|---|---|
| `id`, `name` | como nas outras tabelas |
| `scenarios` | lista de ids de cenários em que pode acontecer, ou `['all']` |
| `protectedBy` | qual sobra protege a nave: `budget`, `mass`, `power`, `data` ou `time` |
| `scienceLossPct` | quanto de ciência se perde quando a sobra é pequena (0 a 100) |
| `safeText`, `hurtText` | o que o jogador lê nos dois casos. Pode usar `{marginPct}` (a sobra, em %) |
| `lesson` | 1 frase sobre o que engenheiros reais fazem para se proteger disso |

```js
// Simplified random events. Effects are game values, not real statistics.
export const events = [
  {
    id: 'solar-storm',
    name: 'Solar Storm',
    scenarios: ['all'],
    protectedBy: 'power',
    scienceLossPct: 20,
    safeText: 'A solar storm hit, but your {marginPct}% power margin kept everything running.',
    hurtText: 'A solar storm hit and your power margin was only {marginPct}%. Some instruments shut down.',
    lesson: 'Engineers add extra power so missions survive bad space weather.',
  },
];
```
Sugestão: de 6 a 8 eventos, com pelo menos 1 para cada `protectedBy` e alguns exclusivos de Lua ou Marte (por exemplo, tempestade de poeira em Marte). Ideias do PRD: tempestade solar (`power`), atraso de lançamento (`time`), queda de estação terrestre (`data`), aumento de custo de peças (`budget`).

### Tarefa 6: `README.md`

Mantenha o que já existe e acrescente:
- **How to play:** os 5 passos, em poucas linhas cada.
- **How to run:** copie os comandos da seção "Commands" do CLAUDE.md.
- **Credits and sources:** as missões e os foguetes que inspiraram os dados, os materiais de referência da NASA, os créditos das texturas (quando o 3D entrar) e a frase "AI assistance (Claude) was used during development." O crédito de IA vai aqui, não nos commits.
- Uma linha deixando claro que os valores do jogo são simplificados.

### Tarefa 7: `docs/pitch.md` e `docs/demo-script.md`

- **Pitch** (cerca de 1 minuto falando, como no PRD seção 9, fase 3): o problema (projetar missões é cheio de trocas difíceis), a solução (o jogo), para quem é (estudantes), o que o jogador aprende e o que faríamos com mais tempo.
- **Roteiro do vídeo:** cena por cena, o que aparece na tela e o que é falado. Use os fluxos 4.1 (sucesso) e 4.2 (falha que ensina) do PRD, trocando os números ilustrativos pelos das suas tabelas depois dos testes de jogo.

Confirme no site do Space Apps a duração máxima do vídeo e o formato de envio.

### Tarefa 8: testes de jogo e ajuste fino (depois das telas)

Quando o Silvio avisar que as telas estão no `main`, rode `npm run dev`, jogue os 3 cenários e anote:
- o que ficou confuso;
- o que ficou fácil ou difícil demais;
- os textos que precisam melhorar.

Peça também para 2 ou 3 pessoas de fora jogarem (é a métrica 3 do PRD). Ajuste os números nas tabelas e rode `npm test` depois de cada mudança. Os testes de equilíbrio avisam se um cenário ficou impossível ou fácil demais.

### Tarefa 9 (P1): campos de física

**Só comece quando o Silvio avisar que o motor já suporta estes campos.** Antes disso, eles não têm efeito. Detalhes no PRD, seção 6.3.

| Campo | Tabela | O que é |
|---|---|---|
| `sunFactor` | `orbits.js` | luz do sol comparada com a da Terra (Terra = 1; Marte cerca de 0.43) |
| `commsFactor` | `orbits.js` | força do sinal comparada com a órbita baixa da Terra (1 = igual; quanto mais longe, menor). Valor de jogo, não a física exata |
| `lifetimeDays` | `orbits.js` | quantos dias a órbita dura antes de o arrasto derrubar a nave (só órbitas baixas) |
| `nuclear: true` | `parts.js` (power) | bateria nuclear (RTG): ignora `sunFactor` |

Depois de preencher, rode `npm test`. O equilíbrio vai mudar, e talvez seja preciso ajustar orçamentos de novo.

---

## 4. Usando o Claude Code

O Claude lê o `CLAUDE.md` sozinho e segue as regras do projeto. Para cada tarefa, peça mais ou menos assim:

> Leia o Carlos.md, seção 3, tarefa N, e faça essa tarefa exatamente no formato descrito. Me mostre o plano antes de criar ou mudar arquivos. Rode npm test no final e não faça commit sem eu pedir.

**Cuidados:**
- **Fatos reais (tarefa 4):** o Claude pode errar datas e detalhes. Confira cada fato na página da NASA.
- **Nomes de campo e códigos:** não podem mudar sem falar com o Silvio.
- **Textos do jogo em inglês:** peça ao Claude uma explicação em português do que cada texto diz, para você revisar.
- **PRD:** se o Claude sugerir mudar o motor ou a pontuação, lembre que essa parte é do Silvio (seção 0.1 do PRD).

---

## 5. Referência: formato das tabelas que já existem

**Códigos de destino:** `LEO` (órbita baixa da Terra), `GTO` (transferência para geoestacionária), `TLI` (rumo à Lua), `TMI` (rumo a Marte).

| Tabela | Campos |
|---|---|
| `parts.js` | `id`, `name`, `description`, `type` (`instrument`, `power`, `comms`), `massKg`, `powerW`, `costMUsd`, `dataGbPerDay`, `scienceValue` (0–10); `powerGenW` nas peças `power`; `downlinkGbPerDay` nas peças `comms` |
| `rockets.js` | `id`, `name`, `description`, `costMUsd`, `payloadKg: { LEO, GTO, TLI, TMI }` (0 = não chega) |
| `orbits.js` | `id`, `name`, `description`, `target`, `altitudeKm`, `transferDays` |
| `scenarios.js` | `id`, `name`, `description`, `difficulty`, `budgetMUsd`, `maxDays`, `operationDays`, `allowedOrbits`, `requiredTypes`, `minScience` |

**Regras gerais:** `id` curto, em minúsculas, com hífen e sem espaço. Valores simplificados marcados com `// simplified` e a missão de referência.

---

## 6. Arquivos novos (14/11) e textos em três idiomas

### `src/data/campaign.js` (valores de jogo, simplificados)
- `countries`: os países parceiros do Space Apps 2026 (`id` = código da bandeira, `name`). Só país, nunca nome de agência.
- `focuses`: os 3 focos da agência e o bônus de cada um (`scienceMultiplier`, `transferMultiplier`, `researchMultiplier`).
- `phases`: as 3 fases em ordem (`scenarioId`, `rewardMUsd`, `unlocks` = ids da Biblioteca liberados na primeira vitória).
- `sideJobs`: missões secundárias (`phase`, `costMUsd`, `chance` de 0 a 1, `reward` com `fundsMUsd` e/ou `science`, `usesPerPhase`, `unlocks` opcional). **Mantenha pelo menos uma grátis e sem chance de falha na fase da Terra**: é o que impede a agência de ficar travada sem dinheiro (um teste confere).
- `research`: pesquisas (`costScience`, `effect` com `partMass`, `powerGen`, `downlink`, `rocketCost` ou `instrumentScience`).
- `agencyEvents`: eventos entre missões (`reward`, `weight`, `unlocks` opcional) e `EVENT_CHANCE`.
- Pode ajustar números à vontade; rode `npm test` depois. Os testes de `tests/campaign.test.js` conferem que todos os ids existem.

### `src/data/library.js` (fatos reais, **nunca simplificados**)
- `libraryMissions` e `libraryTopics`: cada item tem `facts` (frase + `source`, a página oficial de onde a frase saiu), `image` (da NASA Image and Video Library, com `alt`, `caption` e `credit`) e, nas missões, `url`.
- Só escreva um fato depois de **abrir a fonte e conferir**. Atualize `CHECKED_ON` com a data.
- `tests/library.test.js` exige fonte oficial (nasa.gov, spaceappschallenge.org...) e imagem da NASA com crédito.

### Textos em três idiomas (`src/i18n/`)
- `en.js` é a referência. `pt.js` e `es.js` têm a mesma lista de chaves (`ui`) e as traduções das tabelas por id (`data`).
- **Mudou um texto em inglês?** Mude também em `pt.js` e `es.js`.
- **Acrescentou um item numa tabela** (peça, evento, missão secundária, fato da Biblioteca)? Acrescente a tradução com o mesmo `id` em `pt.js` e `es.js`.
- Tradução muda **só palavras**: nunca troque números, ids, links ou a quantidade de fatos. Mantenha os `{marcadores}` iguais.
- `tests/i18n.test.js` aponta exatamente a chave que falta ou o marcador diferente.

### Conquistas (`src/engine/achievements.js`)
- Os nomes e descrições ficam em `src/i18n/*.js` (chaves `ach.<id>.name` e `ach.<id>.desc`). Para mudar uma regra (por exemplo, a nota mínima de "Engenharia de ponta"), fale com o Silvio.

