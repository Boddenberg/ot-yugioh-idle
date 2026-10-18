// O motor do duelo. Um duelo é um gerador: cada `next()` faz uma coisa (comprar,
// invocar, atacar, ativar uma armadilha) e devolve o evento que aconteceu, com
// o estado já mudado. A tela anda um passo por vez para animar; o progresso
// offline e os testes rodam até o fim de uma vez (`duelarAteOFim`).
//
// As regras são as do Duel Monsters clássico: 8000 LP, mão de 5, uma Invocação
// Normal por turno, tributos por nível (5-6: um, 7-8: dois, 10: três), sem
// ataque no primeiro turno, ATK contra ATK e ATK contra DEF, perfurar, deck
// vazio perde. Os dois lados são jogados pela mesma IA; o do jogador segue as
// regras que ele escolheu (Estrategia).
import { Aleatorio } from './aleatorio'
import { carta, ehMonstro, tributos, type Carta, type CartaArmadilha, type CartaMagia, type CartaMonstro } from './cartas'

export interface Estrategia {
  // monstro que não ganha do maior do oponente entra virado em defesa
  fracosEmDefesa: boolean
  // as magias de dano esperam juntar o suficiente para o golpe final
  guardarDanoParaOFinal: boolean
  // usa a cura só abaixo destes LP
  curarAbaixo: number
  // ataca monstros virados para baixo sem saber a DEF
  atacarViradas: boolean
  // o Vórtice Sombrio (destrói tudo) só quando o campo está perdendo
  vorticeSoPerdendo: boolean
}

export const ESTRATEGIA_PADRAO: Estrategia = {
  fracosEmDefesa: true,
  guardarDanoParaOFinal: false,
  curarAbaixo: 4000,
  atacarViradas: true,
  vorticeSoPerdendo: true,
}

export interface MonstroEmCampo {
  uid: number
  id: string
  posicao: 'ataque' | 'defesa'
  virado: boolean
  bonus: number
  ataques: number
  // turno em que chegou (não muda de posição no mesmo turno)
  chegou: number
  mudouNoTurno: number
}

export interface CartaNaZona {
  uid: number
  id: string
  virada: boolean
  equipadoEm?: number
}

export interface Lado {
  nome: string
  lp: number
  lpInicial: number
  deck: string[]
  mao: { uid: number; id: string }[]
  monstros: (MonstroEmCampo | null)[]
  zonas: (CartaNaZona | null)[]
  cemiterio: string[]
  extra: string[]
  // turnos (dele) em que não pode atacar: as Correntes de Luz
  presoPor: number
  olho: boolean
  estrategia: Estrategia
  invocouNoTurno: boolean
}

export type Fase = 'compra' | 'principal' | 'batalha' | 'final'

export type Evento =
  | { tipo: 'inicio'; texto: string }
  | { tipo: 'turno'; lado: 0 | 1; turno: number; texto: string }
  | { tipo: 'fase'; lado: 0 | 1; fase: Fase; texto: string }
  | { tipo: 'compra'; lado: 0 | 1; texto: string }
  | { tipo: 'invocacao'; lado: 0 | 1; zona: number; id: string; texto: string; especial?: 'fusao' | 'ressurreicao' | 'tributo' }
  | { tipo: 'colocar'; lado: 0 | 1; zona: number; id: string; texto: string; monstro: boolean }
  | { tipo: 'ativar'; lado: 0 | 1; id: string; texto: string }
  | { tipo: 'armadilha'; lado: 0 | 1; id: string; texto: string }
  | { tipo: 'ataque'; lado: 0 | 1; de: number; alvo: number | null; texto: string }
  | { tipo: 'revelar'; lado: 0 | 1; zona: number; id: string; texto: string }
  | { tipo: 'posicao'; lado: 0 | 1; zona: number; texto: string }
  | { tipo: 'destruir'; lado: 0 | 1; zona: number; id: string; texto: string; magia?: boolean }
  | { tipo: 'dano'; lado: 0 | 1; valor: number; texto: string }
  | { tipo: 'cura'; lado: 0 | 1; valor: number; texto: string }
  | { tipo: 'descarte'; lado: 0 | 1; id: string; texto: string }
  | { tipo: 'fim'; vencedor: 0 | 1 | null; motivo: string; texto: string }

export interface Duelo {
  lados: [Lado, Lado]
  vez: 0 | 1
  turno: number
  fase: Fase
  fim: { vencedor: 0 | 1 | null; motivo: string } | null
  rng: Aleatorio
  proximoUid: number
  passos: number
  maoInicial: [number, number]
}

