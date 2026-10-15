// O painel ao lado da mesa: quem é o oponente, a velocidade, o desafio ao
// mestre, as últimas partidas e o registro do duelo (o "chat" do OT Idle).
import { useEffect, useRef } from 'react'
import { carta } from '../nucleo/cartas'
import { arenaLiberada, chanceDeCarta, recompensaBase, type Estado } from '../nucleo/progresso'
import { reliquia } from '../nucleo/reliquias'
import { indiceDaArena } from '../nucleo/arenas'
import type { DueloAtual } from './App'
import { arteDaReliquia, arteDoDuelista } from './Carta'

interface Props {
  e: Estado
  atual: DueloAtual
  pausado: boolean
  setPausado: (p: boolean) => void
  aoVelocidade: (v: number) => void
  aoDesafiar: () => void
  aoPular: () => void
}

export function DueloLateral({ e, atual, pausado, setPausado, aoVelocidade, aoDesafiar, aoPular }: Props) {
  const { oponente: o, arena } = atual
  const registro = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const r = registro.current
    if (r) r.scrollTop = r.scrollHeight
  }, [atual.passo])
  const i = indiceDaArena(arena.id)
  const base = recompensaBase(i, !!o.mestre)
  const mestreVencido = e.mestresVencidos.includes(arena.mestre.id)
  return (
    <aside className="lateral-duelo">
      <div className="painel">
        <div className="painel-titulo">{arena.nome}</div>
        <div className="ficha-oponente">
          <img src={arteDoDuelista(o.id)} alt="" className="pixel" />
          <div>
            <div className="nome">{o.nome}</div>
            <div className="sub">{o.titulo}</div>
            {o.mestre && <span className="selo-mestre">MESTRE DA ARENA</span>}
            <div className="sub num" style={{ marginTop: 4 }}>Vitória: +{base.dp} DP · +{base.xp} XP · {o.mestre ? 'carta garantida' : `${Math.round(chanceDeCarta(e) * 100)}% de carta`}</div>
          </div>
        </div>
        <div className="velocidades">
          {[1, 2, 4, 8].map((v) => (
            <button key={v} className={e.velocidade === v && !pausado ? 'ativo' : ''} onClick={() => { setPausado(false); aoVelocidade(v) }}>{v}×</button>
          ))}
          <button className={pausado ? 'ativo' : ''} onClick={() => setPausado(!pausado)}>{pausado ? '▶' : '❚❚'}</button>
          <button onClick={aoPular} title="Termina este duelo sem animação">⏭</button>
        </div>
        {!o.mestre && arenaLiberada(e, arena) && (
          <div style={{ padding: '0 0.8rem 0.8rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="botao ouro pequeno" onClick={aoDesafiar}>{mestreVencido ? 'Revanche com o mestre' : 'Desafiar o mestre'}</button>
            {!mestreVencido && <img src={arteDaReliquia(arena.reliquia)} alt="" className="pixel" style={{ width: 30 }} title={`Prêmio: ${reliquia(arena.reliquia).nome}`} />}
          </div>
        )}
        {e.desafioAoMestre && !o.mestre && <div className="ok-texto">O mestre entra no próximo duelo.</div>}
        <div className="historico-mini">
          {e.historico.slice(0, 20).reverse().map((h, k) => (
            <span key={k} className={h.venceu ? 'v' : 'd'} title={`${h.venceu ? 'Vitória' : 'Derrota'} contra ${h.oponente}${h.carta ? ` · ganhou ${carta(h.carta).nome}` : ''}`}>{h.venceu ? 'V' : 'D'}</span>
          ))}
        </div>
      </div>
      <div className="painel" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div className="painel-titulo">Registro do duelo</div>
        <div className="registro" ref={registro}>
          {atual.log.map((ev, k) => (
            <p key={k} className={ev.tipo === 'turno' ? 'turno' : ev.tipo === 'fim' || ev.tipo === 'armadilha' || ev.tipo === 'inicio' ? 'forte' : 'lado' in ev ? `l${ev.lado}` : ''}>{ev.texto}</p>
          ))}
        </div>
      </div>
    </aside>
  )
}
