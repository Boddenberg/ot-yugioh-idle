# OT Yu-Gi-Oh! Idle

Idle de duelos de cartas à moda de Yu-Gi-Oh!, nascido do OT Idle. Você monta o deck, escolhe a arena e o seu duelista duela sozinho, um duelo atrás do outro, até com o jogo fechado.

## Como rodar

```bash
npm install
npm run dev
```

Abre em http://localhost:5195. Não precisa de servidor nem de conta: o save fica no navegador (e pode ir a outro aparelho pelo código de save, na aba Registro).

Outros comandos:

```bash
npm test          # o motor do duelo, o progresso e a jornada inteira simulada
npm run build     # o site estático em dist/ (vai para qualquer hospedagem)
npm run arte      # gera no PixelLab a arte que faltar em public/arte
```

## O que tem

- **Duelo de verdade, automático.** 8000 LP, mão de 5, uma Invocação Normal por turno, Invocação-Tributo (nível 5-6 pede um, 7-8 pede dois, os Deuses pedem três), monstros virados em defesa, ATK contra ATK e ATK contra DEF, perfurar, ataque direto, ataque duplo, Magias (compra, dano, cura, equipamento, Raio Celeste, Vórtice Sombrio, Ressurreição, Fusão, Correntes de Luz) e Armadilhas (Barreira Espelhada, Cilindro Mágico, Fosso Armadilha, Escudo Negador, Cova de Espinhos). Deck vazio perde.
- **O campo do anime.** Zonas de monstro e de magia/armadilha, cemitério, deck e Deck Extra, a faixa de fases (DP SP M1 BP M2 EP), o contador de LP que desce rolando, a carta ativada que aparece grande no meio da mesa, "Invocação-Tributo!", "Armadilha ativada!".
- **62 cartas** com moldura nas cores oficiais (Normal, Efeito, Fusão, Magia, Armadilha), atributo com kanji, estrelas de nível, ATK/DEF e cinco raridades (Comum, Rara, Super, Ultra e Secreta com brilho). A arte é pixel art própria, feita no PixelLab.
- **7 arenas** (Praça do Porto, Fliperama Neon, Ilha do Torneio, Dirigível da Batalha, Torre Corporativa, Ruínas do Faraó, Reino das Sombras), cada uma com três duelistas e um mestre.
- **As 7 Relíquias do Milênio**, uma por mestre, com efeito permanente (mão maior, mais XP, mais cartas, mais DP, mais LP, ver as cartas viradas, mais progresso offline).
- **Loja de pacotes** (cinco cartas, a última Rara ou melhor, com a abertura carta a carta), **Altar de Fusão** (cria Monstros de Fusão e desmonta sobras em Pó Estelar), **construtor de deck** (20 a 40 cartas, 3 cópias, montagem automática), **coleção** com filtros.
- **Estratégia do duelista**: as regras que no OT Idle iam na barra de ações viram as regras de como o seu duelista joga (defender com os fracos, guardar dano para o golpe final, quando curar, atacar às cegas).
- **Progresso com o jogo fechado**: até 12 horas, a 50% da velocidade (90% com a Chave do Milênio), com o resumo "Enquanto você estava fora".

## Organização

- `src/nucleo/` — o jogo sem tela: `cartas.ts` (o banco de cartas), `duelo.ts` (o motor, um gerador que anda um evento por vez), `arenas.ts`, `reliquias.ts`, `progresso.ts` (nível, recompensas, loja, altar, offline, save).
- `src/tela/` — React: `App.tsx` (a casca e o laço do idle), `Campo.tsx` (a mesa), `Carta.tsx` (a carta), `Telas.tsx` (os menus).
- `ferramentas/` — `gerar-arte.mjs` (PixelLab), `jornada.test.ts` (um jogador de mentira joga o jogo inteiro e mostra quanto tempo cada arena leva), `balanco.test.ts` (os mestres uns contra os outros).
- `docs/decisoes.md` — as decisões tomadas para chegar aqui.

Projeto de fã, sem vínculo com a Konami ou com Kazuki Takahashi. Os nomes das cartas, dos personagens e toda a arte são próprios.
