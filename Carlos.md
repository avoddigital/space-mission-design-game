# Carlos: formato dos dados (`carlos/data`)

Guia interno da equipe Tupi Orbit, em português. O código, os comentários e os commits continuam em inglês, como diz o [CLAUDE.md](CLAUDE.md).

## 1. Antes de começar

Atualize a sua branch com o `main` (o CLAUDE.md mudou e este arquivo também está lá):

```
git switch carlos/data
git pull
git merge main
npm install
npm test
```

Sempre faça `git pull` antes de começar a trabalhar e `git push` ao terminar.

## 2. Arquivos em `src/data/`

Cada arquivo exporta uma lista:

| Arquivo | Conteúdo |
|---|---|
| `parts.js` | instrumentos, painéis solares/baterias e antenas, tudo na mesma lista |
| `rockets.js` | foguetes |
| `orbits.js` | órbitas e destinos |
| `scenarios.js` | os 3 cenários (Terra, Lua, Marte) |

## 3. Regras

- Nomes de campo **exatamente** como nos exemplos, em inglês, com a unidade no nome (`massKg`, `powerW`...).
- `id` curto, em minúsculas e sem espaço (`hd-camera`).
- Valores inspirados em missões reais, mas simplificados. Coloque o comentário `// simplified` e, se puder, a missão de referência.
- Os destinos usam sempre estes 4 códigos:
  - `LEO`: órbita baixa da Terra
  - `GTO`: transferência para órbita geoestacionária
  - `TLI`: rumo à Lua
  - `TMI`: rumo a Marte
- Textos e explicações para o jogador **não** vão nessas tabelas. Eles ficam para a etapa 6.

## 4. Exemplos

Os números abaixo são só ilustração. Quem define os valores de verdade é você.

### `parts.js`

O campo `type` pode ser `instrument`, `power` ou `comms`.

```js
// Simplified values, inspired by real missions. Not exact.
export const parts = [
  {
    id: 'hd-camera',
    name: 'High-Resolution Camera',
    type: 'instrument',
    massKg: 50,
    powerW: 60,          // power it consumes
    costMUsd: 20,
    dataGbPerDay: 40,    // data it produces
    scienceValue: 7,     // 0 to 10
  },
  {
    id: 'solar-panel-m',
    name: 'Medium Solar Panel',
    type: 'power',
    massKg: 30,
    powerW: 0,
    powerGenW: 300,      // power it produces (power parts only)
    costMUsd: 8,
    dataGbPerDay: 0,
    scienceValue: 0,
  },
  {
    id: 'hga-antenna',
    name: 'High-Gain Antenna',
    type: 'comms',
    massKg: 25,
    powerW: 40,
    costMUsd: 12,
    dataGbPerDay: 0,
    downlinkGbPerDay: 100, // data it can send to Earth (comms parts only)
    scienceValue: 0,
  },
];
```

### `rockets.js`

`payloadKg` diz quanto o foguete leva para cada destino. Use `0` quando ele não chega lá.

```js
// Simplified values, inspired by real rockets. Not exact.
export const rockets = [
  {
    id: 'medium-lifter',
    name: 'Medium Lifter',          // inspired by Falcon 9
    costMUsd: 70,
    payloadKg: { LEO: 22800, GTO: 8300, TLI: 0, TMI: 4000 },
  },
];
```

### `orbits.js`

```js
// Simplified values. Not exact.
export const orbits = [
  { id: 'leo-500', name: 'Low Earth Orbit (500 km)', target: 'LEO', altitudeKm: 500, transferDays: 0 },
  { id: 'mars-orbit', name: 'Mars Orbit', target: 'TMI', altitudeKm: 400, transferDays: 210 },
];
```

### `scenarios.js`

Precisamos dos 3: observar a Terra, explorar a Lua e estudar Marte.

```js
// Simplified values. Not exact.
export const scenarios = [
  {
    id: 'earth-observation',
    name: 'Observe Earth',
    budgetMUsd: 300,               // total budget (parts + rocket)
    maxDays: 400,                  // time limit for the whole mission
    operationDays: 365,            // how long the science phase lasts
    allowedOrbits: ['leo-500'],    // orbit ids from orbits.js
    requiredTypes: ['instrument', 'power', 'comms'],
    minScience: 10,                // minimum total scienceValue to meet the goal
  },
];
```

## 5. Quantidade sugerida

- 8 a 10 instrumentos
- 3 opções de energia
- 3 antenas
- 4 foguetes (pequeno, médio, pesado, superpesado)
- 4 a 5 órbitas
- 3 cenários

## 6. Dúvidas

Se algum campo não fizer sentido ou estiver faltando, avise o Silvio **antes** de mudar. O motor de regras (`src/engine/`) lê exatamente esses nomes.
