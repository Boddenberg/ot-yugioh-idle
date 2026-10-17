// O banco de cartas. Tudo que o duelo sabe de uma carta mora aqui: os números
// (nível, ATK, DEF), o que ela faz (efeitos em forma de dado, que o motor lê em
// duelo.ts) e a descrição em inglês que gerou a arte no PixelLab
// (ferramentas/gerar-arte.mjs). Os nomes são próprios: o jogo é uma homenagem
// ao Duel Monsters, não uma cópia das cartas oficiais.

export type Atributo = 'trevas' | 'luz' | 'fogo' | 'agua' | 'terra' | 'vento' | 'divino'
export type Raridade = 'comum' | 'rara' | 'super' | 'ultra' | 'secreta'

export type Efeito =
  | { tipo: 'aoInvocarDano'; valor: number }
  | { tipo: 'aoInvocarCura'; valor: number }
  | { tipo: 'aoInvocarComprar'; valor: number }
  | { tipo: 'aoInvocarDestruirFraco' }
  | { tipo: 'aoDestruidoComprar'; valor: number }
  | { tipo: 'perfurar' }
  | { tipo: 'ataqueDireto' }
  | { tipo: 'imuneArmadilha' }
  | { tipo: 'duploAtaque' }

export type AcaoMagia =
  | { tipo: 'comprar'; valor: number }
  | { tipo: 'dano'; valor: number }
  | { tipo: 'cura'; valor: number }
  | { tipo: 'equipar'; atk: number }
  | { tipo: 'destruirMonstrosDoOponente' }
  | { tipo: 'destruirTodosOsMonstros' }
  | { tipo: 'destruirMagiaArmadilha' }
  | { tipo: 'ressuscitar' }
  | { tipo: 'fusao' }
  | { tipo: 'correntes'; turnos: number }

export type GatilhoArmadilha =
  | { tipo: 'barreiraEspelhada' }
  | { tipo: 'cilindro' }
  | { tipo: 'negarAtaque' }
  | { tipo: 'espinhos'; atkMaximo: number }
  | { tipo: 'fosso'; atkMinimo: number }

interface Base {
  id: string
  nome: string
  raridade: Raridade
  texto: string
  // a arte, em inglês, como foi pedida ao PixelLab
  visual: string
}

export interface CartaMonstro extends Base {
  tipo: 'monstro'
  atributo: Atributo
  raca: string
  nivel: number
  atk: number
  def: number
  efeitos: Efeito[]
  // monstro de fusão: mora no Deck Extra e nasce destes materiais
  materiais?: string[]
}

export interface CartaMagia extends Base {
  tipo: 'magia'
  icone: 'normal' | 'equipamento' | 'rapida' | 'continua'
  acao: AcaoMagia
}

export interface CartaArmadilha extends Base {
  tipo: 'armadilha'
  icone: 'normal' | 'contra'
  gatilho: GatilhoArmadilha
}

export type Carta = CartaMonstro | CartaMagia | CartaArmadilha

const m = (
  id: string, nome: string, atributo: Atributo, raca: string, nivel: number, atk: number, def: number,
  raridade: Raridade, texto: string, visual: string, efeitos: Efeito[] = [], materiais?: string[],
): CartaMonstro => ({ id, nome, tipo: 'monstro', atributo, raca, nivel, atk, def, raridade, texto, visual, efeitos, ...(materiais && { materiais }) })

