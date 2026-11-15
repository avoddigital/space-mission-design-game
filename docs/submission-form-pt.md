# Formulário de submissão: versão em português para conferência

Tradução fiel do texto em inglês que vai para a plataforma. Serve só para conferir: na plataforma, colar a versão em inglês.

Conferido em 15/11/2026 de manhã:
- Os 46 links abrem (todos responderam 200). Três links mudaram de endereço e já estão atualizados nas tabelas (marcados com ↻).
- O site publicado tem campanha, Biblioteca de Missões, conquistas, três idiomas e jogo em equipe ("Join a room"). O modo 2D sem WebGL (`?3d=off`) abre e mostra o aviso "3D view unavailable on this device. The game works the same."
- Números do texto conferidos no código: 3 missões, 7 missões reais + 7 temas na Biblioteca, 16 conquistas, 18 países/regiões na campanha, eventos de tempestade solar, atraso no lançamento, queda de estação terrestre e tempestade de poeira em Marte.
- Os 258 testes automáticos passam.

---

## Summary (resumo)

O Tupi Orbit é um jogo gratuito de navegador em que o jogador funda uma agência espacial e projeta missões espaciais completas, da órbita da Terra à Lua e a Marte. Cada missão tem cinco etapas: escolher o objetivo científico, montar a nave e seus instrumentos, escolher a órbita e o foguete, acompanhar a simulação e ler o relatório final.

Cada escolha muda seis recursos ao mesmo tempo: massa, energia, orçamento, dados, comunicação e tempo. Uma câmera melhor traz mais ciência, mas também deixa a nave mais pesada, gasta mais energia, gera mais dados e custa mais. Quando a missão falha, o jogo explica o motivo em linguagem simples, com os números ("Sua nave está 10 kg acima do limite") e uma dica de como corrigir.

Isso é importante porque estudantes quase nunca conseguem experimentar uma missão inteira: aprendem órbitas, foguetes e instrumentos separadamente e nunca veem como uma decisão afeta a outra. O Tupi Orbit transforma essas trocas em algo jogável e mostra que não existe uma única resposta certa. Uma Biblioteca de Missões com fatos e imagens reais da NASA liga o jogo às missões reais. O jogo está disponível em inglês, português e espanhol.

## Project Details (detalhes do projeto)

**O QUE FAZ**
- Campanha: o jogador escolhe um país (os países parceiros do Space Apps 2026, mais a Europa e os Estados Unidos) e um foco para a agência, e libera três fases em ordem: Observar a Terra (fácil), Explorar a Lua (média) e Estudar Marte (difícil). Cada fase tem uma pergunta científica, um orçamento, um prazo e uma meta de ciência.
- Em cada fase, o jogador monta uma nave com instrumentos, painel solar e antena, escolhe a órbita e o foguete e lança. O lançamento é pago com a verba da agência, mesmo quando falha.
- Missão livre: qualquer uma das três missões, sem agência, para aulas e demonstrações.
- Jogo em equipe: de 1 a 4 jogadores, cada um com uma função (Diretor da Missão, Líder de Ciência, Engenheiro da Nave, Comunicações), em um só aparelho ou cada um no seu, com um código de sala. A equipe toda vota GO / NO-GO antes do lançamento.
- Biblioteca de Missões: 7 missões reais e 7 temas (órbitas, comunicação, energia, clima espacial, CubeSats e outros), com imagens reais da NASA e link para a fonte oficial de cada fato.
- Conquistas: 16 emblemas de missão que premiam bons hábitos de engenharia e de aprendizado, como ter sucesso depois de uma falha.

**COMO FUNCIONA**
- Um motor de regras recalcula os seis recursos a cada escolha. Ele confere se a nave cabe no foguete para aquela órbita e se energia, orçamento, dados e tempo fecham.
- Antes do lançamento, um checklist GO / NO-GO mostra o que ainda está errado, com os números. O jogador pode lançar mesmo assim, porque falhar também ensina.
- Durante o voo, eventos aleatórios (tempestade solar, atraso no lançamento, queda de estação terrestre, tempestade de poeira em Marte) só prejudicam projetos que deixaram pouca margem. Isso ensina por que engenheiros guardam folga. A mesma nave sempre recebe os mesmos eventos, então o jogador pode comparar mudanças de forma justa.
- Uma visualização 3D mostra a nave mudando a cada peça, e depois o lançamento, a viagem e a órbita. Sem WebGL, o jogo mostra uma versão 2D e continua jogável.
- O relatório dá uma nota de 0 a 100, explica o que funcionou e o que falhou e mostra missões reais da NASA parecidas com o projeto do jogador, como Landsat 9, LRO, LCROSS, MRO, 2001 Mars Odyssey e MAVEN.
- Uma caixa "Learn" em cada etapa e um quiz no final reforçam um conceito por vez.
- Entre as missões, missões secundárias trazem verba ou ciência, pesquisas melhoram as peças e eventos da agência ajudam ou atrapalham.

