# Carlos: tarefas e formato dos dados (`carlos/data`)

Guia interno da equipe Tupi Orbit, em português. O código, os textos do jogo, os comentários e os commits continuam em **inglês**, como diz o [CLAUDE.md](CLAUDE.md).

**Concluído:** tabelas `parts.js`, `rockets.js`, `orbits.js` e `scenarios.js`, com o equilíbrio de orçamentos ajustado. Os 50 testes passam no `main`. 🎉

---

## 1. Como trabalhamos sem depender um do outro

Cada um mexe só nos seus arquivos. Assim não há conflito e ninguém espera ninguém.

| Carlos mexe em | Silvio mexe em |
|---|---|
| `src/data/` (todas as tabelas e textos) | `src/engine/`, `src/state/`, `src/ui/`, `src/view3d/`, `src/main.js` |
| `README.md` | `tests/` |
| `docs/` (pitch, roteiro do vídeo) | `index.html`, `package.json`, configurações |

**Regras:**
- O formato de cada tabela está combinado aqui, na seção 3. O Silvio programa lendo **exatamente esses nomes de campo**. Se precisar mudar um nome ou acrescentar um campo novo, **avise antes**.
- Acrescentar itens (mais instrumentos, mais eventos, mais textos) pode à vontade.
- Antes de cada commit, rode `npm test`. Só envie com todos os testes passando.
- Se um teste falhar e você não entender o motivo, não mude o teste: chame o Silvio.

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
| 1 | Mensagens dos problemas da missão (o que deu errado e como corrigir) | `src/data/messages.js` | Não |
| 2 | Descrições curtas para iniciantes (peças, foguetes, órbitas, cenários) | as 4 tabelas atuais | Não |
| 3 | Explicações dos 6 recursos e dos 5 passos do jogo | `src/data/help.js` | Não |
| 4 | Eventos aleatórios da simulação (tempestade solar, falhas...) | `src/data/events.js` | Não |
| 5 | Missões reais da NASA parecidas com cada cenário (para o relatório final) | `src/data/realMissions.js` | Não |
| 6 | README: como jogar, créditos e fontes | `README.md` | Não |
| 7 | Roteiro do pitch e do vídeo de demonstração (em inglês) | `docs/pitch.md`, `docs/demo-script.md` | Não para escrever; sim para gravar o vídeo, que precisa das telas prontas |
| 8 | Testes de jogo e ajuste fino dos números | as tabelas | **Sim**: precisa das telas do Silvio no `main` |

Faça um commit por tarefa, por exemplo `Add issue messages for mission problems`.

---

## 3. Formato de cada tarefa

**Regras de texto, para todas as tarefas:**
- Inglês simples, para estudantes do ensino médio. Frases curtas, sem jargão. Quando usar um termo técnico, explique.
- Tom amigável e encorajador ("Try a bigger solar panel"), nunca de bronca.
- Nada de afirmar como exato o que é aproximado.

### Tarefa 1: `src/data/messages.js`

O motor de regras já detecta os problemas abaixo e devolve um **código** com números. Você escreve, para cada código, um título, a explicação e a dica de correção.

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
// Player-facing text for each issue code returned by src/engine/validation.js.
// {name} placeholders are replaced by the game with the issue values.
export const issueMessages = {
  POWER_DEFICIT: {
    title: 'Not enough power',
    text: 'Your spacecraft needs {missingW} W more than your power system produces.',
    tip: 'Add a bigger solar panel, or remove an instrument that uses a lot of power.',
  },
  // ...one entry for every code in the table above
};
```

### Tarefa 2: descrições nas tabelas atuais

Acrescente um campo `description` (1 ou 2 frases em inglês) a **cada item** de `parts.js`, `rockets.js`, `orbits.js` e `scenarios.js`. Ele explica para que serve o item, em linguagem de iniciante.

Nos cenários, acrescente também `briefing`: 2 a 4 frases contando a missão ao jogador ("NASA needs a satellite to...").

```js
{
  id: 'hd-camera',
  name: 'High-Resolution Camera',
  description: 'Takes very detailed pictures of the surface. Great science, but it produces a lot of data.',
  type: 'instrument',
  // ...other fields stay the same
},
```

### Tarefa 3: `src/data/help.js`

```js
// Beginner explanations shown in the game.
export const resourceHelp = {
  mass: { name: 'Mass', unit: 'kg', text: 'How heavy your spacecraft is. Your rocket can only carry so much.' },
  power: { name: 'Power', unit: 'W', text: '...' },
  budget: { name: 'Budget', unit: 'million USD', text: '...' },
  data: { name: 'Data', unit: 'GB/day', text: '...' },
  comms: { name: 'Communications', unit: '', text: '...' },
  time: { name: 'Time', unit: 'days', text: '...' },
};

