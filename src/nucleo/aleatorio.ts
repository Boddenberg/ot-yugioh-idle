// A sorte que ninguém prevê (o gerador do sistema): a que o jogador escolhe
// quando tentar (a fusão da forja, o imbuement). Um gerador com semente se
// descobre pelos resultados e pela hora em que o personagem entrou (a semente
// era o relógio), e aí dava para gastar tentativas baratas até a próxima ser
// sucesso e só então fundir a peça cara.
export const sorteSegura = { proximo: (): number => globalThis.crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296 }

// Gerador com semente (mulberry32): a mesma semente dá a mesma caçada, o que
// deixa os testes e o progresso offline reproduzíveis.
export class Aleatorio {
  private s: number

  constructor(semente = Date.now()) {
    this.s = semente >>> 0
  }

  proximo(): number {
    this.s = (this.s + 0x6d2b79f5) >>> 0
    let t = this.s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  // inteiro em [min, max]
  entre(min: number, max: number): number {
    if (max <= min) return Math.round(min)
    return Math.floor(min + this.proximo() * (max - min + 1))
  }

  chance(p: number): boolean {
    return this.proximo() < p
  }

  escolher<T>(lista: readonly T[]): T {
    return lista[Math.floor(this.proximo() * lista.length)]
  }

  get semente(): number {
    return this.s
  }
}
