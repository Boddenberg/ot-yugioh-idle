// cliente MCP mínimo do PixelLab (o mesmo servidor do Claude Code)
import { readFileSync } from 'node:fs'
const cfg = JSON.parse(readFileSync((process.env.USERPROFILE ?? process.env.HOME) + '/.claude.json', 'utf8'))
const srv = cfg.mcpServers.pixellab
let sessao = null, idn = 1
async function rpc(method, params, notif = false) {
  const h = { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', ...srv.headers }
  if (sessao) h['mcp-session-id'] = sessao
  const body = notif ? { jsonrpc: '2.0', method, params } : { jsonrpc: '2.0', id: idn++, method, params }
  const r = await fetch(srv.url, { method: 'POST', headers: h, body: JSON.stringify(body) })
  sessao = r.headers.get('mcp-session-id') ?? sessao
  if (notif) return
  const t = await r.text()
  const linhas = t.split('\n').filter((l) => l.startsWith('data:')).map((l) => l.slice(5))
  const j = JSON.parse(linhas.length ? linhas[linhas.length - 1] : t)
  if (j.error) throw new Error(JSON.stringify(j.error))
  return j.result
}
export async function ligar() {
  await rpc('initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'ygo', version: '1' } })
  await rpc('notifications/initialized', {}, true)
}
export async function chamar(nome, args) {
  const r = await rpc('tools/call', { name: nome, arguments: args })
  return r.content
}
