import { describe, expect, it } from 'vitest'
import { ARENAS } from './arenas'
import { carta, CARTAS } from './cartas'
import { duelarAteOFim, jogar, novoDuelo } from './duelo'

const todos = ARENAS.flatMap((a) => [...a.oponentes, a.mestre])

describe('o banco de cartas e as arenas', () => {
  it('todo deck de oponente tem 20 cartas ou mais, e só cartas que existem', () => {
    for (const o of todos) {
      for (const id of o.deck) carta(id)
      expect(o.deck.length, o.id).toBeGreaterThanOrEqual(20)
    }
  })
  it('ids únicos', () => {
    expect(new Set(CARTAS.map((c) => c.id)).size).toBe(CARTAS.length)
    expect(new Set(todos.map((o) => o.id)).size).toBe(todos.length)
  })
})

describe('o duelo', () => {
  it('todo par de oponentes duela até o fim, sem travar', () => {
    let semente = 1
    for (const a of todos) for (const b of todos) {
      const d = novoDuelo({ nome: a.nome, deck: a.deck, lp: a.lp }, { nome: b.nome, deck: b.deck, lp: b.lp }, semente++)
      const r = duelarAteOFim(d)
      expect(d.fim).not.toBeNull()
      expect(r.eventos).toBeLessThan(5000)
    }
  })
  it('a mesma semente dá o mesmo duelo', () => {
    const [a, b] = ARENAS[2].oponentes
    const um = [...jogar(novoDuelo({ nome: 'A', deck: a.deck }, { nome: 'B', deck: b.deck }, 42))].map((e) => e.texto)
    const dois = [...jogar(novoDuelo({ nome: 'A', deck: a.deck }, { nome: 'B', deck: b.deck }, 42))].map((e) => e.texto)
    expect(um).toEqual(dois)
  })
  it('o Rei das Sombras atropela o Mestre do Porto', () => {
    const [porto, sombras] = [ARENAS[0].mestre, ARENAS[ARENAS.length - 1].mestre]
    let vitorias = 0
    for (let s = 0; s < 60; s++) {
      const d = novoDuelo({ nome: 'porto', deck: porto.deck }, { nome: 'sombras', deck: sombras.deck, lp: sombras.lp }, 1000 + s)
      if (duelarAteOFim(d).vencedor === 1) vitorias++
    }
    expect(vitorias).toBeGreaterThan(50)
  })
  it('perfurar, ataque direto e Fosso Armadilha funcionam', () => {
    const textos = (a: string[], b: string[], semente: number) => [...jogar(novoDuelo({ nome: 'A', deck: a }, { nome: 'B', deck: b }, semente, 0))].map((e) => e.texto).join('\n')
    const espectros = Array(20).fill('espectro-sorrateiro')
    const muralha = Array(20).fill('golem-de-musgo')
    expect(textos(espectros, muralha, 3)).toMatch(/Espectro Sorrateiro ataca B diretamente/)
    const fosso = [...Array(10).fill('fosso-armadilha'), ...Array(10).fill('besouro-de-aco')]
    expect(textos(Array(20).fill('samurai-do-vento'), fosso, 4)).toMatch(/pelo Fosso Armadilha/)
  })
})