export const CARTAS: Carta[] = [
  // ── monstros de nível 1 a 4: entram sem tributo ──
  m('soldado-de-bronze', 'Soldado de Bronze', 'terra', 'Guerreiro', 3, 1200, 1000, 'comum',
    'Veterano das muralhas do porto. Nunca recua, nunca avança demais.',
    'bronze armored foot soldier with spear and round shield, stone fortress wall background'),
  m('lobo-das-brumas', 'Lobo das Brumas', 'vento', 'Fera', 3, 1300, 900, 'comum',
    'Caça em silêncio nas noites de neblina.',
    'grey wolf howling in thick mist, moonlit forest background'),
  m('aprendiz-arcano', 'Aprendiz Arcano', 'luz', 'Mago', 2, 800, 1200, 'comum',
    'Quando é Invocado: compre 1 carta.',
    'young apprentice wizard in blue robes reading a glowing spellbook, library background',
    [{ tipo: 'aoInvocarComprar', valor: 1 }]),
  m('esqueleto-guardiao', 'Esqueleto Guardião', 'trevas', 'Zumbi', 3, 1100, 1400, 'comum',
    'Guarda túmulos esquecidos com uma lealdade que a morte não quebrou.',
    'skeleton warrior with rusty sword and tattered cape in a crypt, green ghost light'),
  m('salamandra-ardente', 'Salamandra Ardente', 'fogo', 'Piro', 4, 1500, 1000, 'comum',
    'Seu rastro derrete a pedra do vulcão.',
    'fire salamander lizard covered in flames, volcano lava background'),
  m('tritao-de-coral', 'Tritão de Coral', 'agua', 'Aqua', 4, 1400, 1600, 'comum',
    'Sentinela dos recifes, armado com um tridente de coral vivo.',
    'merman warrior with coral trident underwater, coral reef background'),
  m('golem-de-musgo', 'Golem de Musgo', 'terra', 'Rocha', 4, 1000, 2000, 'comum',
    'Uma muralha que respira.',
    'moss covered stone golem standing in ancient forest ruins'),
  m('fada-do-orvalho', 'Fada do Orvalho', 'luz', 'Fada', 2, 600, 800, 'comum',
    'Quando é Invocada: você ganha 500 LP.',
    'tiny fairy with dragonfly wings sparkling with dew drops, flower meadow at dawn',
    [{ tipo: 'aoInvocarCura', valor: 500 }]),
  m('besouro-de-aco', 'Besouro de Aço', 'terra', 'Inseto', 3, 1000, 1500, 'comum',
    'A carapaça desvia lâminas e flechas.',
    'giant metallic steel beetle with shiny armored shell, rocky canyon background'),
  m('sentinela-de-engrenagens', 'Sentinela de Engrenagens', 'trevas', 'Máquina', 4, 1600, 1200, 'comum',
    'Uma máquina de guerra que ninguém lembra de ter construído.',
    'clockwork sentinel robot with gears and red glowing eye, dark factory background'),
  m('diabrete-risonho', 'Diabrete Risonho', 'trevas', 'Demônio', 3, 1300, 600, 'comum',
    'Quando é Invocado: causa 300 de dano ao oponente.',
    'small grinning purple imp demon with bat wings throwing a fireball, dark purple background',
    [{ tipo: 'aoInvocarDano', valor: 300 }]),
  m('cavaleiro-da-aurora', 'Cavaleiro da Aurora', 'luz', 'Guerreiro', 4, 1800, 1200, 'rara',
    'Chega com o primeiro raio de sol e parte com o último inimigo.',
    'shining knight in white and gold armor raising a sword at sunrise'),
  m('espectro-sorrateiro', 'Espectro Sorrateiro', 'trevas', 'Zumbi', 3, 900, 500, 'rara',
    'Pode atacar diretamente o oponente.',
    'translucent ghost specter with hood floating through a wall, haunted corridor',
    [{ tipo: 'ataqueDireto' }]),
  m('dragao-filhote-rubi', 'Dragão Filhote Rubi', 'fogo', 'Dragão', 4, 1700, 1100, 'rara',
    'Ainda cabe num ninho. Por pouco tempo.',
    'young red baby dragon breathing small flame, nest of eggs on a cliff'),
  m('mago-do-espelho', 'Mago do Espelho', 'luz', 'Mago', 4, 1600, 1700, 'rara',
    'Devolve cada feitiço com um sorriso educado.',
    'wizard in silver robes holding a magic mirror reflecting light, crystal hall'),
  m('mecha-lanca-chamas', 'Mecha Lança-Chamas', 'fogo', 'Máquina', 4, 1900, 0, 'rara',
    'Tudo ataque, nenhuma defesa.',
    'small orange combat mech robot shooting a flamethrower, burning battlefield'),
  m('serpente-abissal', 'Serpente Abissal', 'agua', 'Serpente Marinha', 4, 1800, 1000, 'rara',
    'Perfurar: ao atacar um monstro em Defesa com DEF menor, causa a diferença como dano.',
    'dark blue sea serpent rising from deep ocean waves, stormy night',
    [{ tipo: 'perfurar' }]),
  m('samurai-do-vento', 'Samurai do Vento', 'vento', 'Guerreiro', 4, 1900, 1100, 'rara',
    'O corte chega antes do som da lâmina.',
    'samurai warrior with katana in a swirl of wind and falling leaves'),
  m('bruxa-carmesim', 'Bruxa Carmesim', 'trevas', 'Mago', 4, 1500, 1200, 'super',
    'Quando é Invocada: destrói o monstro de menor ATK do oponente.',
    'witch in crimson robes casting dark red magic, full moon behind',
    [{ tipo: 'aoInvocarDestruirFraco' }]),
  m('unicornio-prisma', 'Unicórnio Prisma', 'luz', 'Fera', 4, 1600, 1400, 'rara',
    'Quando é destruído: compre 1 carta.',
    'white unicorn with rainbow prism horn galloping through light',
    [{ tipo: 'aoDestruidoComprar', valor: 1 }]),
  m('harpia-da-tempestade', 'Harpia da Tempestade', 'vento', 'Fera Alada', 4, 1700, 1300, 'rara',
    'Mergulha das nuvens carregadas sem aviso.',
    'harpy woman with green feathered wings and talons flying in a thunderstorm'),
  m('ninja-das-sombras', 'Ninja das Sombras', 'trevas', 'Guerreiro', 4, 1500, 800, 'super',
    'Pode atacar duas vezes em cada Fase de Batalha.',
    'shadow ninja with two daggers leaping across rooftops at night',
    [{ tipo: 'duploAtaque' }]),

  // ── nível 5 e 6: um tributo ──
  m('ogro-da-montanha', 'Ogro da Montanha', 'terra', 'Demônio', 5, 2100, 1600, 'rara',
    'Arranca pinheiros para usar como clava.',
    'huge green mountain ogre with a tree trunk club, snowy mountains'),
  m('grifo-dourado', 'Grifo Dourado', 'vento', 'Fera Alada', 5, 2200, 1800, 'super',
    'Senhor dos céus acima das pirâmides.',
    'golden griffin with eagle head and lion body spreading wings over desert pyramids'),
  m('arquidemonio-das-caveiras', 'Arquidemônio das Caveiras', 'trevas', 'Demônio', 6, 2500, 1200, 'super',
    'Os relâmpagos obedecem ao estalar de seus ossos.',
    'skeletal archdemon with bone armor and purple lightning crackling, dark storm'),
  m('cavaleiro-do-eclipse', 'Cavaleiro do Eclipse', 'trevas', 'Guerreiro', 6, 2400, 1800, 'super',
    'Perfurar: causa dano mesmo atacando monstros em Defesa.',
    'black armored knight with a lance riding a dark horse under a solar eclipse',
    [{ tipo: 'perfurar' }]),
  m('leviata-das-mares', 'Leviatã das Marés', 'agua', 'Serpente Marinha', 6, 2300, 2000, 'super',
    'Quando se move, o mar inteiro se move junto.',
    'colossal blue leviathan sea monster emerging from a giant wave'),
  m('colosso-a-vapor', 'Colosso a Vapor', 'fogo', 'Máquina', 6, 2500, 1200, 'super',
    'Uma caldeira com punhos.',
    'giant steampunk steam colossus robot with smoking chimneys and brass fists'),
  m('feiticeira-lunar', 'Feiticeira Lunar', 'luz', 'Mago', 6, 2200, 2400, 'super',
    'Quando é Invocada: você ganha 1000 LP.',
    'sorceress with silver hair holding a crescent moon staff, starry night sky',
    [{ tipo: 'aoInvocarCura', valor: 1000 }]),

  // ── nível 7 e 8: dois tributos ──
  m('mago-sombrio-supremo', 'Mago Sombrio Supremo', 'trevas', 'Mago', 7, 2500, 2100, 'ultra',
    'O mais poderoso dos magos em ataque e defesa.',
    'powerful dark magician in purple pointed armor robes holding a green orb staff, magic circle background'),
  m('dragao-alvo-celestial', 'Dragão Alvo Celestial', 'luz', 'Dragão', 8, 3000, 2500, 'ultra',
    'Lendário dragão de poder destrutivo. Quase nenhum duelista o viu de perto.',
    'majestic white dragon with glowing blue eyes roaring, lightning sky background'),
  m('dragao-rubro-das-cinzas', 'Dragão Rubro das Cinzas', 'trevas', 'Dragão', 7, 2400, 2000, 'ultra',
    'Um dragão feroz com um ataque mortal. Seus olhos guardam um potencial sem limite.',
    'black dragon with glowing red eyes spreading wings over volcanic ash'),
  m('tita-de-obsidiana', 'Titã de Obsidiana', 'terra', 'Rocha', 8, 2800, 3000, 'ultra',
    'Esculpido pela própria montanha.',
    'giant obsidian rock titan with glowing orange cracks, mountain cavern'),
  m('fenix-solar', 'Fênix Solar', 'fogo', 'Piro', 7, 2600, 1800, 'ultra',
    'Quando é Invocada: causa 500 de dano ao oponente.',
    'radiant phoenix of golden fire rising from flames with spread wings',
    [{ tipo: 'aoInvocarDano', valor: 500 }]),
  m('kraken-ancestral', 'Kraken Ancestral', 'agua', 'Aqua', 7, 2700, 2300, 'ultra',
    'Afundou frotas inteiras antes que existissem mapas.',
    'ancient giant kraken octopus attacking a sailing ship, dark ocean'),
  m('serafim-do-julgamento', 'Serafim do Julgamento', 'luz', 'Fada', 8, 2900, 2400, 'secreta',
    'Quando é Invocado: destrói o monstro de menor ATK do oponente.',
    'six winged seraph angel with a flaming sword descending from heavenly light',
    [{ tipo: 'aoInvocarDestruirFraco' }]),

  // ── os Deuses do Milênio: nível 10, três tributos ──
  m('deus-falcao-do-sol', 'Deus-Falcão do Sol', 'divino', 'Besta Divina', 10, 4000, 4000, 'secreta',
    'Imune a Armadilhas. Quando é Invocado: destrói o monstro de menor ATK do oponente.',
    'giant golden divine falcon god made of sunfire with egyptian ornaments, glowing sun disk',
    [{ tipo: 'imuneArmadilha' }, { tipo: 'aoInvocarDestruirFraco' }]),
  m('serpente-celeste', 'Serpente Celeste dos Céus', 'divino', 'Besta Divina', 10, 3500, 3500, 'secreta',
    'Pode atacar duas vezes em cada Fase de Batalha.',
    'colossal red divine sky serpent dragon with two mouths coiling through storm clouds',
    [{ tipo: 'duploAtaque' }]),
  m('guardiao-titanico', 'Guardião Titânico do Nilo', 'divino', 'Besta Divina', 10, 4000, 4000, 'secreta',
    'Imune a Armadilhas. Perfurar.',
    'colossal blue divine titan guardian with horned egyptian crown and giant fists',
    [{ tipo: 'imuneArmadilha' }, { tipo: 'perfurar' }]),

  // ── monstros de fusão (Deck Extra) ──
  m('cavaleiro-dragao-do-eclipse', 'Cavaleiro Dragão do Eclipse', 'trevas', 'Dragão', 8, 3200, 2500, 'ultra',
    '"Cavaleiro do Eclipse" + "Dragão Rubro das Cinzas". Perfurar.',
    'black armored knight riding a red-eyed black dragon, eclipse sky',
    [{ tipo: 'perfurar' }], ['cavaleiro-do-eclipse', 'dragao-rubro-das-cinzas']),
  m('quimera-flamejante', 'Quimera Flamejante', 'fogo', 'Fera', 6, 2300, 1500, 'super',
    '"Salamandra Ardente" + "Lobo das Brumas".',
    'fiery chimera beast with wolf head and lizard tail made of fire',
    [], ['salamandra-ardente', 'lobo-das-brumas']),
  m('golem-vulcanico', 'Golem Vulcânico', 'fogo', 'Rocha', 6, 2400, 2200, 'super',
    '"Golem de Musgo" + "Salamandra Ardente".',
    'volcanic rock golem with lava flowing through its body',
    [], ['golem-de-musgo', 'salamandra-ardente']),
  m('mago-arcano-da-aurora', 'Mago Arcano da Aurora', 'luz', 'Mago', 7, 2600, 2100, 'ultra',
    '"Aprendiz Arcano" + "Cavaleiro da Aurora". Quando é Invocado: compre 1 carta.',
    'paladin wizard in gold armor holding a glowing staff and sword, sunrise temple',
    [{ tipo: 'aoInvocarComprar', valor: 1 }], ['aprendiz-arcano', 'cavaleiro-da-aurora']),
  m('leviata-mecanico', 'Leviatã Mecânico', 'agua', 'Máquina', 7, 2700, 2200, 'ultra',
    '"Sentinela de Engrenagens" + "Tritão de Coral".',
    'mechanical steel sea serpent submarine robot with glowing blue lights underwater',
    [], ['sentinela-de-engrenagens', 'tritao-de-coral']),
  m('dragao-alvo-supremo', 'Dragão Alvo Supremo', 'luz', 'Dragão', 10, 4500, 3800, 'secreta',
    '"Dragão Alvo Celestial" + "Dragão Alvo Celestial". Perfurar.',
    'three headed white dragon with glowing blue eyes, cosmic light explosion',
    [{ tipo: 'perfurar' }], ['dragao-alvo-celestial', 'dragao-alvo-celestial']),

  // ── cartas mágicas ──
  { id: 'jarro-da-cobica', nome: 'Jarro da Cobiça', tipo: 'magia', icone: 'normal', raridade: 'rara',
    acao: { tipo: 'comprar', valor: 2 }, texto: 'Compre 2 cartas.',
    visual: 'grinning green ceramic jar with a greedy face, treasure gold coins around' },
  { id: 'bola-de-fogo-arcana', nome: 'Bola de Fogo Arcana', tipo: 'magia', icone: 'normal', raridade: 'comum',
    acao: { tipo: 'dano', valor: 500 }, texto: 'Causa 500 de dano ao oponente.',
    visual: 'blazing fireball spell flying through the air, magic sparks' },
  { id: 'chuva-de-meteoros', nome: 'Chuva de Meteoros', tipo: 'magia', icone: 'normal', raridade: 'rara',
    acao: { tipo: 'dano', valor: 1000 }, texto: 'Causa 1000 de dano ao oponente.',
    visual: 'meteor shower raining down fiery rocks on a battlefield at night' },
  { id: 'calice-curativo', nome: 'Cálice Curativo', tipo: 'magia', icone: 'normal', raridade: 'comum',
    acao: { tipo: 'cura', valor: 1000 }, texto: 'Você ganha 1000 LP.',
    visual: 'golden chalice overflowing with glowing green healing water' },
  { id: 'lamina-mistica', nome: 'Lâmina Mística', tipo: 'magia', icone: 'equipamento', raridade: 'comum',
    acao: { tipo: 'equipar', atk: 500 }, texto: 'Equipe a um monstro seu: ele ganha 500 de ATK.',
    visual: 'mystic short sword glowing with blue runes floating above an altar' },
  { id: 'machado-do-desespero', nome: 'Machado do Desespero', tipo: 'magia', icone: 'equipamento', raridade: 'rara',
    acao: { tipo: 'equipar', atk: 1000 }, texto: 'Equipe a um monstro seu: ele ganha 1000 de ATK.',
    visual: 'monstrous dark axe with a screaming face on the blade, purple aura' },
  { id: 'raio-celeste', nome: 'Raio Celeste', tipo: 'magia', icone: 'normal', raridade: 'ultra',
    acao: { tipo: 'destruirMonstrosDoOponente' }, texto: 'Destrói todos os monstros que o oponente controla.',
    visual: 'massive lightning bolts striking down from storm clouds destroying monsters' },
  { id: 'vortice-sombrio', nome: 'Vórtice Sombrio', tipo: 'magia', icone: 'normal', raridade: 'super',
    acao: { tipo: 'destruirTodosOsMonstros' }, texto: 'Destrói todos os monstros no campo.',
    visual: 'swirling black hole vortex sucking in everything, purple cosmic energy' },
  { id: 'tufao-arcano', nome: 'Tufão Arcano', tipo: 'magia', icone: 'rapida', raridade: 'comum',
    acao: { tipo: 'destruirMagiaArmadilha' }, texto: 'Destrói 1 Magia ou Armadilha do oponente.',
    visual: 'green magical whirlwind typhoon tearing cards apart' },
  { id: 'ressurreicao-sagrada', nome: 'Ressurreição Sagrada', tipo: 'magia', icone: 'normal', raridade: 'super',
    acao: { tipo: 'ressuscitar' }, texto: 'Invoca o monstro mais forte de qualquer cemitério para o seu lado do campo.',
    visual: 'egyptian ankh symbol glowing with holy light rising from a tomb' },
  { id: 'fusao-arcana', nome: 'Fusão Arcana', tipo: 'magia', icone: 'normal', raridade: 'rara',
    acao: { tipo: 'fusao' }, texto: 'Funde materiais da sua mão ou campo e invoca um Monstro de Fusão do Deck Extra.',
    visual: 'two monsters merging in a swirling rainbow vortex of fusion energy' },
  { id: 'correntes-de-luz', nome: 'Correntes de Luz', tipo: 'magia', icone: 'continua', raridade: 'super',
    acao: { tipo: 'correntes', turnos: 3 }, texto: 'O oponente não pode atacar por 3 turnos dele.',
    visual: 'glowing swords of light piercing the ground forming a cage' },

  // ── cartas armadilha ──
  { id: 'barreira-espelhada', nome: 'Barreira Espelhada', tipo: 'armadilha', icone: 'normal', raridade: 'ultra',
    gatilho: { tipo: 'barreiraEspelhada' }, texto: 'Quando o oponente declara um ataque: destrói todos os monstros dele em Posição de Ataque.',
    visual: 'shimmering mirror force field barrier reflecting a beam of energy' },
  { id: 'cilindro-magico', nome: 'Cilindro Mágico', tipo: 'armadilha', icone: 'normal', raridade: 'super',
    gatilho: { tipo: 'cilindro' }, texto: 'Quando o oponente declara um ataque: anula-o e causa ao oponente dano igual ao ATK do atacante.',
    visual: 'two magical top hat cylinders swallowing a blast of energy, stage magic' },
  { id: 'escudo-negador', nome: 'Escudo Negador', tipo: 'armadilha', icone: 'contra', raridade: 'comum',
    gatilho: { tipo: 'negarAtaque' }, texto: 'Quando o oponente declara um ataque: anula o ataque e encerra a Fase de Batalha.',
    visual: 'swirling blue vortex shield absorbing an attack' },
  { id: 'cova-de-espinhos', nome: 'Cova de Espinhos', tipo: 'armadilha', icone: 'normal', raridade: 'comum',
    gatilho: { tipo: 'espinhos', atkMaximo: 1500 }, texto: 'Quando um monstro com 1500 ou menos de ATK ataca: destrói o atacante.',
    visual: 'pit full of sharp iron spikes hidden under the ground' },
  { id: 'fosso-armadilha', nome: 'Fosso Armadilha', tipo: 'armadilha', icone: 'normal', raridade: 'rara',
    gatilho: { tipo: 'fosso', atkMinimo: 1000 }, texto: 'Quando o oponente Invoca um monstro com 1000 ou mais de ATK: destrói esse monstro.',
    visual: 'deep dark trap hole opening in the floor with monster claws falling in' },
]