export interface OpcoesDoLado {
  nome: string
  deck: string[]
  extra?: string[]
  lp?: number
  maoInicial?: number
  olho?: boolean
  estrategia?: Estrategia
}

export const LIMITE_DE_TURNOS = 80
const ZONAS = 5
const LIMITE_DA_MAO = 6

const outro = (l: 0 | 1): 0 | 1 => (l === 0 ? 1 : 0)
const nome = (id: string) => carta(id).nome
const monstro = (id: string) => carta(id) as CartaMonstro

export function atkDe(m: MonstroEmCampo) {
  return Math.max(0, monstro(m.id).atk + m.bonus)
}
export const defDe = (m: MonstroEmCampo) => monstro(m.id).def
const tem = (id: string, efeito: string) => monstro(id).efeitos.some((e) => e.tipo === efeito)

function embaralhar<T>(lista: T[], rng: Aleatorio) {
  for (let i = lista.length - 1; i > 0; i--) {
    const j = Math.floor(rng.proximo() * (i + 1))
    ;[lista[i], lista[j]] = [lista[j], lista[i]]
  }
  return lista
}

export function novoDuelo(a: OpcoesDoLado, b: OpcoesDoLado, semente = Date.now(), primeiro?: 0 | 1): Duelo {
  const rng = new Aleatorio(semente)
  const lado = (o: OpcoesDoLado): Lado => ({
    nome: o.nome,
    lp: o.lp ?? 8000,
    lpInicial: o.lp ?? 8000,
    deck: embaralhar(o.deck.filter((id) => !(carta(id) as CartaMonstro).materiais), rng),
    mao: [],
    monstros: Array(ZONAS).fill(null),
    zonas: Array(ZONAS).fill(null),
    cemiterio: [],
    extra: [...(o.extra ?? [])],
    presoPor: 0,
    olho: !!o.olho,
    estrategia: o.estrategia ?? ESTRATEGIA_PADRAO,
    invocouNoTurno: false,
  })
  const d: Duelo = {
    lados: [lado(a), lado(b)], vez: primeiro ?? (rng.chance(0.5) ? 0 : 1), turno: 0, fase: 'compra', fim: null, rng, proximoUid: 1, passos: 0,
    maoInicial: [a.maoInicial ?? 5, b.maoInicial ?? 5],
  }
  return d
}

// ── ajudantes de estado ──

function comprar(d: Duelo, l: 0 | 1): boolean {
  const lado = d.lados[l]
  const id = lado.deck.pop()
  if (!id) return false
  lado.mao.push({ uid: d.proximoUid++, id })
  return true
}

function terminar(d: Duelo, vencedor: 0 | 1 | null, motivo: string): Evento {
  d.fim = { vencedor, motivo }
  const texto = vencedor === null ? `Empate! ${motivo}` : `${d.lados[vencedor].nome} venceu o duelo! ${motivo}`
  return { tipo: 'fim', vencedor, motivo, texto }
}

function* dano(d: Duelo, l: 0 | 1, valor: number, porque = ''): Generator<Evento> {
  if (valor <= 0 || d.fim) return
  const lado = d.lados[l]
  lado.lp = Math.max(0, lado.lp - valor)
  yield { tipo: 'dano', lado: l, valor, texto: `${lado.nome} perde ${valor} LP${porque}.` }
  if (lado.lp <= 0) yield terminar(d, outro(l), `Os LP de ${lado.nome} chegaram a zero.`)
}

function* curar(d: Duelo, l: 0 | 1, valor: number): Generator<Evento> {
  d.lados[l].lp += valor
  yield { tipo: 'cura', lado: l, valor, texto: `${d.lados[l].nome} ganha ${valor} LP.` }
}

const monstrosDe = (lado: Lado) => lado.monstros.flatMap((m, zona) => (m ? [{ m, zona }] : []))
const zonaLivre = (lista: unknown[]) => lista.findIndex((x) => x === null)

// o que um lado acha que vale um monstro do oponente (virado: não sabe)
function forcaVista(m: MonstroEmCampo, olho: boolean) {
  if (m.virado && !olho) return 1500
  return m.posicao === 'ataque' ? atkDe(m) : Math.max(atkDe(m), defDe(m))
}

