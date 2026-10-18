import { describe, expect, it } from 'vitest'
import { Aleatorio } from './aleatorio'
import { ARENAS } from './arenas'
import { abrirPacote, aplicarResultado, exportarSave, fundirNoAltar, importarSave, montarMelhorDeck, novoEstado, problemaDoDeck, progressoOffline } from './progresso'

describe('o progresso', () => {
  it('o deck inicial é válido', () => {
    expect(problemaDoDeck(novoEstado('A', 'x'))).toBeNull()
  })
  it('vencer o mestre dá a relíquia e abre a próxima arena', () => {
    const e = novoEstado('A', 'x')
    e.nivel = 5
    const r = aplicarResultado(e, ARENAS[0], ARENAS[0].mestre, 0, new Aleatorio(1))
    expect(r.reliquia).toBe('colar')
    expect(r.carta).toBeDefined()
    expect(e.mestresVencidos).toContain(ARENAS[0].mestre.id)
  })
  it('o pacote cobra e dá cinco cartas', () => {
    const e = novoEstado('A', 'x')
    const r = abrirPacote(e, 'pacote-inicial', new Aleatorio(2))
    expect(Array.isArray(r) && r.length).toBe(5)
    expect(e.dp).toBe(150)
  })
  it('o altar pede os materiais e o pó', () => {
    const e = novoEstado('A', 'x')
    e.po = 0
    expect(fundirNoAltar(e, 'golem-vulcanico')).toMatch(/Pó/)
    e.po = 1000
    expect(fundirNoAltar(e, 'golem-vulcanico')).toBeNull()
    expect(e.colecao['golem-vulcanico']).toBe(1)
    expect(fundirNoAltar(e, 'leviata-mecanico')).toMatch(/Sentinela/)
    expect(fundirNoAltar(e, 'dragao-alvo-supremo')).toMatch(/Faltam/)
  })
  it('o jogo fechado duela, com teto de 12 horas', () => {
    const e = novoEstado('A', 'x', 0)
    const r = progressoOffline(e, 48 * 3600 * 1000, 7)!
    expect(r.duelos).toBe(Math.floor((12 * 3600) / 45 * 0.5))
    expect(e.estatisticas.duelos).toBe(r.duelos)
  })
  it('o deck automático é sempre válido e o save vai e volta', () => {
    const e = novoEstado('Ação', 'x')
    e.deck = montarMelhorDeck(e)
    expect(problemaDoDeck(e)).toBeNull()
    expect(importarSave(exportarSave(e))?.nome).toBe('Ação')
  })
})
