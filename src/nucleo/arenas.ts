// As arenas são as caçadas do OT Idle: o lugar onde o duelista fica duelando
// sozinho. Cada uma tem três duelistas que se revezam e um mestre (o boss),
// que se desafia de propósito e guarda uma Relíquia do Milênio.

export interface Oponente {
  id: string
  nome: string
  titulo: string
  // o retrato, em inglês, como foi pedido ao PixelLab
  visual: string
  deck: string[]
  mestre?: boolean
  lp?: number
}

export interface Arena {
  id: string
  nome: string
  descricao: string
  nivel: number
  // o fundo do campo de duelo desta arena
  cor: string
  oponentes: Oponente[]
  mestre: Oponente
  reliquia: string
  // o pacote da loja que esta arena abre
  pacote: string
}

// [id, cópias]
type Lista = [string, number][]
const d = (lista: Lista) => lista.flatMap(([id, n]) => Array<string>(n).fill(id))

export const ARENAS: Arena[] = [
  {
    id: 'praca-do-porto', nome: 'Praça do Porto', nivel: 1, cor: '#1d3b5a', reliquia: 'colar', pacote: 'pacote-inicial',
    descricao: 'Duelos de rua entre caixotes e gaivotas. Todo campeão começou aqui.',
    oponentes: [
      { id: 'tadeu', nome: 'Tadeu', titulo: 'o Pescador', visual: 'old fisherman with straw hat and fishing rod, harbor docks',
        deck: d([['tritao-de-coral', 2], ['golem-de-musgo', 3], ['soldado-de-bronze', 3], ['lobo-das-brumas', 2], ['besouro-de-aco', 3], ['fada-do-orvalho', 2], ['aprendiz-arcano', 1], ['calice-curativo', 2], ['escudo-negador', 2]]) },
      { id: 'lia', nome: 'Lia', titulo: 'a Estudante', visual: 'teenage schoolgirl duelist with blue uniform holding cards, city plaza',
        deck: d([['aprendiz-arcano', 3], ['fada-do-orvalho', 2], ['soldado-de-bronze', 3], ['lobo-das-brumas', 3], ['salamandra-ardente', 2], ['besouro-de-aco', 3], ['bola-de-fogo-arcana', 2], ['lamina-mistica', 2]]) },
      { id: 'bento', nome: 'Bento', titulo: 'o Marujo', visual: 'young sailor with striped shirt and bandana grinning, ship deck',
        deck: d([['tritao-de-coral', 3], ['besouro-de-aco', 3], ['esqueleto-guardiao', 3], ['diabrete-risonho', 3], ['soldado-de-bronze', 2], ['fada-do-orvalho', 2], ['bola-de-fogo-arcana', 2], ['cova-de-espinhos', 2]]) },
    ],
    mestre: { id: 'capitao-rocha', nome: 'Capitão Rocha', titulo: 'Mestre do Porto', mestre: true,
      visual: 'stern bearded ship captain with tricorn hat and long coat, stormy harbor',
      deck: d([['tritao-de-coral', 3], ['golem-de-musgo', 2], ['soldado-de-bronze', 3], ['besouro-de-aco', 2], ['lobo-das-brumas', 2], ['salamandra-ardente', 2], ['serpente-abissal', 1], ['lamina-mistica', 2], ['calice-curativo', 1], ['escudo-negador', 1], ['cova-de-espinhos', 1]]) },
  },
  {
    id: 'fliperama-neon', nome: 'Fliperama Neon', nivel: 5, cor: '#3a1550', reliquia: 'enigma', pacote: 'pacote-neon',
    descricao: 'Luzes piscando, fichas tilintando e duelistas que não dormem.',
    oponentes: [
      { id: 'kenji', nome: 'Kenji', titulo: 'o Gamer', visual: 'gamer boy with headphones and neon jacket, arcade machines glowing',
        deck: d([['sentinela-de-engrenagens', 3], ['mecha-lanca-chamas', 3], ['besouro-de-aco', 3], ['soldado-de-bronze', 3], ['diabrete-risonho', 2], ['bola-de-fogo-arcana', 2], ['lamina-mistica', 2], ['escudo-negador', 2]]) },
      { id: 'mila', nome: 'Mila', titulo: 'a Rainha do Placar', visual: 'punk girl with pink hair and leather jacket, neon arcade',
        deck: d([['harpia-da-tempestade', 3], ['lobo-das-brumas', 3], ['fada-do-orvalho', 2], ['samurai-do-vento', 2], ['aprendiz-arcano', 3], ['calice-curativo', 2], ['lamina-mistica', 2], ['cova-de-espinhos', 3]]) },
      { id: 'dado', nome: 'Dado', titulo: 'o Apostador', visual: 'shady gambler in purple suit rolling dice, casino lights',
        deck: d([['diabrete-risonho', 3], ['esqueleto-guardiao', 3], ['espectro-sorrateiro', 3], ['lobo-das-brumas', 3], ['ogro-da-montanha', 1], ['bola-de-fogo-arcana', 3], ['jarro-da-cobica', 1], ['fosso-armadilha', 1], ['escudo-negador', 2]]) },
    ],
    mestre: { id: 'zero', nome: 'Zero', titulo: 'Campeão do Fliperama', mestre: true,
      visual: 'cool teen champion with spiky hair and visor, neon cyber arcade',
      deck: d([['mecha-lanca-chamas', 3], ['sentinela-de-engrenagens', 3], ['samurai-do-vento', 2], ['ninja-das-sombras', 2], ['colosso-a-vapor', 1], ['ogro-da-montanha', 1], ['machado-do-desespero', 1], ['lamina-mistica', 2], ['jarro-da-cobica', 1], ['fosso-armadilha', 2], ['escudo-negador', 2]]) },
  },
  {
    id: 'ilha-do-torneio', nome: 'Ilha do Torneio', nivel: 10, cor: '#1f4a2c', reliquia: 'anel', pacote: 'pacote-ilha',
    descricao: 'Um castelo numa ilha e um convite que ninguém recusa.',
    oponentes: [
      { id: 'brutus', nome: 'Brutus', titulo: 'o Gladiador', visual: 'muscular gladiator duelist with helmet, arena of an island castle',
        deck: d([['soldado-de-bronze', 3], ['cavaleiro-da-aurora', 3], ['samurai-do-vento', 3], ['ogro-da-montanha', 2], ['golem-de-musgo', 2], ['lamina-mistica', 2], ['machado-do-desespero', 1], ['calice-curativo', 2], ['escudo-negador', 2]]) },
      { id: 'iris', nome: 'Íris', titulo: 'a Feiticeira das Harpias', visual: 'elegant woman duelist with long purple hair and dark dress, castle hall',
        deck: d([['harpia-da-tempestade', 3], ['grifo-dourado', 2], ['lobo-das-brumas', 3], ['unicornio-prisma', 2], ['fada-do-orvalho', 2], ['tufao-arcano', 2], ['lamina-mistica', 2], ['cova-de-espinhos', 2], ['fosso-armadilha', 2]]) },
      { id: 'vulto', nome: 'Vulto', titulo: 'o Mascarado', visual: 'mysterious masked duelist in black cloak, misty island cliffs',
        deck: d([['espectro-sorrateiro', 3], ['esqueleto-guardiao', 3], ['bruxa-carmesim', 2], ['ninja-das-sombras', 2], ['arquidemonio-das-caveiras', 1], ['diabrete-risonho', 3], ['vortice-sombrio', 1], ['bola-de-fogo-arcana', 2], ['cilindro-magico', 1], ['escudo-negador', 2]]) },
    ],
    mestre: { id: 'conde-aureo', nome: 'Conde Áureo', titulo: 'Senhor da Ilha', mestre: true, lp: 9000,
      visual: 'aristocratic count with long silver hair and red suit holding a golden eye, castle throne',
      deck: d([['mago-do-espelho', 3], ['unicornio-prisma', 2], ['cavaleiro-da-aurora', 3], ['samurai-do-vento', 2], ['feiticeira-lunar', 1], ['grifo-dourado', 1], ['arquidemonio-das-caveiras', 1], ['jarro-da-cobica', 1], ['tufao-arcano', 1], ['lamina-mistica', 2], ['machado-do-desespero', 1], ['cilindro-magico', 2], ['fosso-armadilha', 2]]) },
  },
  {
    id: 'dirigivel-da-batalha', nome: 'Dirigível da Batalha', nivel: 18, cor: '#4a3214', reliquia: 'cetro', pacote: 'pacote-dirigivel',
    descricao: 'As finais acontecem acima das nuvens. Quem perde, desce de paraquedas.',
    oponentes: [
      { id: 'grisalho', nome: 'Grisalho', titulo: 'o Veterano', visual: 'old veteran duelist with eyepatch and trench coat on an airship deck',
        deck: d([['cavaleiro-da-aurora', 3], ['samurai-do-vento', 3], ['ogro-da-montanha', 2], ['cavaleiro-do-eclipse', 1], ['colosso-a-vapor', 1], ['soldado-de-bronze', 2], ['machado-do-desespero', 2], ['jarro-da-cobica', 1], ['tufao-arcano', 1], ['fosso-armadilha', 2], ['escudo-negador', 2]]) },
      { id: 'nara', nome: 'Nara', titulo: 'a Domadora de Feras', visual: 'wild tribal girl duelist with fur cloak and feathers, airship sky',
        deck: d([['lobo-das-brumas', 3], ['harpia-da-tempestade', 3], ['grifo-dourado', 2], ['unicornio-prisma', 3], ['quimera-flamejante', 0], ['salamandra-ardente', 2], ['fusao-arcana', 1], ['lamina-mistica', 2], ['cova-de-espinhos', 2], ['calice-curativo', 2]]) },
      { id: 'doutor-volt', nome: 'Doutor Volt', titulo: 'o Inventor', visual: 'mad scientist inventor with goggles and lab coat, electric sparks',
        deck: d([['sentinela-de-engrenagens', 3], ['mecha-lanca-chamas', 3], ['colosso-a-vapor', 2], ['besouro-de-aco', 2], ['tritao-de-coral', 2], ['fusao-arcana', 1], ['chuva-de-meteoros', 1], ['bola-de-fogo-arcana', 2], ['cilindro-magico', 1], ['fosso-armadilha', 2], ['escudo-negador', 1]]) },
    ],
    mestre: { id: 'magnata-kai', nome: 'Magnata Kai', titulo: 'Dono do Dirigível', mestre: true, lp: 10000,
      visual: 'arrogant young billionaire duelist in white long coat, airship bridge with clouds',
      deck: d([['dragao-alvo-celestial', 2], ['grifo-dourado', 2], ['cavaleiro-da-aurora', 3], ['samurai-do-vento', 3], ['ogro-da-montanha', 2], ['colosso-a-vapor', 1], ['jarro-da-cobica', 1], ['ressurreicao-sagrada', 1], ['machado-do-desespero', 1], ['barreira-espelhada', 1], ['fosso-armadilha', 2], ['escudo-negador', 1]]) },
  },
  {
    id: 'torre-corporativa', nome: 'Torre Corporativa', nivel: 26, cor: '#13303f', reliquia: 'balanca', pacote: 'pacote-torre',
    descricao: 'Cem andares de vidro e duelos de realidade virtual.',
    oponentes: [
      { id: 'executivo-sete', nome: 'Sete', titulo: 'o Executivo', visual: 'corporate executive in gray suit with sunglasses, glass skyscraper office',
        deck: d([['sentinela-de-engrenagens', 3], ['colosso-a-vapor', 2], ['mecha-lanca-chamas', 3], ['tritao-de-coral', 2], ['leviata-das-mares', 1], ['fusao-arcana', 1], ['machado-do-desespero', 2], ['jarro-da-cobica', 1], ['tufao-arcano', 1], ['cilindro-magico', 1], ['fosso-armadilha', 2], ['escudo-negador', 1]]) },
      { id: 'ada', nome: 'Ada', titulo: 'a Hacker', visual: 'hacker girl with hoodie and holographic screens, server room',
        deck: d([['mago-do-espelho', 3], ['aprendiz-arcano', 3], ['feiticeira-lunar', 2], ['bruxa-carmesim', 2], ['unicornio-prisma', 2], ['jarro-da-cobica', 1], ['tufao-arcano', 2], ['correntes-de-luz', 1], ['cilindro-magico', 1], ['fosso-armadilha', 2], ['escudo-negador', 1]]) },
      { id: 'golias', nome: 'Golias', titulo: 'o Segurança', visual: 'huge bodyguard in black suit with earpiece, corporate lobby',
        deck: d([['golem-de-musgo', 3], ['besouro-de-aco', 3], ['ogro-da-montanha', 2], ['tita-de-obsidiana', 1], ['soldado-de-bronze', 3], ['golem-vulcanico', 0], ['salamandra-ardente', 2], ['fusao-arcana', 1], ['calice-curativo', 2], ['escudo-negador', 2], ['cova-de-espinhos', 1]]) },
    ],
    mestre: { id: 'diretor-vulcano', nome: 'Diretor Vulcano', titulo: 'Presidente da Torre', mestre: true, lp: 11000,
      visual: 'imposing bald corporate tycoon with mustache in dark suit, penthouse at night',
      deck: d([['tita-de-obsidiana', 1], ['colosso-a-vapor', 2], ['arquidemonio-das-caveiras', 2], ['kraken-ancestral', 1], ['sentinela-de-engrenagens', 3], ['mecha-lanca-chamas', 3], ['tritao-de-coral', 2], ['jarro-da-cobica', 1], ['raio-celeste', 1], ['machado-do-desespero', 1], ['barreira-espelhada', 1], ['cilindro-magico', 1], ['fosso-armadilha', 1]]) },
  },
  {
    id: 'ruinas-do-farao', nome: 'Ruínas do Faraó', nivel: 35, cor: '#5a4210', reliquia: 'olho', pacote: 'pacote-farao',
    descricao: 'Areia, hieróglifos e tábuas de pedra onde os monstros eram selados.',
    oponentes: [
      { id: 'sacerdote-sett', nome: 'Sett', titulo: 'o Sacerdote', visual: 'ancient egyptian high priest with golden headdress holding a rod, temple',
        deck: d([['dragao-alvo-celestial', 1], ['grifo-dourado', 2], ['cavaleiro-da-aurora', 3], ['mago-do-espelho', 3], ['feiticeira-lunar', 1], ['samurai-do-vento', 2], ['jarro-da-cobica', 1], ['ressurreicao-sagrada', 1], ['lamina-mistica', 2], ['fosso-armadilha', 2], ['cilindro-magico', 1], ['escudo-negador', 1]]) },
      { id: 'guardia-isis', nome: 'Ísis', titulo: 'a Guardiã do Colar', visual: 'egyptian priestess with golden necklace and white dress, sandstone hall',
        deck: d([['fada-do-orvalho', 3], ['unicornio-prisma', 3], ['feiticeira-lunar', 2], ['serafim-do-julgamento', 1], ['mago-do-espelho', 3], ['calice-curativo', 2], ['correntes-de-luz', 1], ['jarro-da-cobica', 1], ['barreira-espelhada', 1], ['fosso-armadilha', 2], ['escudo-negador', 1]]) },
      { id: 'rato-do-deserto', nome: 'Rato do Deserto', titulo: 'o Saqueador de Tumbas', visual: 'desert tomb robber with white hair and red cloak, scarred face, dunes',
        deck: d([['esqueleto-guardiao', 3], ['espectro-sorrateiro', 3], ['arquidemonio-das-caveiras', 2], ['dragao-rubro-das-cinzas', 1], ['bruxa-carmesim', 2], ['diabrete-risonho', 2], ['vortice-sombrio', 1], ['ressurreicao-sagrada', 1], ['chuva-de-meteoros', 1], ['cilindro-magico', 1], ['fosso-armadilha', 2], ['cova-de-espinhos', 1]]) },
    ],
    mestre: { id: 'farao-sem-nome', nome: 'Faraó Sem Nome', titulo: 'Rei dos Jogos', mestre: true, lp: 12000,
      visual: 'young egyptian pharaoh with spiky tri-color hair and golden crown, purple cape, throne of pyramids',
      deck: d([['mago-sombrio-supremo', 2], ['cavaleiro-do-eclipse', 2], ['dragao-rubro-das-cinzas', 1], ['arquidemonio-das-caveiras', 2], ['ninja-das-sombras', 2], ['bruxa-carmesim', 2], ['cavaleiro-da-aurora', 2], ['jarro-da-cobica', 1], ['raio-celeste', 1], ['ressurreicao-sagrada', 1], ['fusao-arcana', 1], ['barreira-espelhada', 1], ['cilindro-magico', 1], ['fosso-armadilha', 1]]) },
  },
  {
    id: 'reino-das-sombras', nome: 'Reino das Sombras', nivel: 45, cor: '#160a24', reliquia: 'chave', pacote: 'pacote-sombras',
    descricao: 'O Jogo das Trevas. Aqui, quem perde o duelo perde a alma.',
    oponentes: [
      { id: 'sombra-errante', nome: 'Sombra Errante', titulo: 'Alma Perdida', visual: 'ghostly shadow duelist with glowing purple eyes, void of darkness',
        deck: d([['espectro-sorrateiro', 3], ['arquidemonio-das-caveiras', 2], ['dragao-rubro-das-cinzas', 1], ['mago-sombrio-supremo', 1], ['bruxa-carmesim', 3], ['ninja-das-sombras', 3], ['vortice-sombrio', 1], ['ressurreicao-sagrada', 1], ['machado-do-desespero', 2], ['barreira-espelhada', 1], ['fosso-armadilha', 2]]) },
      { id: 'cavaleira-do-vazio', nome: 'Cavaleira do Vazio', titulo: 'Arauto das Trevas', visual: 'dark female knight in black spiked armor with glowing sword, shadow realm',
        deck: d([['cavaleiro-do-eclipse', 3], ['dragao-rubro-das-cinzas', 2], ['samurai-do-vento', 3], ['ninja-das-sombras', 2], ['ogro-da-montanha', 2], ['fusao-arcana', 1], ['jarro-da-cobica', 1], ['machado-do-desespero', 2], ['raio-celeste', 1], ['cilindro-magico', 1], ['fosso-armadilha', 2]]) },
      { id: 'oraculo-cego', nome: 'Oráculo Cego', titulo: 'Vidente do Abismo', visual: 'blindfolded oracle in tattered robes with floating cards around, dark mist',
        deck: d([['feiticeira-lunar', 2], ['serafim-do-julgamento', 1], ['kraken-ancestral', 1], ['mago-do-espelho', 3], ['aprendiz-arcano', 3], ['unicornio-prisma', 3], ['jarro-da-cobica', 1], ['correntes-de-luz', 1], ['tufao-arcano', 2], ['barreira-espelhada', 1], ['cilindro-magico', 1], ['fosso-armadilha', 1]]) },
    ],
    mestre: { id: 'zorag', nome: 'Zorag', titulo: 'o Rei das Sombras', mestre: true, lp: 16000,
      visual: 'colossal ancient shadow demon king with many eyes and horns, purple dark flames',
      deck: d([['serpente-celeste', 1], ['dragao-rubro-das-cinzas', 2], ['mago-sombrio-supremo', 1], ['arquidemonio-das-caveiras', 2], ['bruxa-carmesim', 3], ['ninja-das-sombras', 3], ['espectro-sorrateiro', 2], ['cavaleiro-do-eclipse', 1], ['samurai-do-vento', 3], ['jarro-da-cobica', 1], ['raio-celeste', 1], ['vortice-sombrio', 1], ['ressurreicao-sagrada', 1], ['machado-do-desespero', 2], ['barreira-espelhada', 1], ['cilindro-magico', 1], ['fosso-armadilha', 2]]) },
  },
]

export const arena = (id: string) => ARENAS.find((a) => a.id === id)!

export function oponente(id: string): Oponente | undefined {
  for (const a of ARENAS) {
    const o = a.mestre.id === id ? a.mestre : a.oponentes.find((x) => x.id === id)
    if (o) return o
  }
}

export const indiceDaArena = (id: string) => ARENAS.findIndex((a) => a.id === id)
