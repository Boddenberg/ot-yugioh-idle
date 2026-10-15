// Um jogador de mentira joga o jogo inteiro: duela, compra pacotes, remonta o
// deck, desafia o mestre quando está ganhando. Mostra quanto tempo (em duelos de
// 45 s) leva cada arena. Rodar: npx vitest run ferramentas/jornada.test.ts --dir . --silent=false
import { expect, it } from 'vitest'
import { Aleatorio } from '../src/nucleo/aleatorio'
import { ARENAS } from '../src/nucleo/arenas'
import { CARTAS, ehFusao } from '../src/nucleo/cartas'
import { duelarAteOFim, novoDuelo } from '../src/nucleo/duelo'
import { abrirPacote, aplicarResultado, arenaLiberada, desmontarSobras, escolherOponente, fundirNoAltar, montarMelhorDeck, novoEstado, opcoesDoJogador, opcoesDoOponente, PACOTES, pacoteLiberado } from '../src/nucleo/progresso'

it('jornada', () => {
  const e = novoEstado('Teste', 'heroi-espetado', 0)
  const rng = new Aleatorio(5)
  let recentes: boolean[] = []
  const marcos: string[] = []
  for (let n = 1; n <= 40000 && e.mestresVencidos.length < ARENAS.length; n++) {
    const { arena, oponente } = escolherOponente(e, rng)
    const d = novoDuelo(opcoesDoJogador(e), opcoesDoOponente(oponente, arena), n)
    const r = aplicarResultado(e, arena, oponente, duelarAteOFim(d).vencedor, rng, n)
    if (oponente.mestre) {
      marcos.push(`${(n * 45 / 3600).toFixed(1)}h duelo ${n}: mestre ${oponente.nome} ${r.venceu ? 'VENCIDO' : 'perdeu'} (nível ${e.nivel})`)
      recentes = []
    } else recentes = [...recentes, !!r.venceu].slice(-20)
    if (n % 15 === 0) {
      desmontarSobras(e)
      for (const c of CARTAS) if (ehFusao(c)) fundirNoAltar(e, c.id)
      const melhores = PACOTES.filter((p) => pacoteLiberado(e, p)).reverse()
      for (const p of melhores) while (e.dp >= p.preco * 1.0) abrirPacote(e, p.id, rng)
      e.deck = montarMelhorDeck(e)
      const i = ARENAS.findIndex((a) => a.id === e.arena)
      if (ARENAS[i + 1] && arenaLiberada(e, ARENAS[i + 1])) {
        e.arena = ARENAS[i + 1].id
        recentes = []
      } else if (!e.mestresVencidos.includes(ARENAS[i].mestre.id) && recentes.length >= 20 && recentes.filter(Boolean).length >= 13) e.desafioAoMestre = true
    }
  }
  console.log(marcos.filter((m) => m.includes('VENCIDO')).join('\n'))
  expect(e.mestresVencidos.length).toBe(ARENAS.length)
  console.log(`derrotas para mestres: ${marcos.filter((m) => !m.includes('VENCIDO')).length}; nível ${e.nivel}; coleção ${Object.keys(e.colecao).length}/${CARTAS.length}`)
})
