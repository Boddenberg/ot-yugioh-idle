// O duelista que fica: nível, Pontos de Duelo (DP), Pó Estelar, coleção, deck,
// relíquias, estatísticas. Tudo que acontece entre um duelo e outro (a
// recompensa, a carta ganha, o pacote aberto, a fusão no altar, o progresso com
// o jogo fechado) é uma função pura daqui: recebe o estado, devolve o novo.
import { Aleatorio } from './aleatorio'
import { ARENAS, indiceDaArena, type Arena, type Oponente } from './arenas'
import { carta, CARTAS, ehFusao, RARIDADES, tributos, type Carta, type CartaMonstro } from './cartas'
import { duelarAteOFim, ESTRATEGIA_PADRAO, novoDuelo, type Estrategia, type OpcoesDoLado } from './duelo'
import type { IdReliquia } from './reliquias'

export interface Resultado {
  quando: number
  oponente: string
  arena: string
  venceu: boolean | null
  dp: number
  xp: number
  carta?: string
  reliquia?: IdReliquia
  subiuPara?: number
}

export interface Estatisticas {
  duelos: number
  vitorias: number
  derrotas: number
  empates: number
  cartasGanhas: number
  pacotesAbertos: number
  dpGanhos: number
  porArena: Record<string, { v: number; d: number }>
}

export interface Estado {
  versao: 1
  nome: string
  avatar: string
  nivel: number
  xp: number
  dp: number
  po: number
  colecao: Record<string, number>
  deck: string[]
  arena: string
  mestresVencidos: string[]
  reliquias: IdReliquia[]
  estrategia: Estrategia
  estatisticas: Estatisticas
  historico: Resultado[]
  // o próximo duelo é contra o mestre da arena
  desafioAoMestre: boolean
  velocidade: number
  salvoEm: number
  criadoEm: number
}

export const DECK_MIN = 20
export const DECK_MAX = 40
export const COPIAS_MAX = 3

export const DECK_INICIAL = [
  ['soldado-de-bronze', 3], ['lobo-das-brumas', 3], ['aprendiz-arcano', 2], ['esqueleto-guardiao', 2], ['salamandra-ardente', 2],
  ['tritao-de-coral', 2], ['golem-de-musgo', 2], ['fada-do-orvalho', 2], ['besouro-de-aco', 2], ['bola-de-fogo-arcana', 2],
  ['calice-curativo', 1], ['lamina-mistica', 2], ['escudo-negador', 1], ['cova-de-espinhos', 1],
] as const

export function novoEstado(nome: string, avatar: string, agora = Date.now()): Estado {
  const colecao: Record<string, number> = {}
  const deck: string[] = []
  for (const [id, n] of DECK_INICIAL) {
    colecao[id] = n
    for (let i = 0; i < n; i++) deck.push(id)
  }
  return {
    versao: 1, nome, avatar, nivel: 1, xp: 0, dp: 300, po: 0, colecao, deck, arena: ARENAS[0].id,
    mestresVencidos: [], reliquias: [], estrategia: { ...ESTRATEGIA_PADRAO },
    estatisticas: { duelos: 0, vitorias: 0, derrotas: 0, empates: 0, cartasGanhas: 0, pacotesAbertos: 0, dpGanhos: 0, porArena: {} },
    historico: [], desafioAoMestre: false, velocidade: 1, salvoEm: agora, criadoEm: agora,
  }
}

// ── nível ──

export const xpParaSubir = (nivel: number) => Math.round(60 * Math.pow(nivel, 1.6))
export const NIVEL_MAXIMO = 60

export function titulo(nivel: number) {
  if (nivel >= 50) return 'Rei dos Duelistas'
  if (nivel >= 40) return 'Duelista Lendário'
  if (nivel >= 30) return 'Mestre Duelista'
  if (nivel >= 20) return 'Duelista de Elite'
  if (nivel >= 10) return 'Duelista Experiente'
  if (nivel >= 5) return 'Duelista'
  return 'Novato'
}

