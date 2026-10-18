// As sete Relíquias do Milênio: cada mestre de arena guarda uma. Ficam com o
// duelista para sempre e mudam o jogo inteiro (não só um duelo).

export type IdReliquia = 'colar' | 'enigma' | 'anel' | 'cetro' | 'balanca' | 'olho' | 'chave'

export interface Reliquia {
  id: IdReliquia
  nome: string
  efeito: string
  visual: string
}

export const RELIQUIAS: Reliquia[] = [
  { id: 'colar', nome: 'Colar do Milênio', efeito: 'Começa cada duelo com 1 carta a mais na mão.',
    visual: 'golden egyptian necklace pendant with the eye of horus, glowing' },
  { id: 'enigma', nome: 'Enigma do Milênio', efeito: '+25% de experiência em todo duelo.',
    visual: 'golden inverted pyramid puzzle pendant with the eye of horus engraved, glowing' },
  { id: 'anel', nome: 'Anel do Milênio', efeito: '+50% de chance de ganhar carta ao vencer.',
    visual: 'golden egyptian ring with a triangle and the eye of horus and five hanging spikes, glowing' },
  { id: 'cetro', nome: 'Cetro do Milênio', efeito: '+25% de Pontos de Duelo.',
    visual: 'golden egyptian scepter rod with the eye of horus and two wings, glowing' },
  { id: 'balanca', nome: 'Balança do Milênio', efeito: 'Começa cada duelo com +1000 LP.',
    visual: 'golden egyptian balance scales with the eye of horus, glowing' },
  { id: 'olho', nome: 'Olho do Milênio', efeito: 'Enxerga as cartas viradas para baixo do oponente: o seu duelista não ataca às cegas.',
    visual: 'golden egyptian eye of horus orb artifact, glowing' },
  { id: 'chave', nome: 'Chave do Milênio', efeito: 'O progresso com o jogo fechado sobe de 50% para 90%.',
    visual: 'golden egyptian ankh key with the eye of horus, glowing' },
]

export const reliquia = (id: string) => RELIQUIAS.find((r) => r.id === id)!
