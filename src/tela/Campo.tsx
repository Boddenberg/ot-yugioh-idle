// O campo de duelo: as duas metades espelhadas (zonas de monstro, de magia e
// armadilha, cemitério, deck e Deck Extra), a faixa central com as fases e os
// contadores de LP, as mãos e os anúncios (a carta ativada que aparece grande
// no meio da mesa). Cada evento do motor vira uma animação curta.
import { useEffect, useState } from 'react'
import { carta } from '../nucleo/cartas'
import { atkDe, defDe, type Duelo, type Evento, type Lado, type MonstroEmCampo } from '../nucleo/duelo'
import { arteDoDuelista, Carta, Verso } from './Carta'

interface Props {
  d: Duelo
  evento: Evento | null
  passo: number
  retratos: [string, string]
  cor: string
}

const FASES: [string, string][] = [['compra', 'DP'], ['espera', 'SP'], ['principal', 'M1'], ['batalha', 'BP'], ['principal2', 'M2'], ['final', 'EP']]

export function Campo({ d, evento, passo, retratos, cor }: Props) {
  const efeitoNa = (lado: 0 | 1, zona: number, st = false): string => {
    if (!evento) return ''
    const e = evento
    if (e.tipo === 'ataque' && e.lado === lado && e.de === zona && !st) return 'ataca'
    if (e.tipo === 'ataque' && e.lado !== lado && e.alvo === zona && !st) return 'alvo'
    if ((e.tipo === 'invocacao' || (e.tipo === 'colocar' && e.monstro === !st)) && e.lado === lado && e.zona === zona) return 'chegou'
    if (e.tipo === 'revelar' && e.lado === lado && e.zona === zona && !st) return 'chegou'
    if (e.tipo === 'destruir' && e.lado === lado && e.zona === zona && !!e.magia === st) return 'explode'
    return ''
  }
  return (
    <div className="mesa" style={{ '--cor-arena': cor } as React.CSSProperties}>
      <Mao lado={d.lados[1]} oponente />
      <MetadeDoCampo d={d} lado={1} efeitoNa={efeitoNa} passo={passo} />
      <div className="faixa-central">
        <ContadorDeLp lado={d.lados[1]} retrato={retratos[1]} evento={evento} indice={1} passo={passo} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div className="fases">
            {FASES.map(([f, sigla]) => <span key={sigla} className={d.fase === f ? 'agora' : ''}>{sigla}</span>)}
          </div>
          <div className="turno-info">Turno {Math.max(1, d.turno)} · vez de {d.lados[d.vez].nome}</div>
        </div>
        <ContadorDeLp lado={d.lados[0]} retrato={retratos[0]} evento={evento} indice={0} passo={passo} />
      </div>
      <MetadeDoCampo d={d} lado={0} efeitoNa={efeitoNa} passo={passo} />
      <Mao lado={d.lados[0]} />
      <Anuncio evento={evento} passo={passo} />
    </div>
  )
}

function MetadeDoCampo({ d, lado: l, efeitoNa, passo }: { d: Duelo; lado: 0 | 1; efeitoNa: (l: 0 | 1, z: number, st?: boolean) => string; passo: number }) {
  const lado = d.lados[l]
  const topoCemiterio = lado.cemiterio[lado.cemiterio.length - 1]
  // o oponente se vê espelhado: a fileira dele corre da direita para a esquerda (estilo.css)
  const ordem = [0, 1, 2, 3, 4]
  return (
    <div className={`lado-campo ${l === 1 ? 'oponente' : ''}`}>
      <div className="fileira">
        <div className="zona especial"><span className="rotulo-zona">CAMPO</span></div>
        {ordem.map((z) => (
          <div key={z} className={`zona ${efeitoNa(l, z)}`} data-passo={efeitoNa(l, z) ? passo : undefined}>
            <span className="rotulo-zona">MONSTRO</span>
            {lado.monstros[z] && <NoCampo m={lado.monstros[z]!} />}
          </div>
        ))}
        <div className="zona especial" title={`Cemitério: ${lado.cemiterio.length} cartas`}>
          <span className="rotulo-zona">CEMITÉRIO</span>
          {topoCemiterio && <Carta id={topoCemiterio} style={{ filter: 'grayscale(0.6) brightness(0.7)' }} />}
          {lado.cemiterio.length > 0 && <span className="contagem">{lado.cemiterio.length}</span>}
        </div>
      </div>
      <div className="fileira">
        <div className="zona especial" title={`Deck Extra: ${lado.extra.length}`}>
          <span className="rotulo-zona">EXTRA</span>
          {lado.extra.length > 0 && <><Verso style={{ filter: 'hue-rotate(220deg)' }} /><span className="contagem">{lado.extra.length}</span></>}
        </div>
        {ordem.map((z) => {
          const c = lado.zonas[z]
          return (
            <div key={z} className={`zona st ${efeitoNa(l, z, true)}`}>
              <span className="rotulo-zona">MAGIA<br />ARMADILHA</span>
              {c && (c.virada ? <Verso /> : <Carta id={c.id} />)}
            </div>
          )
        })}
        <div className="zona especial" title={`Deck: ${lado.deck.length} cartas`}>
          <span className="rotulo-zona">DECK</span>
          {lado.deck.length > 0 && <Verso />}
          <span className="contagem">{lado.deck.length}</span>
        </div>
      </div>
    </div>
  )
}