function ganharXp(e: Estado, xp: number): number | undefined {
  e.xp += xp
  let subiu: number | undefined
  while (e.nivel < NIVEL_MAXIMO && e.xp >= xpParaSubir(e.nivel)) {
    e.xp -= xpParaSubir(e.nivel)
    e.nivel++
    subiu = e.nivel
  }
  if (e.nivel >= NIVEL_MAXIMO) e.xp = 0
  return subiu
}

// ── arenas ──

export function arenaLiberada(e: Estado, a: Arena) {
  const i = indiceDaArena(a.id)
  return e.nivel >= a.nivel && (i === 0 || e.mestresVencidos.includes(ARENAS[i - 1].mestre.id))
}

export function recompensaBase(indice: number, mestre: boolean) {
  const dp = Math.round(25 * Math.pow(1.55, indice)) * (mestre ? 5 : 1)
  const xp = Math.round(30 * Math.pow(1.6, indice)) * (mestre ? 5 : 1)
  return { dp, xp }
}

export function escolherOponente(e: Estado, rng: Aleatorio): { arena: Arena; oponente: Oponente } {
  const arena = ARENAS[indiceDaArena(e.arena)] ?? ARENAS[0]
  return { arena, oponente: e.desafioAoMestre ? arena.mestre : rng.escolher(arena.oponentes) }
}

// ── os dois lados do duelo ──

export function opcoesDoJogador(e: Estado): OpcoesDoLado {
  const extra = Object.entries(e.colecao).flatMap(([id, n]) => (ehFusao(carta(id)) ? Array<string>(Math.min(n, COPIAS_MAX)).fill(id) : []))
  return {
    nome: e.nome,
    deck: e.deck,
    extra,
    lp: 8000 + (e.reliquias.includes('balanca') ? 1000 : 0),
    maoInicial: 5 + (e.reliquias.includes('colar') ? 1 : 0),
    olho: e.reliquias.includes('olho'),
    estrategia: e.estrategia,
  }
}

export function opcoesDoOponente(o: Oponente, arena: Arena): OpcoesDoLado {
  const i = indiceDaArena(arena.id)
  // os oponentes trazem as fusões que os decks deles sabem fazer
  const extra = CARTAS.filter((c): c is CartaMonstro => ehFusao(c) && c.materiais!.every((m) => o.deck.includes(m)) && o.deck.includes('fusao-arcana')).map((c) => c.id)
  return {
    nome: o.nome,
    deck: o.deck,
    extra,
    lp: o.lp ?? 8000,
    maoInicial: o.mestre && i >= 4 ? 6 : 5,
  }
}

// ── depois do duelo ──

function sortearPorRaridade(ids: string[], rng: Aleatorio, minima?: number): string {
  const ordem = ['comum', 'rara', 'super', 'ultra', 'secreta']
  const pool = ids.filter((id) => minima === undefined || ordem.indexOf(carta(id).raridade) >= minima)
  const usar = pool.length ? pool : ids
  const total = usar.reduce((s, id) => s + RARIDADES[carta(id).raridade].peso, 0)
  let r = rng.proximo() * total
  for (const id of usar) {
    r -= RARIDADES[carta(id).raridade].peso
    if (r <= 0) return id
  }
  return usar[usar.length - 1]
}

export function chanceDeCarta(e: Estado) {
  return 0.35 * (e.reliquias.includes('anel') ? 1.5 : 1)
}