export const stepHelp = [
  { step: 1, title: 'Choose your mission', text: '...' },
  { step: 2, title: 'Build your spacecraft', text: '...' },
  { step: 3, title: 'Pick a rocket and an orbit', text: '...' },
  { step: 4, title: 'Launch and simulate', text: '...' },
  { step: 5, title: 'Mission report', text: '...' },
];
```
As chaves (`mass`, `power`, `budget`, `data`, `comms`, `time`) e os números dos passos (1 a 5) são fixos.

### Tarefa 4: `src/data/events.js`

São os imprevistos durante a simulação. O Silvio vai programar a simulação lendo este formato.

| Campo | O que é |
|---|---|
| `id`, `name`, `description` | como nas outras tabelas; a `description` conta ao jogador o que aconteceu |
| `chance` | probabilidade de acontecer na missão, de 0 a 1 (`0.2` = 20%) |
| `scenarios` | lista de ids de cenários em que pode acontecer, ou `['all']` |
| `effect.kind` | **um** destes: `power` (perde % da energia), `downlink` (perde % da capacidade da antena), `science` (perde % da ciência), `delay` (atrasa dias), `cost` (custo extra em milhões) |
| `effect.amount` | quanto: porcentagem (0 a 100) para `power`, `downlink` e `science`; dias para `delay`; milhões de dólares para `cost` |
| `protectedBy` | qual sobra (margem) protege a nave: `power`, `data`, `budget`, `time`, `mass` ou `null`. Regra do jogo: **se o jogador deixou pelo menos 20% de sobra nesse recurso, o efeito cai pela metade**. É assim que o jogo ensina por que as margens importam. |
| `lesson` | 1 frase sobre o que engenheiros reais fazem para se proteger disso |

```js
// Simplified random events. Chances and effects are game values, not real statistics.
export const events = [
  {
    id: 'solar-storm',
    name: 'Solar Storm',
    description: 'A burst of energy from the Sun hits your spacecraft and damages the solar panels.',
    chance: 0.25,
    scenarios: ['all'],
    effect: { kind: 'power', amount: 30 },
    protectedBy: 'power',
    lesson: 'Engineers add extra power capacity so the mission survives when panels lose efficiency.',
  },
];
```
Sugestão: de 8 a 10 eventos, com pelo menos 2 de cada tipo de `effect.kind`, e alguns exclusivos de Lua ou Marte (por exemplo, tempestade de poeira em Marte).

### Tarefa 5: `src/data/realMissions.js`

Missões reais da NASA mostradas no relatório final ("missões parecidas com a sua"). Coloque de 2 a 3 por cenário.

```js
// Real NASA missions. Facts checked on nasa.gov (see url).
export const realMissions = [
  {
    id: 'lro',
    name: 'Lunar Reconnaissance Orbiter (LRO)',
    scenarioId: 'moon-exploration',
    launchYear: 2009,
    summary: 'Maps the Moon in high detail to find safe landing sites and resources.',
    lesson: 'One short sentence about what this mission teaches about mission design.',
    url: 'https://science.nasa.gov/mission/lro/',
  },
];
```
**Importante:** aqui os fatos são reais, não simplificados. Confira cada dado (nome, ano de lançamento, objetivo) na página oficial da NASA e coloque o link em `url`. Se não conseguir confirmar um dado, deixe-o de fora.

### Tarefa 6: `README.md`

Mantenha o que já existe e acrescente:
- **How to play:** os 5 passos, em poucas linhas cada.
- **How to run:** copie os comandos da seção "Commands" do CLAUDE.md.
- **Credits and sources:** as missões e os foguetes que inspiraram os dados, os materiais de referência da NASA e a frase "AI assistance (Claude) was used during development." (o crédito de IA vai aqui, não nos commits).

### Tarefa 7: `docs/pitch.md` e `docs/demo-script.md`

- **Pitch** (~2 minutos falando): o problema (projetar missões é cheio de trocas difíceis), a solução (o jogo), para quem é (estudantes), o que o jogador aprende e o que faríamos com mais tempo.
- **Roteiro do vídeo** (~2 minutos): cena por cena, o que aparece na tela e o que é falado. Use o cenário de Marte como exemplo, com uma tentativa que falha e outra que dá certo.

Confirme no site do Space Apps a duração máxima do vídeo e o formato de envio.

### Tarefa 8: testes de jogo e ajuste fino (depois das telas)

Quando o Silvio avisar que as telas estão no `main`, rode `npm run dev`, jogue os 3 cenários e anote:
- o que ficou confuso;
- o que ficou fácil ou difícil demais;
- os textos que precisam melhorar.

Ajuste os números nas tabelas e rode `npm test` depois de cada mudança. Os testes de equilíbrio avisam se um cenário ficou impossível ou fácil demais.

---

## 4. Usando o Claude Code

O Claude lê o `CLAUDE.md` sozinho e segue as regras do projeto. Para cada tarefa, peça mais ou menos assim:

> Leia o Carlos.md, seção 3, tarefa N, e faça essa tarefa exatamente no formato descrito. Me mostre o plano antes de criar ou mudar arquivos. Rode npm test no final e não faça commit sem eu pedir.

**Cuidados:**
- **Fatos reais (tarefa 5):** o Claude pode errar datas e detalhes. Confira cada fato na página da NASA.
- **Nomes de campo e códigos:** não podem mudar sem falar com o Silvio.
- **Textos do jogo em inglês:** peça ao Claude uma explicação em português do que cada texto diz, para você revisar.

---

## 5. Referência: formato das tabelas que já existem

Estas tabelas já estão prontas. O formato fica aqui para consulta.

**Códigos de destino:** `LEO` (órbita baixa da Terra), `GTO` (transferência para geoestacionária), `TLI` (rumo à Lua), `TMI` (rumo a Marte).

| Tabela | Campos |
|---|---|
| `parts.js` | `id`, `name`, `type` (`instrument`, `power`, `comms`), `massKg`, `powerW`, `costMUsd`, `dataGbPerDay`, `scienceValue` (0–10); `powerGenW` nas peças `power`; `downlinkGbPerDay` nas peças `comms` |
| `rockets.js` | `id`, `name`, `costMUsd`, `payloadKg: { LEO, GTO, TLI, TMI }` (0 = não chega) |
| `orbits.js` | `id`, `name`, `target`, `altitudeKm`, `transferDays` |
| `scenarios.js` | `id`, `name`, `budgetMUsd`, `maxDays`, `operationDays`, `allowedOrbits`, `requiredTypes`, `minScience` |

**Regras gerais:** `id` curto, em minúsculas, com hífen e sem espaço. Valores simplificados marcados com `// simplified` e a missão de referência.
