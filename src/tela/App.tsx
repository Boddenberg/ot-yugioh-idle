// A casca do jogo e o laço do idle: um duelo atrás do outro na arena escolhida,
// passo a passo para a tela animar. O estado do duelista mora num ref (o motor
// muda os objetos no lugar) e `atualizar()` redesenha.
import { useCallback, useEffect, useRef, useState } from 'react'
import { Aleatorio } from '../nucleo/aleatorio'
import { arena as acharArena, ARENAS, type Arena, type Oponente } from '../nucleo/arenas'
import { jogar, novoDuelo, type Duelo, type Evento } from '../nucleo/duelo'
import {
  aplicarResultado, CHAVE_DO_SAVE, escolherOponente, lerSave, novoEstado, opcoesDoJogador, opcoesDoOponente,
  problemaDoDeck, progressoOffline, titulo, xpParaSubir, type Ausencia, type Estado, type Resultado,
} from '../nucleo/progresso'
import { RELIQUIAS } from '../nucleo/reliquias'
import { Campo } from './Campo'
import { arteDaReliquia, arteDoDuelista, Olho } from './Carta'
import { ModalAusencia, TelaAltar, TelaArenas, TelaColecao, TelaDeck, TelaEntrada, TelaLoja, TelaRegistro, TelaRegras, TelaReliquias } from './Telas'
import { DueloLateral } from './DueloLateral'

export type Aba = 'duelo' | 'arenas' | 'deck' | 'colecao' | 'loja' | 'altar' | 'reliquias' | 'regras' | 'registro'

const ABAS: { id: Aba; nome: string; icone: string }[] = [
  { id: 'duelo', nome: 'Duelo', icone: '⚔' },
  { id: 'arenas', nome: 'Arenas', icone: '🗺' },
  { id: 'deck', nome: 'Deck', icone: '🂠' },
  { id: 'colecao', nome: 'Coleção', icone: '📖' },
  { id: 'loja', nome: 'Loja de Cartas', icone: '🛒' },
  { id: 'altar', nome: 'Altar de Fusão', icone: '🌀' },
  { id: 'reliquias', nome: 'Relíquias', icone: '👁' },
  { id: 'regras', nome: 'Estratégia', icone: '⚙' },
  { id: 'registro', nome: 'Registro', icone: '📜' },
]

export interface DueloAtual {
  d: Duelo
  gen: Generator<Evento>
  arena: Arena
  oponente: Oponente
  log: Evento[]
  evento: Evento | null
  passo: number
  resultado: Resultado | null
}

// quanto cada tipo de evento fica na tela (em ms, na velocidade 1×)
const DURACAO: Partial<Record<Evento['tipo'], number>> = {
  inicio: 1400, turno: 450, fase: 300, compra: 260, invocacao: 900, colocar: 500, ativar: 1100, armadilha: 1200,
  ataque: 850, revelar: 700, posicao: 500, destruir: 650, dano: 750, cura: 650, descarte: 400, fim: 600,
}

export function App() {
  const [estado, setEstado] = useState<Estado | null>(() => {
    try {
      return lerSave(localStorage.getItem(CHAVE_DO_SAVE))
    } catch {
      return null
    }
  })
  if (!estado) return <TelaEntrada aoComecar={(nome, avatar) => setEstado(novoEstado(nome, avatar))} />
  return <Jogo inicial={estado} aoApagar={() => setEstado(null)} />
}