function* destruirMonstro(d: Duelo, l: 0 | 1, zona: number, porque: string): Generator<Evento> {
  const lado = d.lados[l]
  const m = lado.monstros[zona]
  if (!m) return
  lado.monstros[zona] = null
  // a fusão volta ao Deck Extra; o resto vai para o cemitério
  if (monstro(m.id).materiais) lado.extra.push(m.id)
  else lado.cemiterio.push(m.id)
  yield { tipo: 'destruir', lado: l, zona, id: m.id, texto: `${nome(m.id)} de ${lado.nome} foi destruído${porque}.` }
  // os equipamentos vão junto
  for (let z = 0; z < ZONAS; z++) {
    const e = lado.zonas[z]
    if (e?.equipadoEm === m.uid) {
      lado.zonas[z] = null
      lado.cemiterio.push(e.id)
      yield { tipo: 'destruir', lado: l, zona: z, id: e.id, magia: true, texto: `${nome(e.id)} vai para o cemitério.` }
    }
  }
  if (tem(m.id, 'aoDestruidoComprar') && comprar(d, l)) yield { tipo: 'compra', lado: l, texto: `${nome(m.id)}: ${lado.nome} compra 1 carta.` }
}

function* destruirZona(d: Duelo, l: 0 | 1, zona: number, porque: string): Generator<Evento> {
  const lado = d.lados[l]
  const c = lado.zonas[zona]
  if (!c) return
  lado.zonas[zona] = null
  lado.cemiterio.push(c.id)
  if (c.equipadoEm) {
    const alvo = lado.monstros.find((m) => m?.uid === c.equipadoEm)
    if (alvo) alvo.bonus -= (carta(c.id) as CartaMagia & { acao: { atk: number } }).acao.atk
  }
  yield { tipo: 'destruir', lado: l, zona, id: c.id, magia: true, texto: `${nome(c.id)} de ${lado.nome} foi destruída${porque}.` }
}

// ── invocações ──

function* aoInvocar(d: Duelo, l: 0 | 1, m: MonstroEmCampo, comFosso: boolean): Generator<Evento> {
  const op = outro(l)
  const c = monstro(m.id)
  // o Fosso Armadilha do oponente, se houver
  if (comFosso && !tem(m.id, 'imuneArmadilha')) {
    const z = d.lados[op].zonas.findIndex((x) => {
      if (!x?.virada) return false
      const ca = carta(x.id)
      return ca.tipo === 'armadilha' && ca.gatilho.tipo === 'fosso' && atkDe(m) >= ca.gatilho.atkMinimo
    })
    if (z >= 0) {
      const id = d.lados[op].zonas[z]!.id
      d.lados[op].zonas[z] = null
      d.lados[op].cemiterio.push(id)
      yield { tipo: 'armadilha', lado: op, id, texto: `${d.lados[op].nome} ativa ${nome(id)}!` }
      const zona = d.lados[l].monstros.indexOf(m)
      yield* destruirMonstro(d, l, zona, ' pelo Fosso Armadilha')
      return
    }
  }
  for (const e of c.efeitos) {
    if (d.fim) return
    if (e.tipo === 'aoInvocarDano') yield* dano(d, op, e.valor, ` (${c.nome})`)
    else if (e.tipo === 'aoInvocarCura') yield* curar(d, l, e.valor)
    else if (e.tipo === 'aoInvocarComprar') {
      for (let i = 0; i < e.valor; i++) if (comprar(d, l)) yield { tipo: 'compra', lado: l, texto: `${c.nome}: ${d.lados[l].nome} compra 1 carta.` }
    } else if (e.tipo === 'aoInvocarDestruirFraco') {
      const alvos = monstrosDe(d.lados[op]).sort((a, b) => forcaVista(a.m, true) - forcaVista(b.m, true))
      if (alvos.length) yield* destruirMonstro(d, op, alvos[0].zona, ` pelo efeito de ${c.nome}`)
    }
  }
}

function colocarMonstro(d: Duelo, l: 0 | 1, id: string, posicao: 'ataque' | 'defesa', virado: boolean, zona: number): MonstroEmCampo {
  const m: MonstroEmCampo = { uid: d.proximoUid++, id, posicao, virado, bonus: 0, ataques: 0, chegou: d.turno, mudouNoTurno: d.turno }
  d.lados[l].monstros[zona] = m
  return m
}

const tirarDaMao = (lado: Lado, uid: number) => {
  const i = lado.mao.findIndex((c) => c.uid === uid)
  return lado.mao.splice(i, 1)[0]
}

// ── a IA: fase principal ──