export function aplicarResultado(e: Estado, arena: Arena, o: Oponente, vencedor: 0 | 1 | null, rng: Aleatorio, agora = Date.now()): Resultado {
  const i = indiceDaArena(arena.id)
  const mestre = !!o.mestre
  const base = recompensaBase(i, mestre)
  const venceu = vencedor === null ? null : vencedor === 0
  const fator = venceu ? 1 : venceu === null ? 0.5 : 0.3
  const dp = Math.round(base.dp * fator * (e.reliquias.includes('cetro') ? 1.25 : 1))
  const xp = Math.round(base.xp * fator * (e.reliquias.includes('enigma') ? 1.25 : 1))
  e.dp += dp
  e.estatisticas.dpGanhos += dp
  const subiuPara = ganharXp(e, xp)
  const r: Resultado = { quando: agora, oponente: o.id, arena: arena.id, venceu, dp, xp, ...(subiuPara && { subiuPara }) }

  const est = e.estatisticas
  est.duelos++
  if (venceu) est.vitorias++
  else if (venceu === false) est.derrotas++
  else est.empates++
  const pa = (est.porArena[arena.id] ??= { v: 0, d: 0 })
  if (venceu) pa.v++
  else pa.d++

  if (venceu) {
    if (mestre || rng.chance(chanceDeCarta(e))) {
      const id = sortearPorRaridade(o.deck, rng, mestre ? 1 : undefined)
      e.colecao[id] = (e.colecao[id] ?? 0) + 1
      est.cartasGanhas++
      r.carta = id
    }
    if (mestre && !e.mestresVencidos.includes(o.id)) {
      e.mestresVencidos.push(o.id)
      const rel = arena.reliquia as IdReliquia
      if (!e.reliquias.includes(rel)) {
        e.reliquias.push(rel)
        r.reliquia = rel
      }
    }
  }
  if (mestre) e.desafioAoMestre = false
  e.historico = [r, ...e.historico].slice(0, 30)
  return r
}

// ── coleção e deck ──

export const copias = (e: Estado, id: string) => e.colecao[id] ?? 0
export const noDeck = (e: Estado, id: string) => e.deck.filter((x) => x === id).length

export function problemaDoDeck(e: Estado, deck = e.deck): string | null {
  if (deck.length < DECK_MIN) return `O deck precisa de pelo menos ${DECK_MIN} cartas (tem ${deck.length}).`
  if (deck.length > DECK_MAX) return `O deck aceita no máximo ${DECK_MAX} cartas.`
  const conta = new Map<string, number>()
  for (const id of deck) conta.set(id, (conta.get(id) ?? 0) + 1)
  for (const [id, n] of conta) {
    if (ehFusao(carta(id))) return `${carta(id).nome} é um Monstro de Fusão: fica no Deck Extra.`
    if (n > COPIAS_MAX) return `No máximo ${COPIAS_MAX} cópias de ${carta(id).nome}.`
    if (n > copias(e, id)) return `Você só tem ${copias(e, id)} de ${carta(id).nome}.`
  }
  return null
}

export function colocarNoDeck(e: Estado, id: string): string | null {
  if (ehFusao(carta(id))) return 'Monstros de Fusão ficam no Deck Extra e entram sozinhos.'
  if (e.deck.length >= DECK_MAX) return `O deck aceita no máximo ${DECK_MAX} cartas.`
  if (noDeck(e, id) >= Math.min(COPIAS_MAX, copias(e, id))) return 'Não há mais cópias disponíveis.'
  e.deck.push(id)
  return null
}

export function tirarDoDeck(e: Estado, id: string) {
  const i = e.deck.lastIndexOf(id)
  if (i >= 0) e.deck.splice(i, 1)
}

// o deck que a IA montaria com a coleção: os melhores monstros, sem exagerar
// nos que pedem tributo, e as melhores magias e armadilhas
export function montarMelhorDeck(e: Estado): string[] {
  const valor = (c: Carta) => {
    if (c.tipo === 'monstro') return c.atk + c.def * 0.3 + c.efeitos.length * 300 - tributos(c.nivel) * 700
    const ordem = ['comum', 'rara', 'super', 'ultra', 'secreta']
    return 1400 + ordem.indexOf(c.raridade) * 400
  }
  const disponiveis = Object.entries(e.colecao)
    .filter(([id]) => !ehFusao(carta(id)))
    .flatMap(([id, n]) => Array<string>(Math.min(n, COPIAS_MAX)).fill(id))
    .sort((a, b) => valor(carta(b)) - valor(carta(a)))
  const deck: string[] = []
  let altos = 0
  let muitoAltos = 0
  let magias = 0
  const temFusao = Object.keys(e.colecao).some((id) => ehFusao(carta(id)))
  for (const id of disponiveis) {
    if (deck.length >= 30) break
    const c = carta(id)
    if (c.tipo === 'monstro') {
      const t = tributos(c.nivel)
      if (t >= 2 && muitoAltos >= 4) continue
      if (t === 1 && altos >= 5) continue
      if (t >= 2) muitoAltos++
      if (t === 1) altos++
    } else {
      if (magias >= 12) continue
      if (c.tipo === 'magia' && c.acao.tipo === 'fusao' && !temFusao) continue
      magias++
    }
    deck.push(id)
  }
  // completa até o mínimo com o que sobrou
  for (const id of disponiveis) {
    if (deck.length >= DECK_MIN) break
    if (deck.filter((x) => x === id).length < Math.min(COPIAS_MAX, copias(e, id))) deck.push(id)
  }
  return deck
}