function Jogo({ inicial, aoApagar }: { inicial: Estado; aoApagar: () => void }) {
  const e = useRef(inicial).current
  const [, setVersao] = useState(0)
  const atualizar = useCallback(() => setVersao((v) => v + 1), [])
  const [aba, setAba] = useState<Aba>('duelo')
  const [ausencia, setAusencia] = useState<Ausencia | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [pausado, setPausado] = useState(false)
  const rng = useRef(new Aleatorio(Date.now())).current
  const duelo = useRef<DueloAtual | null>(null)

  const salvar = useCallback(() => {
    try {
      localStorage.setItem(CHAVE_DO_SAVE, JSON.stringify(e))
    } catch {
      // sem armazenamento (aba anônima): o jogo segue, só não guarda
    }
  }, [e])

  const avisar = useCallback((t: string) => {
    setToast(t)
    setTimeout(() => setToast((x) => (x === t ? null : x)), 3200)
  }, [])

  // o tempo que passou longe (jogo fechado ou aba dormindo) vira duelos
  const recuperarTempo = useCallback(() => {
    const r = progressoOffline(e, Date.now())
    if (r) {
      setAusencia(r)
      salvar()
      atualizar()
    }
  }, [e, salvar, atualizar])

  const novoDueloAgora = useCallback(() => {
    if (problemaDoDeck(e)) {
      duelo.current = null
      return
    }
    const { arena, oponente } = escolherOponente(e, rng)
    const d = novoDuelo(opcoesDoJogador(e), opcoesDoOponente(oponente, arena), Math.floor(rng.proximo() * 2 ** 31))
    duelo.current = { d, gen: jogar(d), arena, oponente, log: [], evento: null, passo: 0, resultado: null }
  }, [e, rng])

  // abrir o jogo: primeiro o tempo de fora, depois o primeiro duelo
  useEffect(() => {
    recuperarTempo()
    novoDueloAgora()
    atualizar()
    const salvarAoSair = () => {
      e.salvoEm = Date.now()
      salvar()
    }
    window.addEventListener('beforeunload', salvarAoSair)
    const voltar = () => {
      if (document.visibilityState === 'visible') recuperarTempo()
    }
    document.addEventListener('visibilitychange', voltar)
    return () => {
      window.removeEventListener('beforeunload', salvarAoSair)
      document.removeEventListener('visibilitychange', voltar)
    }
  }, [])

  // o laço: um evento por vez, na velocidade escolhida
  useEffect(() => {
    if (pausado) return
    let parado = false
    let t: ReturnType<typeof setTimeout>
    const passo = () => {
      if (parado) return
      const agora = Date.now()
      // a aba dormiu (o navegador segura os timers): o buraco vira progresso offline
      if (agora - e.salvoEm > 90_000) recuperarTempo()
      e.salvoEm = agora
      const atual = duelo.current
      if (!atual) {
        novoDueloAgora()
        t = setTimeout(passo, 1000)
        atualizar()
        return
      }
      if (atual.resultado) {
        novoDueloAgora()
        atualizar()
        t = setTimeout(passo, 300)
        return
      }
      const r = atual.gen.next()
      if (r.done || !r.value) {
        t = setTimeout(passo, 50)
        return
      }
      const ev = r.value
      atual.evento = ev
      atual.passo++
      atual.log.push(ev)
      if (atual.log.length > 400) atual.log.splice(0, atual.log.length - 400)
      let espera = (DURACAO[ev.tipo] ?? 500) / e.velocidade
      if (ev.tipo === 'fim') {
        const res = aplicarResultado(e, atual.arena, atual.oponente, ev.vencedor, rng)
        atual.resultado = res
        if (res.reliquia) avisar(`Você conquistou a ${RELIQUIAS.find((x) => x.id === res.reliquia)!.nome}!`)
        else if (res.subiuPara) avisar(`Subiu para o nível ${res.subiuPara}!`)
        salvar()
        espera = 2600 / Math.min(e.velocidade, 2)
      }
      atualizar()
      t = setTimeout(passo, espera)
    }
    t = setTimeout(passo, 200)
    const salvarSempre = setInterval(salvar, 10_000)
    return () => {
      parado = true
      clearTimeout(t)
      clearInterval(salvarSempre)
    }
  }, [pausado, e, rng, novoDueloAgora, recuperarTempo, salvar, atualizar, avisar])

  const trocarArena = (id: string) => {
    e.arena = id
    e.desafioAoMestre = false
    novoDueloAgora()
    setAba('duelo')
    atualizar()
  }
  const desafiarMestre = (id: string) => {
    e.arena = id
    e.desafioAoMestre = true
    novoDueloAgora()
    setAba('duelo')
    atualizar()
  }
  const mudou = () => {
    salvar()
    atualizar()
  }

  const dueloAtual = duelo.current
  const arenaAtual = acharArena(e.arena) ?? ARENAS[0]
  const deckRuim = problemaDoDeck(e)
  return (
    <div className="casca">
      <header className="topo">
        <div className="logo">
          <Olho style={{ width: 54 }} />
          <div className="logo-texto">
            <div className="ot">O T</div>
            <div className="ygo">Yu-Gi-Oh!</div>
            <div className="idle">IDLE</div>
          </div>
        </div>
        <div className="placa">
          <img src={arteDoDuelista(e.avatar)} alt="" className="pixel" />
          <div>
            <div className="nome">{e.nome} <span className="num" style={{ color: 'var(--ouro)' }}>Nv. {e.nivel}</span></div>
            <div className="titulo">{titulo(e.nivel)}</div>
            <div className="barra-xp" title={`${e.xp} / ${xpParaSubir(e.nivel)} XP`}><div style={{ width: `${(e.xp / xpParaSubir(e.nivel)) * 100}%` }} /></div>
          </div>
        </div>
        <div className="moedas">
          <div className="moeda" title="Pontos de Duelo: compram pacotes na loja"><span className="icone-dp">DP</span><span><span className="rotulo">PONTOS DE DUELO</span>{e.dp.toLocaleString('pt-BR')}</span></div>
          <div className="moeda" title="Pó Estelar: sai das cartas desmontadas e paga as fusões do altar"><span className="icone-po" /><span><span className="rotulo">PÓ ESTELAR</span>{e.po.toLocaleString('pt-BR')}</span></div>
        </div>
        <div className="reliquias-topo">
          {RELIQUIAS.map((r) => <img key={r.id} src={arteDaReliquia(r.id)} className={`pixel ${e.reliquias.includes(r.id) ? 'tem' : ''}`} title={`${r.nome}${e.reliquias.includes(r.id) ? '' : ' (não conquistada)'}`} alt="" />)}
        </div>
      </header>

      <nav className="menu">
        {ABAS.map((a) => (
          <button key={a.id} className={aba === a.id ? 'ativo' : ''} onClick={() => setAba(a.id)}>
            <span className="icone">{a.icone}</span>{a.nome}
            {a.id === 'deck' && deckRuim && <span className="aviso" />}
          </button>
        ))}
        <div className="rodape-menu">
          Arena: <b style={{ color: 'var(--ouro-claro)' }}>{arenaAtual.nome}</b><br />
          {e.estatisticas.vitorias} vitórias · {e.estatisticas.derrotas} derrotas
        </div>
      </nav>

      <main className="conteudo">
        {aba === 'duelo' && (
          dueloAtual ? (
            <div className="tela-duelo">
              <div style={{ position: 'relative', minHeight: 0, display: 'flex' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Campo d={dueloAtual.d} evento={dueloAtual.evento} passo={dueloAtual.passo} retratos={[e.avatar, dueloAtual.oponente.id]} cor={dueloAtual.arena.cor} />
                </div>
                {dueloAtual.resultado && <FinalDoDuelo r={dueloAtual.resultado} />}
              </div>
              <DueloLateral e={e} atual={dueloAtual} pausado={pausado} setPausado={setPausado}
                aoVelocidade={(v) => { e.velocidade = v; mudou() }}
                aoDesafiar={() => desafiarMestre(e.arena)}
                aoPular={() => {
                  // termina o duelo de uma vez (sem animação)
                  const a = duelo.current
                  if (!a || a.resultado) return
                  for (const ev of a.gen) {
                    a.log.push(ev)
                    a.evento = ev
                    a.passo++
                    if (ev.tipo === 'fim') {
                      a.resultado = aplicarResultado(e, a.arena, a.oponente, ev.vencedor, rng)
                      salvar()
                    }
                  }
                  atualizar()
                }} />
            </div>
          ) : (
            <div className="painel" style={{ padding: '2rem', textAlign: 'center' }}>
              <h2 className="titulo-fonte">Seu deck não está pronto</h2>
              <p>{deckRuim}</p>
              <button className="botao ouro" onClick={() => setAba('deck')}>Montar o deck</button>
            </div>
          )
        )}
        {aba === 'arenas' && <TelaArenas e={e} aoDuelar={trocarArena} aoDesafiar={desafiarMestre} />}
        {aba === 'deck' && <TelaDeck e={e} aoMudar={() => { mudou(); if (!duelo.current) novoDueloAgora() }} avisar={avisar} />}
        {aba === 'colecao' && <TelaColecao e={e} />}
        {aba === 'loja' && <TelaLoja e={e} rng={rng} aoMudar={mudou} avisar={avisar} />}
        {aba === 'altar' && <TelaAltar e={e} aoMudar={mudou} avisar={avisar} />}
        {aba === 'reliquias' && <TelaReliquias e={e} />}
        {aba === 'regras' && <TelaRegras e={e} aoMudar={mudou} />}
        {aba === 'registro' && <TelaRegistro e={e} aoMudar={mudou} aoApagar={() => { localStorage.removeItem(CHAVE_DO_SAVE); aoApagar() }} avisar={avisar} />}
      </main>

      {ausencia && <ModalAusencia a={ausencia} aoFechar={() => setAusencia(null)} />}
      {toast && <div className="toast painel">{toast}</div>}
    </div>
  )
}

function FinalDoDuelo({ r }: { r: Resultado }) {
  return (
    <div className="final-duelo">
      <div>
        <div className={`grande ${r.venceu === false ? 'derrota' : ''}`}>{r.venceu ? 'VITÓRIA!' : r.venceu === false ? 'DERROTA' : 'EMPATE'}</div>
        <div className="ganhos">
          <span><span className="icone-dp" style={{ display: 'inline-grid', verticalAlign: 'middle' }}>DP</span> +{r.dp}</span>
          <span style={{ color: 'var(--sombra-clara)' }}>+{r.xp} XP</span>
          {r.carta && <span style={{ color: 'var(--ouro-claro)' }}>🂠 carta nova!</span>}
        </div>
        {r.subiuPara && <div className="ganhos" style={{ color: 'var(--ouro-claro)' }}>Nível {r.subiuPara}!</div>}
      </div>
    </div>
  )
}

