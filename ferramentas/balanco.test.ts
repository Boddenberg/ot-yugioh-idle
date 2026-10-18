import { it } from 'vitest'
import { ARENAS } from '../src/nucleo/arenas'
import { duelarAteOFim, jogar, novoDuelo } from '../src/nucleo/duelo'

it('balanço', () => {
  const ms = ARENAS.map((a) => a.mestre)
  const linhas: string[] = []
  for (const a of ms) {
    const l = [a.id.padEnd(16)]
    for (const b of ms) {
      let v = 0
      for (let s = 0; s < 80; s++) if (duelarAteOFim(novoDuelo({ nome: 'a', deck: a.deck, lp: a.lp }, { nome: 'b', deck: b.deck, lp: b.lp }, s)).vencedor === 0) v++
      l.push(String(Math.round((v / 80) * 100)).padStart(4))
    }
    linhas.push(l.join(''))
  }
  // média dos comuns de cada arena contra o mestre da anterior
  console.log(linhas.join('\n'))
  if (process.env.LOG) {
    const d = novoDuelo({ nome: 'Zero', deck: ms[1].deck }, { nome: 'Conde', deck: ms[2].deck, lp: 9000 }, 7)
    for (const e of jogar(d)) console.log(e.texto)
  }
})
