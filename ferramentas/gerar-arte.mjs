// Gera a arte que falta (cartas, duelistas, relíquias) no PixelLab, pelo mesmo
// servidor MCP que o Claude Code usa (a chave fica no ~/.claude.json, nunca no
// repositório). Só pede o que ainda não existe em public/arte.
//   node ferramentas/gerar-arte.mjs [--so=cartas|duelistas|reliquias] [--refazer=id1,id2]
import { existsSync, writeFileSync } from 'node:fs'
import { ligar, chamar } from './pixellab-mcp.mjs'
import { CARTAS } from '../src/nucleo/cartas.ts'
import { ARENAS } from '../src/nucleo/arenas.ts'
import { RELIQUIAS } from '../src/nucleo/reliquias.ts'
import { AVATARES } from '../src/nucleo/avatares.ts'

const arg = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.split('=')[1]
const so = arg('so')
const refazer = new Set((arg('refazer') ?? '').split(',').filter(Boolean))

const pedidos = []
if (!so || so === 'cartas') for (const c of CARTAS) pedidos.push({
  arquivo: `public/arte/cartas/${c.id}.png`, id: c.id,
  args: { description: `trading card game illustration, ${c.visual}, dramatic fantasy art`, width: 96, height: 96, detail: 'highly detailed', shading: 'detailed shading', no_background: false },
})
const duelistas = [...ARENAS.flatMap((a) => [...a.oponentes, a.mestre]), ...AVATARES]
if (!so || so === 'duelistas') for (const o of duelistas) pedidos.push({
  arquivo: `public/arte/duelistas/${o.id}.png`, id: o.id,
  args: { description: `anime style character portrait bust, ${o.visual}, facing viewer`, width: 96, height: 96, detail: 'highly detailed', shading: 'detailed shading', no_background: false },
})
if (!so || so === 'reliquias') for (const r of RELIQUIAS) pedidos.push({
  arquivo: `public/arte/reliquias/${r.id}.png`, id: r.id,
  args: { description: `${r.visual}, game item icon`, width: 64, height: 64, detail: 'highly detailed', shading: 'detailed shading', no_background: true, outline: 'single color black outline' },
})

const fila = pedidos.filter((p) => refazer.has(p.id) || !existsSync(p.arquivo))
console.log(`${fila.length} imagens para gerar`)
await ligar()

const espera = (ms) => new Promise((r) => setTimeout(r, ms))
async function gerar(p) {
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    try {
      const r = await chamar('create_image_pixflux', p.args)
      const job = /job_id: (\S+)/.exec(r[0].text)?.[1]
      if (!job) throw new Error(r[0].text)
      for (let i = 0; i < 60; i++) {
        await espera(5000)
        const g = await chamar('get_image', { job_id: job })
        const img = g.find((x) => x.type === 'image')
        if (img) {
          writeFileSync(p.arquivo, Buffer.from(img.data, 'base64'))
          console.log('ok', p.id)
          return
        }
        if (/status: (failed|error)/.test(g[0]?.text ?? '')) throw new Error(g[0].text)
      }
      throw new Error('demorou demais')
    } catch (e) {
      console.log('falhou', p.id, String(e).slice(0, 200))
      await espera(4000)
    }
  }
}

const paralelo = 6
let i = 0
await Promise.all(Array.from({ length: paralelo }, async () => {
  while (i < fila.length) await gerar(fila[i++])
}))
console.log('fim')