function NoCampo({ m }: { m: MonstroEmCampo }) {
  const c = carta(m.id)
  const atk = atkDe(m)
  return (
    <div className={`no-campo ${m.posicao === 'defesa' ? 'defesa' : ''}`}>
      {m.virado ? <Verso /> : <Carta id={m.id} />}
      {!m.virado && c.tipo === 'monstro' && (
        <div className="chip-atk" style={m.posicao === 'defesa' ? { transform: 'translateX(-50%) rotate(90deg)', bottom: 'auto', top: '40%' } : undefined}>
          <span className={m.posicao === 'ataque' ? 'a em' : 'a'}>{atk}</span> / <span className={m.posicao === 'defesa' ? 'd em' : 'd'}>{defDe(m)}</span>
        </div>
      )}
    </div>
  )
}

function Mao({ lado, oponente }: { lado: Lado; oponente?: boolean }) {
  return (
    <div className={`mao ${oponente ? 'oponente' : ''}`}>
      {lado.mao.map((c) => (
        <div key={c.uid} className="na-mao">{oponente ? <Verso /> : <Carta id={c.id} />}</div>
      ))}
    </div>
  )
}

function ContadorDeLp({ lado, retrato, evento, indice, passo }: { lado: Lado; retrato: string; evento: Evento | null; indice: 0 | 1; passo: number }) {
  const [mostrado, setMostrado] = useState(lado.lp)
  // o contador desce rolando, como no anime
  useEffect(() => {
    if (mostrado === lado.lp) return
    const passoLp = Math.max(1, Math.ceil(Math.abs(lado.lp - mostrado) / 12))
    const t = setTimeout(() => setMostrado((v) => (v > lado.lp ? Math.max(lado.lp, v - passoLp) : Math.min(lado.lp, v + passoLp))), 28)
    return () => clearTimeout(t)
  }, [mostrado, lado.lp])
  const ferido = evento?.tipo === 'dano' && evento.lado === indice
  const curado = evento?.tipo === 'cura' && evento.lado === indice
  return (
    <div className={`contador-lp ${ferido ? 'ferido' : ''}`} key={ferido ? `f${passo}` : 'lp'}>
      <img src={arteDoDuelista(retrato)} alt="" className="pixel" />
      <div style={{ flex: 1 }}>
        <div className="quem">{lado.nome}</div>
        <div className="lp"><small>LP</small>{mostrado}</div>
        <div className="barra-lp"><div style={{ width: `${Math.min(100, (lado.lp / lado.lpInicial) * 100)}%` }} /></div>
      </div>
      {(ferido || curado) && <span className={`dano-flutua ${curado ? 'cura' : ''}`}>{curado ? '+' : '−'}{(evento as { valor: number }).valor}</span>}
    </div>
  )
}

function Anuncio({ evento, passo }: { evento: Evento | null; passo: number }) {
  if (!evento) return null
  let id: string | null = null
  let legenda = ''
  if (evento.tipo === 'ativar') {
    id = evento.id
    legenda = 'ATIVAR!'
  } else if (evento.tipo === 'armadilha') {
    id = evento.id
    legenda = 'ARMADILHA ATIVADA!'
  } else if (evento.tipo === 'invocacao' && evento.especial) {
    id = evento.id
    legenda = evento.especial === 'fusao' ? 'INVOCAÇÃO-FUSÃO!' : evento.especial === 'tributo' ? 'INVOCAÇÃO-TRIBUTO!' : 'RESSURREIÇÃO!'
  } else if (evento.tipo === 'invocacao' && carta(evento.id).raridade !== 'comum') {
    id = evento.id
    legenda = 'INVOCAÇÃO!'
  } else if (evento.tipo === 'inicio') legenda = 'É HORA DO DUELO!'
  if (!id && !legenda) return null
  return (
    <div className="anuncio" key={passo}>
      {id && <Carta id={id} />}
      <div className="legenda">{legenda}</div>
    </div>
  )
}