function* usarMagias(d: Duelo, l: 0 | 1, equipar: boolean): Generator<Evento> {
  const op = outro(l)
  for (let volta = 0; volta < 12 && !d.fim; volta++) {
    const lado = d.lados[l]
    const oponente = d.lados[op]
    const est = lado.estrategia
    const meus = monstrosDe(lado)
    const deles = monstrosDe(oponente)
    const forcaMinha = meus.reduce((s, { m }) => s + Math.max(atkDe(m), m.posicao === 'defesa' ? defDe(m) : 0), 0)
    const forcaDeles = deles.reduce((s, { m }) => s + forcaVista(m, lado.olho), 0)
    const maiorDeles = Math.max(0, ...deles.map(({ m }) => forcaVista(m, lado.olho)))
    const meuMaior = Math.max(0, ...meus.map(({ m }) => atkDe(m)))
    const danoNaMao = lado.mao.reduce((s, c) => {
      const ca = carta(c.id)
      return s + (ca.tipo === 'magia' && ca.acao.tipo === 'dano' ? ca.acao.valor : 0)
    }, 0)
    const temZona = zonaLivre(lado.zonas) >= 0

    let escolhida: { uid: number; c: CartaMagia } | null = null
    for (const item of lado.mao) {
      const c = carta(item.id)
      if (c.tipo !== 'magia') continue
      const a = c.acao
      let usar = false
      if (a.tipo === 'comprar') usar = lado.deck.length > a.valor + 2
      else if (a.tipo === 'dano') usar = !est.guardarDanoParaOFinal || danoNaMao >= oponente.lp
      else if (a.tipo === 'cura') usar = lado.lp <= est.curarAbaixo
      else if (a.tipo === 'destruirMonstrosDoOponente') usar = deles.length >= 2 || (deles.length === 1 && maiorDeles >= meuMaior)
      else if (a.tipo === 'destruirTodosOsMonstros') usar = deles.length > 0 && (est.vorticeSoPerdendo ? forcaDeles > forcaMinha + 500 : forcaDeles >= forcaMinha)
      else if (a.tipo === 'destruirMagiaArmadilha') usar = oponente.zonas.some((z) => z?.virada || (z && carta(z.id).tipo === 'magia' && (carta(z.id) as CartaMagia).acao.tipo === 'correntes'))
      else if (a.tipo === 'ressuscitar') usar = zonaLivre(lado.monstros) >= 0 && melhorNoCemiterio(d) !== null
      else if (a.tipo === 'fusao') usar = acharFusao(lado) !== null
      else if (a.tipo === 'correntes') usar = temZona && oponente.presoPor === 0 && (maiorDeles > meuMaior || lado.lp < 4000)
      else if (a.tipo === 'equipar') usar = equipar && temZona && meus.some(({ m }) => !m.virado)
      if (usar) {
        escolhida = { uid: item.uid, c }
        break
      }
    }
    if (!escolhida) return
    yield* ativarMagia(d, l, escolhida.uid, escolhida.c)
  }
}

function melhorNoCemiterio(d: Duelo): { l: 0 | 1; id: string } | null {
  let melhor: { l: 0 | 1; id: string; atk: number } | null = null
  for (const l of [0, 1] as const) {
    for (const id of d.lados[l].cemiterio) {
      const c = carta(id)
      if (ehMonstro(c) && c.atk >= 1500 && (!melhor || c.atk > melhor.atk)) melhor = { l, id, atk: c.atk }
    }
  }
  return melhor
}

// a fusão que dá para fazer agora com a mão e o campo: a de maior ATK
function acharFusao(lado: Lado): { id: string; materiais: { onde: 'mao' | 'campo'; uid: number }[] } | null {
  let melhor: { id: string; atk: number; materiais: { onde: 'mao' | 'campo'; uid: number }[] } | null = null
  for (const id of new Set(lado.extra)) {
    const f = monstro(id)
    const usados = new Set<number>()
    const materiais: { onde: 'mao' | 'campo'; uid: number }[] = []
    let ok = true
    for (const mat of f.materiais ?? []) {
      const naMao = lado.mao.find((c) => c.id === mat && !usados.has(c.uid))
      const noCampo = lado.monstros.find((m) => m?.id === mat && !usados.has(m.uid))
      const achado = naMao ? { onde: 'mao' as const, uid: naMao.uid } : noCampo ? { onde: 'campo' as const, uid: noCampo.uid } : null
      if (!achado) {
        ok = false
        break
      }
      usados.add(achado.uid)
      materiais.push(achado)
    }
    if (!ok) continue
    const sobraZona = lado.monstros.filter((m) => !m).length + materiais.filter((x) => x.onde === 'campo').length
    if (sobraZona < 1) continue
    if (!melhor || f.atk > melhor.atk) melhor = { id, atk: f.atk, materiais }
  }
  return melhor
}