// ── a loja ──

export interface Pacote {
  id: string
  nome: string
  arena: string
  preco: number
  cartas: string[]
  cor: string
}

const doDeck = (a: Arena) => [...new Set([...a.oponentes, a.mestre].flatMap((o) => o.deck))]

export const PACOTES: Pacote[] = ARENAS.map((a, i) => {
  const extra: Record<string, string[]> = {
    'pacote-dirigivel': ['quimera-flamejante', 'golem-vulcanico', 'fusao-arcana'],
    'pacote-torre': ['leviata-mecanico', 'mago-arcano-da-aurora', 'fusao-arcana'],
    'pacote-farao': ['cavaleiro-dragao-do-eclipse', 'dragao-alvo-celestial', 'serafim-do-julgamento'],
    'pacote-sombras': ['deus-falcao-do-sol', 'serpente-celeste', 'guardiao-titanico', 'dragao-alvo-supremo'],
  }
  const nomes = ['Lendas do Porto', 'Fúria Neon', 'Segredos da Ilha', 'Batalha nas Nuvens', 'Império de Vidro', 'Legado do Faraó', 'Jogo das Trevas']
  const cores = ['#2f6fb0', '#c43fd1', '#2f9e5a', '#d08a2a', '#2ab3c4', '#d4af37', '#7b2fd1']
  return {
    id: a.pacote, nome: nomes[i], arena: a.id, preco: Math.round(150 * Math.pow(1.7, i) / 10) * 10,
    cartas: [...new Set([...doDeck(a), ...(extra[a.pacote] ?? [])])], cor: cores[i],
  }
})

export const pacote = (id: string) => PACOTES.find((p) => p.id === id)!

export function pacoteLiberado(e: Estado, p: Pacote) {
  return arenaLiberada(e, ARENAS[indiceDaArena(p.arena)])
}

// cinco cartas: quatro sorteadas pela raridade, a última com Rara ou melhor
export function abrirPacote(e: Estado, id: string, rng: Aleatorio): string[] | string {
  const p = pacote(id)
  if (!pacoteLiberado(e, p)) return 'Esse pacote ainda não está à venda para você.'
  if (e.dp < p.preco) return 'Pontos de Duelo insuficientes.'
  e.dp -= p.preco
  const tiradas = [0, 1, 2, 3].map(() => sortearPorRaridade(p.cartas, rng))
  tiradas.push(sortearPorRaridade(p.cartas, rng, 1))
  for (const c of tiradas) e.colecao[c] = (e.colecao[c] ?? 0) + 1
  e.estatisticas.pacotesAbertos++
  e.estatisticas.cartasGanhas += tiradas.length
  return tiradas
}

// ── o Altar: desmontar e fundir ──

// as cópias que sobram (além das três que um deck usa) viram Pó Estelar
export const sobrando = (e: Estado, id: string) => Math.max(0, copias(e, id) - COPIAS_MAX)

export function desmontar(e: Estado, id: string, quantas = 1): string | null {
  const livres = copias(e, id) - noDeck(e, id)
  if (quantas > livres || quantas <= 0) return 'Essa carta está no deck ou você não tem cópias livres.'
  e.colecao[id] -= quantas
  if (e.colecao[id] <= 0) delete e.colecao[id]
  e.po += RARIDADES[carta(id).raridade].po * quantas
  return null
}