**BENEFÍCIOS**
- Gratuito, roda no navegador, sem instalação e sem login, em notebook ou celular.
- Feito para adolescentes e jovens adultos (de cerca de 14 a 29 anos) e para professores. Todos os textos usam linguagem simples.
- Três idiomas: inglês, português e espanhol. A tradução muda só as palavras, nunca as regras nem os números, e um teste automático garante isso.
- Unidades do Sistema Internacional, como a NASA usa nos seus próprios projetos.

**IMPACTO ESPERADO**
Uma atividade de 20 a 40 minutos para a sala de aula, em que os alunos discutem trocas reais de engenharia ("Por que vocês escolheram esse foguete?") e aprendem que uma missão que falhou é um passo para um projeto melhor.

**POR QUE É CRIATIVO**
- A falha faz parte do jogo: cada missão que falha vira uma explicação e um motivo para refazer o projeto.
- Não existe uma única resposta certa. Testes automáticos conferem que cada missão continua com várias soluções vencedoras.
- As funções da equipe e a votação GO / NO-GO transformam a sala de aula num pequeno centro de controle de missão.
- Os valores simplificados do jogo e os fatos reais da NASA ficam separados, então o jogador sempre sabe o que é real.

**O QUE A EQUIPE LEVOU EM CONTA**
- Acessibilidade: notebooks fracos de escola e celulares, sem conta, jogável com o som desligado e com versão 2D.
- Honestidade: os números do jogo se inspiram em instrumentos e foguetes reais, mas são simplificados, e o jogo diz isso. Os fatos reais vêm só de páginas oficiais, e cada um tem o link da fonte.
- Projeto de aprendizagem baseado em Kolb, Knowles, Vygotsky, Papert, Gee, Kapur, Freire e Black & Wiliam.
- Orientações de uso de mídia da NASA: a NASA recebe o crédito e nenhum logo ou insígnia da NASA é usado.

**FERRAMENTAS**
- JavaScript puro (ES modules), HTML e CSS, com build pelo Vite.
- Vitest para testes automáticos das regras, dos dados e das traduções.
- Three.js para a visualização 3D, carregado só quando é usado, para o jogo abrir rápido.
- PeerJS (WebRTC) para o jogo em equipe em vários aparelhos.
- flag-icons para as bandeiras; fontes B612 e Big Shoulders Stencil (Google Fonts); Web Audio API para sons sintetizados no navegador (sem arquivos de áudio).
- GitHub Pages para hospedagem; o código é aberto no GitHub.
- Claude (Anthropic), pelo Claude Code, como assistente de IA durante o desenvolvimento.

## Use of Super Intelligence (uso de IA)

- Marcar: código, dados e texto.
- Não marcar "I did not use SI".
- Marcar também imagem e áudio (Comandante Capi, ver o fim do arquivo).

## NASA Data (colar o nome em inglês)