function* ativarMagia(d: Duelo, l: 0 | 1, uid: number, c: CartaMagia): Generator<Evento> {
  const lado = d.lados[l]
  const op = outro(l)
  const oponente = d.lados[op]
  tirarDaMao(lado, uid)
  yield { tipo: 'ativar', lado: l, id: c.id, texto: `${lado.nome} ativa ${c.nome}!` }
  const a = c.acao
  let fica = false
  if (a.tipo === 'comprar') {
    for (let i = 0; i < a.valor; i++) if (comprar(d, l)) yield { tipo: 'compra', lado: l, texto: `${lado.nome} compra 1 carta.` }
  } else if (a.tipo === 'dano') yield* dano(d, op, a.valor, ` (${c.nome})`)
  else if (a.tipo === 'cura') yield* curar(d, l, a.valor)
  else if (a.tipo === 'destruirMonstrosDoOponente') {
    for (const { zona } of monstrosDe(oponente)) yield* destruirMonstro(d, op, zona, ` por ${c.nome}`)
  } else if (a.tipo === 'destruirTodosOsMonstros') {
    for (const { zona } of monstrosDe(oponente)) yield* destruirMonstro(d, op, zona, ` por ${c.nome}`)
    for (const { zona } of monstrosDe(lado)) yield* destruirMonstro(d, l, zona, ` por ${c.nome}`)
  } else if (a.tipo === 'destruirMagiaArmadilha') {
    const z = oponente.zonas.findIndex((x) => x?.virada)
    const alvo = z >= 0 ? z : oponente.zonas.findIndex((x) => x !== null)
    if (alvo >= 0) {
      const alvoZona = oponente.zonas[alvo]!
      if (alvoZona.id === 'correntes-de-luz') lado.presoPor = 0
      yield* destruirZona(d, op, alvo, ` por ${c.nome}`)
    }
  } else if (a.tipo === 'ressuscitar') {
    const melhor = melhorNoCemiterio(d)
    const zona = zonaLivre(lado.monstros)
    if (melhor && zona >= 0) {
      const cem = d.lados[melhor.l].cemiterio
      cem.splice(cem.lastIndexOf(melhor.id), 1)
      const m = colocarMonstro(d, l, melhor.id, 'ataque', false, zona)
      yield { tipo: 'invocacao', lado: l, zona, id: m.id, especial: 'ressurreicao', texto: `${nome(m.id)} volta do cemitério para o lado de ${lado.nome}!` }
      yield* aoInvocar(d, l, m, false)
    }
  } else if (a.tipo === 'fusao') {
    const f = acharFusao(lado)
    if (f) {
      for (const mat of f.materiais) {
        if (mat.onde === 'mao') lado.cemiterio.push(tirarDaMao(lado, mat.uid).id)
        else {
          const zona = lado.monstros.findIndex((m) => m?.uid === mat.uid)
          yield* destruirMonstro(d, l, zona, ' como material de Fusão')
        }
      }
      lado.extra.splice(lado.extra.indexOf(f.id), 1)
      const zona = zonaLivre(lado.monstros)
      const m = colocarMonstro(d, l, f.id, 'ataque', false, zona)
      yield { tipo: 'invocacao', lado: l, zona, id: f.id, especial: 'fusao', texto: `Invocação-Fusão! ${lado.nome} invoca ${nome(f.id)}!` }
      yield* aoInvocar(d, l, m, false)
    }
  } else if (a.tipo === 'correntes') {
    oponente.presoPor = a.turnos
    fica = true
  } else if (a.tipo === 'equipar') {
    // no monstro mais forte com a face para cima
    const alvo = monstrosDe(lado).filter(({ m }) => !m.virado).sort((x, y) => atkDe(y.m) - atkDe(x.m))[0]
    if (alvo) {
      alvo.m.bonus += a.atk
      const z = zonaLivre(lado.zonas)
      lado.zonas[z] = { uid: d.proximoUid++, id: c.id, virada: false, equipadoEm: alvo.m.uid }
      yield { tipo: 'posicao', lado: l, zona: alvo.zona, texto: `${nome(alvo.m.id)} fica com ${atkDe(alvo.m)} de ATK.` }
      return
    }
  }
  if (fica) {
    const z = zonaLivre(lado.zonas)
    if (z >= 0) {
      lado.zonas[z] = { uid: d.proximoUid++, id: c.id, virada: false }
      return
    }
  }
  lado.cemiterio.push(c.id)
}