export function desmontarSobras(e: Estado): number {
  let po = 0
  for (const id of Object.keys(e.colecao)) {
    const n = sobrando(e, id)
    if (n > 0) {
      po += RARIDADES[carta(id).raridade].po * n
      e.colecao[id] -= n
    }
  }
  e.po += po
  return po
}

export const precoDaFusao = (id: string) => RARIDADES[carta(id).raridade].po * 3

// o altar ensina a fusão: precisa ter os materiais (não se gastam) e o pó
export function fundirNoAltar(e: Estado, id: string): string | null {
  const c = carta(id)
  if (!ehFusao(c)) return 'Não é um Monstro de Fusão.'
  const falta = c.materiais!.filter((m, _i, l) => copias(e, m) < l.filter((x) => x === m).length)
  if (falta.length) return `Faltam os materiais: ${[...new Set(falta)].map((m) => carta(m).nome).join(', ')}.`
  if (e.po < precoDaFusao(id)) return 'Pó Estelar insuficiente.'
  e.po -= precoDaFusao(id)
  e.colecao[id] = (e.colecao[id] ?? 0) + 1
  return null
}

// ── o jogo fechado ──

export const SEGUNDOS_POR_DUELO = 45
export const HORAS_MAXIMAS_FORA = 12

export interface Ausencia {
  segundos: number
  duelos: number
  vitorias: number
  derrotas: number
  dp: number
  xp: number
  cartas: string[]
  nivelAntes: number
  nivelDepois: number
}

export function progressoOffline(e: Estado, agora: number, semente = agora): Ausencia | null {
  const segundos = Math.min((agora - e.salvoEm) / 1000, HORAS_MAXIMAS_FORA * 3600)
  const eficiencia = e.reliquias.includes('chave') ? 0.9 : 0.5
  const duelos = Math.floor((segundos / SEGUNDOS_POR_DUELO) * eficiencia)
  e.salvoEm = agora
  if (duelos < 1 || problemaDoDeck(e)) return null
  const rng = new Aleatorio(semente)
  const r: Ausencia = { segundos, duelos, vitorias: 0, derrotas: 0, dp: 0, xp: 0, cartas: [], nivelAntes: e.nivel, nivelDepois: e.nivel }
  const mestre = e.desafioAoMestre
  // longe do jogo, só os duelos comuns (o mestre espera o jogador voltar)
  e.desafioAoMestre = false
  for (let i = 0; i < duelos; i++) {
    const { arena, oponente } = escolherOponente(e, rng)
    const d = novoDuelo(opcoesDoJogador(e), opcoesDoOponente(oponente, arena), Math.floor(rng.proximo() * 2 ** 31))
    const { vencedor } = duelarAteOFim(d)
    const res = aplicarResultado(e, arena, oponente, vencedor, rng, agora)
    if (res.venceu) r.vitorias++
    else r.derrotas++
    r.dp += res.dp
    r.xp += res.xp
    if (res.carta) r.cartas.push(res.carta)
  }
  e.desafioAoMestre = mestre
  r.nivelDepois = e.nivel
  return r
}

// ── salvar ──

export const CHAVE_DO_SAVE = 'ot-yugioh-idle:save'

export function lerSave(texto: string | null): Estado | null {
  if (!texto) return null
  try {
    const e = JSON.parse(texto) as Estado
    if (e.versao !== 1 || typeof e.nome !== 'string' || !e.colecao) return null
    // cartas que deixaram de existir não derrubam o save
    for (const id of Object.keys(e.colecao)) if (!CARTAS.some((c) => c.id === id)) delete e.colecao[id]
    e.deck = e.deck.filter((id) => e.colecao[id])
    e.estrategia = { ...ESTRATEGIA_PADRAO, ...e.estrategia }
    return e
  } catch {
    return null
  }
}

export const exportarSave = (e: Estado) => btoa(unescape(encodeURIComponent(JSON.stringify(e))))
export const importarSave = (codigo: string) => {
  try {
    return lerSave(decodeURIComponent(escape(atob(codigo.trim()))))
  } catch {
    return null
  }
}