| Link Text | Link Url | O que é |
|---|---|---|
| Design and Develop Science Missions | https://www.nasa.gov/wp-content/uploads/2025/04/250323-design-and-develop-science-mission.pdf | Guia da NASA, base das 5 etapas |
| Mission Design Lab (NASA Goddard) | https://etd.gsfc.nasa.gov/capabilities/integrated-design-center/mission-design-lab/ | Laboratório de projeto de missões |
| A Learning Game About Telescopes (Webb) | https://science.nasa.gov/mission/webb/game-build-it-yourself/ | Jogo da NASA que inspirou o relatório |
| General Mission Analysis Tool (GMAT) | https://software.nasa.gov/software/GSC-19468-1 | Software de análise de missões |
| Concept Maturity Levels | https://dataverse.jpl.nasa.gov/dataset.xhtml?persistentId=hdl:2014/44299 | Níveis de maturidade de conceito (JPL) |
| NASA Mission Viz | https://nasa.github.io/mission-viz/ | Visualização de missões |
| CubeSat 101 | https://www3.nasa.gov/sites/default/files/atoms/files/nasa_csli_cubesat_101_508.pdf | Guia de CubeSats |
| NASA Image and Video Library | https://images.nasa.gov/ | Imagens reais da Biblioteca |
| Landsat 9 | https://science.nasa.gov/mission/landsat-9/ | Página da missão |
| Landsat 8 | https://science.nasa.gov/mission/landsat-8/ | Página da missão |
| Lunar Reconnaissance Orbiter (LRO) | https://science.nasa.gov/mission/lro/ | Página da missão |
| LCROSS | https://science.nasa.gov/mission/lcross/ | Página da missão |
| Mars Reconnaissance Orbiter (MRO) | https://science.nasa.gov/mission/mars-reconnaissance-orbiter/ | Página da missão |
| 2001 Mars Odyssey | https://science.nasa.gov/mission/odyssey/ | Página da missão |
| MAVEN | https://science.nasa.gov/mission/maven/ | Página da missão |
| Mars Climate Orbiter | https://science.nasa.gov/mission/mars-climate-orbiter/ | Exemplo do erro de unidades |
| Catalog of Earth Satellite Orbits | https://science.nasa.gov/earth/earth-observatory/catalog-of-earth-satellite-orbits/ | Catálogo de órbitas |
| Deep Space Network | https://www.nasa.gov/communicating-with-missions/dsn/ | Rede de antenas da NASA |
| Radioisotope Power Systems | https://science.nasa.gov/planetary-science/programs/radioisotope-power-systems/ | Energia por radioisótopo |
| Space Weather Effects on Spacecraft (NASA SVS) | https://svs.gsfc.nasa.gov/31248 | Clima espacial |
| What are SmallSats and CubeSats? ↻ | https://www.nasa.gov/smallsat-institute/what-are-smallsats-and-cubesats/ | O que são CubeSats |
| Blue Marble Earth texture (NASA SVS) | https://svs.gsfc.nasa.gov/3615/ | Textura da Terra no 3D |
| CGI Moon Kit (NASA SVS, LRO data) | https://svs.gsfc.nasa.gov/4720/ | Textura da Lua no 3D |
| Mars Dust Storms (NASA SVS) | https://svs.gsfc.nasa.gov/30983 | Evento de tempestade de poeira |
| Mars Solar Conjunction (NASA JPL) | https://www.jpl.nasa.gov/news/whats-mars-solar-conjunction-and-why-does-it-matter/ | Evento de conjunção solar |
| LRO and Lunar Eclipses | https://science.nasa.gov/moon/eclipses/ | Evento de eclipse lunar |
| Solar Radiation on Mars (NASA TM-2001-210935) | https://ntrs.nasa.gov/api/citations/20010046858/downloads/20010046858.pdf | Luz do Sol em Marte (~43%) |
| NASA Science Information Policy (SPD-41a) ↻ | https://science.nasa.gov/researchers/science-information-policy/ | Política de ciência aberta |
| NASA Images and Media Guidelines | https://www.nasa.gov/nasa-brand-center/images-and-media/ | Regras de uso de imagens |
| NPD 7120.4E (SI units at NASA) | https://nodis3.gsfc.nasa.gov/displayDir.cfm?t=NPD&c=7120&s=4E | Unidades SI na NASA |

## Space Agency Partner & Other Data (colar o nome em inglês)

| Link Text | Link Url | O que é |
|---|---|---|
| Canadian Space Agency: Digital Games and Activities | https://www.asc-csa.gc.ca/eng/youth-educators/digital-games-and-activities.asp | Jogos da Agência Espacial Canadense |
| 2026 Space Agency Partners (country list) | https://www.spaceappschallenge.org/2026/space-agency-partners/ | Lista de países da campanha |
| Mars Viking Global Color Mosaic (USGS Astrogeology) | https://astrogeology.usgs.gov/search/map/mars_viking_global_color_mosaic_925m | Textura de Marte no 3D |
| Three.js | https://threejs.org | Biblioteca 3D |
| Vite | https://vite.dev | Ferramenta de build |
| Vitest | https://vitest.dev | Testes automáticos |
| PeerJS | https://peerjs.com/ | Conexão entre aparelhos |
| flag-icons | https://github.com/lipis/flag-icons | Bandeiras |
| Google Fonts (B612, B612 Mono, Big Shoulders Stencil) | https://fonts.google.com | Fontes |
| Pew Research Center: Generation Z definition | https://www.pewresearch.org/short-reads/2019/01/17/where-millennials-end-and-generation-z-begins/ | Faixa de idade do público |
| NIST: Metric (SI) Program | https://www.nist.gov/pml/owm/metric-si/ | Unidades SI |
| Claude Code (Anthropic), AI assistant ↻ | https://claude.com/product/claude-code | Assistente de IA usado |
| Tupi Orbit source code (GitHub) | https://github.com/avoddigital/space-mission-design-game | Código-fonte do projeto |

---

## Comandante Capi: imagem e áudio gerados por IA (feito em 15/11)

A Capi agora está no jogo: 8 imagens no painel e 60 narrações (Google AI Studio, voz Sulafat). O que foi feito para seguir a regra de SI:
- **Imagens:** as 21 imagens em `src/assets/capi/` têm marca d'água visível "AI-generated" no canto. No jogo, o retrato da Capi tem a marca "AI"/"IA" e o botão de voz se chama "AI voice"/"Voz IA".
- **Áudio:** os 60 WAV têm nos metadados `artist = Commander Capi (AI-generated voice)` e `comment = AI-generated voice (SI): Google AI Studio text-to-speech, voice Sulafat...`.
- **Texto:** README (créditos e seção da Capi) e `src/assets/capi/narracao/README.md` declaram imagem e voz geradas por IA.

No formulário de SI, marcar também **imagem** e **áudio**. Falta o Silvio dizer qual ferramenta gerou as imagens.