function* invocar(d: Duelo, l: 0 | 1): Generator<Evento> {
  const lado = d.lados[l]
  const oponente = d.lados[outro(l)]
  if (lado.invocouNoTurno) return
  const meus = monstrosDe(lado).sort((a, b) => atkDe(a.m) - atkDe(b.m))
  const maiorDeles = Math.max(0, ...monstrosDe(oponente).map(({ m }) => forcaVista(m, lado.olho)))

  let melhor: { uid: number; c: CartaMonstro; tributos: typeof meus } | null = null
  for (const item of lado.mao) {
    const c = carta(item.id)
    if (c.tipo !== 'monstro' || c.materiais) continue
    const t = tributos(c.nivel)
    if (meus.length < t) continue
    const usados = meus.slice(0, t)
    // só tributa quem vale menos que o que chega
    if (t > 0 && usados.some(({ m }) => atkDe(m) >= c.atk)) continue
    if (t === 0 && zonaLivre(lado.monstros) < 0) continue
    const valor = c.atk + c.def * 0.25
    const valorMelhor = melhor ? melhor.c.atk + melhor.c.def * 0.25 : -1
    if (valor > valorMelhor) melhor = { uid: item.uid, c, tributos: usados }
  }
  if (!melhor) return
  const { c } = melhor
  for (const { zona } of melhor.tributos) yield* destruirMonstro(d, l, zona, ' como tributo')
  tirarDaMao(lado, melhor.uid)
  lado.invocouNoTurno = true
  const zona = zonaLivre(lado.monstros)
  const atacar = !lado.estrategia.fracosEmDefesa || c.atk >= maiorDeles || c.atk >= c.def
  if (atacar) {
    const m = colocarMonstro(d, l, c.id, 'ataque', false, zona)
    yield { tipo: 'invocacao', lado: l, zona, id: c.id, ...(melhor.tributos.length ? { especial: 'tributo' as const } : {}),
      texto: `${lado.nome} invoca ${c.nome} (${c.atk}/${c.def})${melhor.tributos.length ? ' por tributo' : ''}!` }
    yield* aoInvocar(d, l, m, true)
  } else {
    colocarMonstro(d, l, c.id, 'defesa', true, zona)
    yield { tipo: 'colocar', lado: l, zona, id: c.id, monstro: true, texto: `${lado.nome} coloca um monstro virado em defesa.` }
  }
}

function* mudarPosicoes(d: Duelo, l: 0 | 1): Generator<Evento> {
  const lado = d.lados[l]
  const oponente = d.lados[outro(l)]
  const maiorDeles = Math.max(0, ...monstrosDe(oponente).map(({ m }) => forcaVista(m, lado.olho)))
  for (const { m, zona } of monstrosDe(lado)) {
    if (m.chegou === d.turno || m.mudouNoTurno === d.turno) continue
    const atk = atkDe(m)
    if (m.posicao === 'defesa' && (atk >= maiorDeles || (atk > defDe(m) && atk >= 1500))) {
      const estava = m.virado
      m.posicao = 'ataque'
      m.virado = false
      m.mudouNoTurno = d.turno
      yield { tipo: 'posicao', lado: l, zona, texto: estava ? `${lado.nome} vira ${nome(m.id)} para cima em ataque!` : `${nome(m.id)} passa para ataque.` }
      if (estava) yield* aoInvocar(d, l, m, false)
    } else if (m.posicao === 'ataque' && lado.estrategia.fracosEmDefesa && atk < maiorDeles && defDe(m) > atk) {
      m.posicao = 'defesa'
      m.mudouNoTurno = d.turno
      yield { tipo: 'posicao', lado: l, zona, texto: `${nome(m.id)} passa para defesa.` }
    }
    if (d.fim) return
  }
}

function* colocarArmadilhas(d: Duelo, l: 0 | 1): Generator<Evento> {
  const lado = d.lados[l]
  for (const item of [...lado.mao]) {
    if (carta(item.id).tipo !== 'armadilha') continue
    const z = zonaLivre(lado.zonas)
    if (z < 0) return
    tirarDaMao(lado, item.uid)
    lado.zonas[z] = { uid: d.proximoUid++, id: item.id, virada: true }
    yield { tipo: 'colocar', lado: l, zona: z, id: item.id, monstro: false, texto: `${lado.nome} coloca uma carta virada para baixo.` }
  }
}

// ── batalha ──