const PORID = new Map(CARTAS.map((c) => [c.id, c]))

export function carta(id: string): Carta {
  const c = PORID.get(id)
  if (!c) throw new Error(`carta desconhecida: ${id}`)
  return c
}

export const existe = (id: string) => PORID.has(id)
export const ehMonstro = (c: Carta): c is CartaMonstro => c.tipo === 'monstro'
export const ehFusao = (c: Carta): c is CartaMonstro => c.tipo === 'monstro' && !!c.materiais

// quantos tributos o monstro pede para entrar por Invocação-Tributo
export const tributos = (nivel: number) => (nivel >= 10 ? 3 : nivel >= 7 ? 2 : nivel >= 5 ? 1 : 0)

export const RARIDADES: Record<Raridade, { nome: string; sigla: string; po: number; peso: number }> = {
  comum: { nome: 'Comum', sigla: 'C', po: 5, peso: 100 },
  rara: { nome: 'Rara', sigla: 'R', po: 20, peso: 40 },
  super: { nome: 'Super Rara', sigla: 'SR', po: 60, peso: 14 },
  ultra: { nome: 'Ultra Rara', sigla: 'UR', po: 200, peso: 4 },
  secreta: { nome: 'Rara Secreta', sigla: 'ScR', po: 600, peso: 1 },
}

export const ATRIBUTOS: Record<Atributo, { nome: string; kanji: string }> = {
  trevas: { nome: 'TREVAS', kanji: '闇' },
  luz: { nome: 'LUZ', kanji: '光' },
  fogo: { nome: 'FOGO', kanji: '炎' },
  agua: { nome: 'ÁGUA', kanji: '水' },
  terra: { nome: 'TERRA', kanji: '地' },
  vento: { nome: 'VENTO', kanji: '風' },
  divino: { nome: 'DIVINO', kanji: '神' },
}