// a armadilha que o defensor ativa contra este ataque (ou nenhuma)
function armadilhaContra(d: Duelo, def: 0 | 1, atacante: MonstroEmCampo, alvo: MonstroEmCampo | null): number {
  if (tem(atacante.id, 'imuneArmadilha')) return -1
  const lado = d.lados[def]
  const atk = atkDe(atacante)
  const doi = alvo
    ? (alvo.posicao === 'ataque' && atk > atkDe(alvo)) || (alvo.posicao === 'defesa' && atk > defDe(alvo))
    : true
  const perigo = !alvo ? atk >= 1000 || atk >= lado.lp : doi
  let melhor = -1
  let prioridade = 0
  lado.zonas.forEach((z, i) => {
    if (!z?.virada) return
    const c = carta(z.id)
    if (c.tipo !== 'armadilha') return
    const g = (c as CartaArmadilha).gatilho
    let p = 0
    if (g.tipo === 'barreiraEspelhada') p = 5
    else if (g.tipo === 'cilindro' && perigo) p = 4
    else if (g.tipo === 'espinhos' && atk <= g.atkMaximo) p = 3
    else if (g.tipo === 'negarAtaque' && perigo) p = 2
    if (p > prioridade) {
      prioridade = p
      melhor = i
    }
  })
  return melhor
}

function escolherAlvo(d: Duelo, l: 0 | 1, m: MonstroEmCampo): number | null | undefined {
  const lado = d.lados[l]
  const oponente = d.lados[outro(l)]
  const deles = monstrosDe(oponente)
  if (!deles.length || tem(m.id, 'ataqueDireto')) return null
  const atk = atkDe(m)
  let melhor: { zona: number; valor: number } | null = null
  for (const { m: o, zona } of deles) {
    let valor = -1
    if (o.virado && !lado.olho) {
      if (lado.estrategia.atacarViradas && atk >= 1500) valor = 500
    } else if (o.posicao === 'ataque') {
      if (atk > atkDe(o)) valor = 1000 + atkDe(o) + (atk - atkDe(o))
      else if (atk === atkDe(o) && oponente.lp > lado.lp) valor = 200
    } else if (atk > defDe(o)) valor = 800 + atkDe(o)
    if (valor > 0 && (!melhor || valor > melhor.valor)) melhor = { zona, valor }
  }
  return melhor ? melhor.zona : undefined
}

function* batalha(d: Duelo, l: 0 | 1): Generator<Evento> {
  const lado = d.lados[l]
  const op = outro(l)
  const oponente = d.lados[op]
  if (lado.presoPor > 0) {
    yield { tipo: 'fase', lado: l, fase: 'batalha', texto: `${lado.nome} está preso pelas Correntes de Luz e não pode atacar.` }
    return
  }
  let encerrada = false
  for (let zona = 0; zona < ZONAS && !d.fim && !encerrada; zona++) {
    const m = lado.monstros[zona]
    if (!m || m.posicao !== 'ataque' || m.virado) continue
    const limite = tem(m.id, 'duploAtaque') ? 2 : 1
    while (m.ataques < limite && lado.monstros[zona] === m && !d.fim && !encerrada) {
      const alvoZona = escolherAlvo(d, l, m)
      if (alvoZona === undefined) break
      m.ataques++
      const alvo = alvoZona === null ? null : oponente.monstros[alvoZona]
      yield { tipo: 'ataque', lado: l, de: zona, alvo: alvoZona,
        texto: alvo ? `${nome(m.id)} ataca ${alvo.virado ? 'o monstro virado' : nome(alvo.id)}!` : `${nome(m.id)} ataca ${oponente.nome} diretamente!` }

      // a resposta do defensor
      const z = armadilhaContra(d, op, m, alvo)
      if (z >= 0) {
        const t = oponente.zonas[z]!
        oponente.zonas[z] = null
        oponente.cemiterio.push(t.id)
        yield { tipo: 'armadilha', lado: op, id: t.id, texto: `${oponente.nome} ativa ${nome(t.id)}!` }
        const g = (carta(t.id) as CartaArmadilha).gatilho
        if (g.tipo === 'barreiraEspelhada') {
          for (const { m: x, zona: zx } of monstrosDe(lado)) if (x.posicao === 'ataque' && !tem(x.id, 'imuneArmadilha')) yield* destruirMonstro(d, l, zx, ' pela Barreira Espelhada')
        } else if (g.tipo === 'cilindro') yield* dano(d, l, atkDe(m), ' (Cilindro Mágico)')
        else if (g.tipo === 'espinhos') yield* destruirMonstro(d, l, zona, ' pela Cova de Espinhos')
        else if (g.tipo === 'negarAtaque') encerrada = true
        continue
      }

      if (!alvo) {
        yield* dano(d, op, atkDe(m), ` (ataque direto de ${nome(m.id)})`)
        continue
      }
      if (alvo.virado) {
        alvo.virado = false
        yield { tipo: 'revelar', lado: op, zona: alvoZona!, id: alvo.id, texto: `O monstro virado era ${nome(alvo.id)} (${atkDe(alvo)}/${defDe(alvo)})!` }
      }
      const atk = atkDe(m)
      if (alvo.posicao === 'ataque') {
        const atkAlvo = atkDe(alvo)
        if (atk > atkAlvo) {
          yield* destruirMonstro(d, op, alvoZona!, ' em batalha')
          yield* dano(d, op, atk - atkAlvo)
        } else if (atk < atkAlvo) {
          yield* destruirMonstro(d, l, zona, ' em batalha')
          yield* dano(d, l, atkAlvo - atk)
        } else {
          yield* destruirMonstro(d, op, alvoZona!, ' em batalha')
          yield* destruirMonstro(d, l, zona, ' em batalha')
        }
      } else {
        const def = defDe(alvo)
        if (atk > def) {
          yield* destruirMonstro(d, op, alvoZona!, ' em batalha')
          if (tem(m.id, 'perfurar')) yield* dano(d, op, atk - def, ' (perfurar)')
        } else if (atk < def) yield* dano(d, l, def - atk, ' (a defesa aguentou)')
      }
    }
  }
}

// ── o turno ──

function* turno(d: Duelo): Generator<Evento> {
  const l = d.vez
  const lado = d.lados[l]
  d.turno++
  lado.invocouNoTurno = false
  for (const m of lado.monstros) if (m) m.ataques = 0
  yield { tipo: 'turno', lado: l, turno: d.turno, texto: `Turno ${d.turno}: vez de ${lado.nome}.` }

  d.fase = 'compra'
  if (d.turno > 1) {
    if (!comprar(d, l)) {
      yield terminar(d, outro(l), `${lado.nome} não tem mais cartas para comprar.`)
      return
    }
    yield { tipo: 'compra', lado: l, texto: `${lado.nome} compra uma carta.` }
  }

  d.fase = 'principal'
  yield { tipo: 'fase', lado: l, fase: 'principal', texto: 'Fase Principal.' }
  yield* usarMagias(d, l, false)
  if (d.fim) return
  yield* invocar(d, l)
  if (d.fim) return
  yield* usarMagias(d, l, true)
  if (d.fim) return
  yield* mudarPosicoes(d, l)
  if (d.fim) return
  yield* colocarArmadilhas(d, l)

  if (d.turno > 1 && monstrosDe(lado).some(({ m }) => m.posicao === 'ataque' && !m.virado)) {
    d.fase = 'batalha'
    yield { tipo: 'fase', lado: l, fase: 'batalha', texto: 'Fase de Batalha!' }
    yield* batalha(d, l)
    if (d.fim) return
  }

  d.fase = 'final'
  // mão cheia: descarta o que vale menos
  while (lado.mao.length > LIMITE_DA_MAO) {
    const pior = [...lado.mao].sort((a, b) => valorNaMao(a.id) - valorNaMao(b.id))[0]
    tirarDaMao(lado, pior.uid)
    lado.cemiterio.push(pior.id)
    yield { tipo: 'descarte', lado: l, id: pior.id, texto: `${lado.nome} descarta ${nome(pior.id)}.` }
  }
  if (lado.presoPor > 0) lado.presoPor--
  // as correntes que este lado ativou caem quando acabam
  const op = d.lados[outro(l)]
  if (op.presoPor === 0) {
    const z = lado.zonas.findIndex((x) => x?.id === 'correntes-de-luz')
    if (z >= 0) yield* destruirZona(d, l, z, ' (o efeito acabou)')
  }
}

function valorNaMao(id: string) {
  const c = carta(id)
  if (c.tipo === 'monstro') return c.atk
  return c.raridade === 'comum' ? 600 : 1500
}

export function* jogar(d: Duelo): Generator<Evento> {
  const maoInicial = d.maoInicial
  yield { tipo: 'inicio', texto: `É hora do duelo! ${d.lados[0].nome} contra ${d.lados[1].nome}.` }
  for (const l of [0, 1] as const) for (let i = 0; i < maoInicial[l]; i++) comprar(d, l)
  while (!d.fim) {
    for (const e of turno(d)) {
      d.passos++
      yield e
    }
    if (d.fim) return
    if (d.turno >= LIMITE_DE_TURNOS) {
      const [a, b] = d.lados
      yield terminar(d, a.lp === b.lp ? null : a.lp > b.lp ? 0 : 1, 'O tempo do duelo acabou: vence quem tem mais LP.')
      return
    }
    d.vez = outro(d.vez)
  }
}

export function duelarAteOFim(d: Duelo): { vencedor: 0 | 1 | null; turnos: number; eventos: number } {
  let eventos = 0
  for (const _ of jogar(d)) eventos++
  return { vencedor: d.fim?.vencedor ?? null, turnos: d.turno, eventos }
}

export type { Carta }
