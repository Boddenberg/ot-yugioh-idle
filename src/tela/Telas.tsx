// As telas de menu: entrada, arenas, deck, coleção, loja, altar, relíquias,
// estratégia e registro.
import { useMemo, useState } from 'react'
import type { Aleatorio } from '../nucleo/aleatorio'
import { ARENAS, indiceDaArena } from '../nucleo/arenas'
import { AVATARES } from '../nucleo/avatares'
import { carta, CARTAS, ehFusao, RARIDADES, type Atributo, type Carta as TCarta } from '../nucleo/cartas'
import {
  abrirPacote, arenaLiberada, colocarNoDeck, copias, COPIAS_MAX, DECK_MAX, DECK_MIN, desmontar, desmontarSobras, exportarSave,
  fundirNoAltar, HORAS_MAXIMAS_FORA, importarSave, montarMelhorDeck, noDeck, PACOTES, pacoteLiberado, precoDaFusao, problemaDoDeck,
  recompensaBase, sobrando, tirarDoDeck, type Ausencia, type Estado,
} from '../nucleo/progresso'
import { RELIQUIAS } from '../nucleo/reliquias'
import { arteDaCarta, arteDaReliquia, arteDoDuelista, Carta, classeDaMoldura, Olho, Verso } from './Carta'

// ── entrada ──

export function TelaEntrada({ aoComecar }: { aoComecar: (nome: string, avatar: string) => void }) {
  const [nome, setNome] = useState('')
  const [avatar, setAvatar] = useState(AVATARES[0].id)
  const pronto = nome.trim().length >= 2
  return (
    <div className="entrada">
      <div className="caixa-entrada painel">
        <Olho className="olho-grande" />
        <div className="logo-texto" style={{ marginTop: 8 }}>
          <div className="ot" style={{ fontSize: '0.8rem' }}>O T</div>
        </div>
        <h1>Yu-Gi-Oh! Idle</h1>
        <p className="slogan">Monte seu deck, escolha a arena e o seu duelista duela sozinho, até com o jogo fechado.</p>
        <div className="vitrine">
          {['mago-sombrio-supremo', 'dragao-rubro-das-cinzas', 'dragao-alvo-celestial', 'barreira-espelhada', 'raio-celeste'].map((id) => <Carta key={id} id={id} />)}
        </div>
        <h3 className="titulo-fonte" style={{ color: 'var(--ouro)', marginTop: '1.6rem' }}>Escolha o seu duelista</h3>
        <div className="avatares">
          {AVATARES.map((a) => (
            <button key={a.id} className={avatar === a.id ? 'ativo' : ''} onClick={() => setAvatar(a.id)} title={a.nome}>
              <img src={arteDoDuelista(a.id)} alt={a.nome} className="pixel" />
            </button>
          ))}
        </div>
        <input value={nome} maxLength={16} placeholder="Nome do duelista" onChange={(ev) => setNome(ev.target.value)}
          onKeyDown={(ev) => ev.key === 'Enter' && pronto && aoComecar(nome.trim(), avatar)} />
        <div style={{ marginTop: '1.2rem' }}>
          <button className="botao ouro" disabled={!pronto} onClick={() => aoComecar(nome.trim(), avatar)}>É hora do duelo!</button>
        </div>
        <p className="nota-fa">Projeto de fã, sem vínculo com a Konami ou com o Kazuki Takahashi. Cartas, nomes e artes são próprios.</p>
      </div>
    </div>
  )
}

// ── arenas ──

export function TelaArenas({ e, aoDuelar, aoDesafiar }: { e: Estado; aoDuelar: (id: string) => void; aoDesafiar: (id: string) => void }) {
  return (
    <>
      <div className="cabecalho-tela">
        <div>
          <h1>Arenas</h1>
          <p>Cada arena tem três duelistas que se revezam e um mestre que guarda uma Relíquia do Milênio. Vença o mestre para abrir a próxima.</p>
        </div>
      </div>
      <div className="grade-arenas">
        {ARENAS.map((a, i) => {
          const livre = arenaLiberada(e, a)
          const vencido = e.mestresVencidos.includes(a.mestre.id)
          const pa = e.estatisticas.porArena[a.id]
          const r = recompensaBase(i, false)
          const motivo = e.nivel < a.nivel ? `Precisa do nível ${a.nivel}` : `Vença ${ARENAS[i - 1]?.mestre.nome}`
          return (
            <div key={a.id} className={`painel arena-cartao ${livre ? '' : 'trancada'} ${e.arena === a.id ? 'atual' : ''}`}>
              <div className="faixa" style={{ background: `linear-gradient(135deg, ${a.cor}, #0a0716 80%)` }}>
                <h2>{a.nome}</h2>
                <span className="nivel">Nv. {a.nivel}+</span>
              </div>
              <div className="corpo">
                <p className="descricao">{a.descricao}</p>
                <div className="rostos">
                  {a.oponentes.map((o) => <img key={o.id} src={arteDoDuelista(o.id)} className="pixel" title={`${o.nome}, ${o.titulo}`} alt="" />)}
                  <img src={arteDoDuelista(a.mestre.id)} className="pixel mestre-rosto" title={`Mestre: ${a.mestre.nome}, ${a.mestre.titulo}`} alt="" />
                </div>
                <div className="linha">
                  <span className="selo num">+{r.dp} DP · +{r.xp} XP</span>
                  {pa && <span className="selo num">{pa.v}V / {pa.d}D</span>}
                  {vencido ? <span className="selo ok">Mestre vencido</span> : (
                    <span className="selo" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <img src={arteDaReliquia(a.reliquia)} alt="" className="pixel" style={{ width: 16 }} /> {RELIQUIAS.find((x) => x.id === a.reliquia)!.nome}
                    </span>
                  )}
                </div>
                <div className="linha">
                  {livre ? (
                    <>
                      <button className="botao pequeno" onClick={() => aoDuelar(a.id)}>{e.arena === a.id ? 'Duelando aqui' : 'Duelar aqui'}</button>
                      <button className="botao ouro pequeno" onClick={() => aoDesafiar(a.id)}>{vencido ? 'Revanche' : 'Desafiar'} {a.mestre.nome}</button>
                    </>
                  ) : <span className="selo">🔒 {motivo}</span>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

// ── coleção e deck ──

type Filtro = 'todas' | 'monstro' | 'magia' | 'armadilha' | 'fusao' | Atributo
const FILTROS: [Filtro, string][] = [['todas', 'Todas'], ['monstro', 'Monstros'], ['magia', 'Magias'], ['armadilha', 'Armadilhas'], ['fusao', 'Fusões'],
  ['trevas', 'Trevas'], ['luz', 'Luz'], ['fogo', 'Fogo'], ['agua', 'Água'], ['terra', 'Terra'], ['vento', 'Vento'], ['divino', 'Divino']]

const passa = (c: TCarta, f: Filtro) => {
  if (f === 'todas') return true
  if (f === 'monstro') return c.tipo === 'monstro' && !c.materiais
  if (f === 'fusao') return ehFusao(c)
  if (f === 'magia' || f === 'armadilha') return c.tipo === f
  return c.tipo === 'monstro' && c.atributo === f
}

function Filtros({ f, setF }: { f: Filtro; setF: (f: Filtro) => void }) {
  return (
    <div className="filtros">
      {FILTROS.map(([id, nome]) => <button key={id} className={f === id ? 'ativo' : ''} onClick={() => setF(id)}>{nome}</button>)}
    </div>
  )
}

export function ModalCarta({ id, aoFechar, e }: { id: string; aoFechar: () => void; e?: Estado }) {
  const c = carta(id)
  return (
    <div className="modal-fundo" onClick={aoFechar}>
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }} onClick={(ev) => ev.stopPropagation()}>
        <Carta id={id} tam={5} />
        <div className="painel" style={{ padding: '1rem 1.2rem', maxWidth: 320 }}>
          <h2 className="titulo-fonte" style={{ margin: '0 0 0.4rem', color: 'var(--ouro-claro)' }}>{c.nome}</h2>
          <p style={{ margin: '0 0 0.6rem', color: 'var(--texto-2)', fontSize: '0.85rem' }}>{RARIDADES[c.raridade].nome}{e ? ` · você tem ${copias(e, id)}` : ''}</p>
          <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>{c.texto}</p>
          <button className="botao pequeno" style={{ marginTop: '1rem' }} onClick={aoFechar}>Fechar</button>
        </div>
      </div>
    </div>
  )
}

export function TelaColecao({ e }: { e: Estado }) {
  const [f, setF] = useState<Filtro>('todas')
  const [zoom, setZoom] = useState<string | null>(null)
  const temQuantas = CARTAS.filter((c) => copias(e, c.id) > 0).length
  return (
    <>
      <div className="cabecalho-tela">
        <div>
          <h1>Coleção</h1>
          <p>{temQuantas} de {CARTAS.length} cartas descobertas. As que faltam saem dos duelos, dos pacotes e do Altar de Fusão.</p>
        </div>
      </div>
      <Filtros f={f} setF={setF} />
      <div className="grade-cartas">
        {CARTAS.filter((c) => passa(c, f)).map((c) => {
          const n = copias(e, c.id)
          return (
            <div key={c.id} className="item-colecao">
              {n > 0 ? <Carta id={c.id} onClick={() => setZoom(c.id)} /> : <div className="desconhecida">?</div>}
              <div className="quantas">{n > 0 ? <>× <b>{n}</b></> : RARIDADES[c.raridade].sigla}</div>
            </div>
          )
        })}
      </div>
      {zoom && <ModalCarta id={zoom} e={e} aoFechar={() => setZoom(null)} />}
    </>
  )
}

export function TelaDeck({ e, aoMudar, avisar }: { e: Estado; aoMudar: () => void; avisar: (t: string) => void }) {
  const [f, setF] = useState<Filtro>('todas')
  const [zoom, setZoom] = useState<string | null>(null)
  const problema = problemaDoDeck(e)
  const grupos = useMemo(() => {
    const unicos = [...new Set(e.deck)].sort((a, b) => carta(a).nome.localeCompare(carta(b).nome))
    return {
      Monstros: unicos.filter((id) => carta(id).tipo === 'monstro'),
      Magias: unicos.filter((id) => carta(id).tipo === 'magia'),
      Armadilhas: unicos.filter((id) => carta(id).tipo === 'armadilha'),
    }
  }, [e.deck.length, e.deck.join()])
  const extra = Object.keys(e.colecao).filter((id) => ehFusao(carta(id)))
  const minhas = CARTAS.filter((c) => copias(e, c.id) > 0 && passa(c, f))
  return (
    <>
      <div className="cabecalho-tela">
        <div>
          <h1>Construtor de Deck</h1>
          <p>De {DECK_MIN} a {DECK_MAX} cartas, até {COPIAS_MAX} cópias de cada. Os Monstros de Fusão que você tem vão sozinhos para o Deck Extra.</p>
        </div>
        <div className="acoes">
          <button className="botao ouro pequeno" onClick={() => { e.deck = montarMelhorDeck(e); aoMudar(); avisar('Deck montado com as melhores cartas da coleção.') }}>Montar automaticamente</button>
        </div>
      </div>
      <div className="tela-deck">
        <div className="painel lista-deck">
          <div className="painel-titulo">Deck principal</div>
          <div className="contador-deck">{e.deck.length}<small> / {DECK_MAX} cartas</small></div>
          {problema ? <div className="erro">{problema}</div> : <div className="ok-texto">Deck pronto para duelar.</div>}
          {Object.entries(grupos).map(([nome, ids]) => ids.length > 0 && (
            <div key={nome} className="grupo">
              <h3>{nome} ({ids.reduce((s, id) => s + noDeck(e, id), 0)})</h3>
              {ids.map((id) => (
                <div key={id} className={`linha-deck ${classeDaMoldura(carta(id)) === 'efeito' || classeDaMoldura(carta(id)) === 'divino' ? 'monstro' : classeDaMoldura(carta(id))}`}
                  onClick={() => { tirarDoDeck(e, id); aoMudar() }} title="Clique para tirar uma cópia">
                  <img src={arteDaCarta(id)} alt="" />
                  <span>{carta(id).nome}</span>
                  <span className="qtd">×{noDeck(e, id)}</span>
                </div>
              ))}
            </div>
          ))}
          <div className="grupo">
            <h3>Deck Extra ({extra.length})</h3>
            {extra.length === 0 && <p style={{ fontSize: '0.78rem', color: 'var(--texto-3)', margin: 0 }}>Nenhuma fusão ainda. Ganhe nos pacotes ou crie no Altar.</p>}
            {extra.map((id) => (
              <div key={id} className="linha-deck fusao" onClick={() => setZoom(id)}>
                <img src={arteDaCarta(id)} alt="" />
                <span>{carta(id).nome}</span>
                <span className="qtd">×{Math.min(COPIAS_MAX, copias(e, id))}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <Filtros f={f} setF={setF} />
          <div className="grade-cartas">
            {minhas.map((c) => {
              const usadas = noDeck(e, c.id)
              const max = ehFusao(c) ? 0 : Math.min(COPIAS_MAX, copias(e, c.id))
              return (
                <div key={c.id} className="item-colecao">
                  <Carta id={c.id} onClick={() => setZoom(c.id)} />
                  <div className="quantas">no deck <b>{usadas}</b> / {max} · tem {copias(e, c.id)}</div>
                  {!ehFusao(c) && (
                    <div className="acoes-carta">
                      <button disabled={usadas === 0} onClick={() => { tirarDoDeck(e, c.id); aoMudar() }}>−</button>
                      <button disabled={usadas >= max || e.deck.length >= DECK_MAX} onClick={() => { const erro = colocarNoDeck(e, c.id); if (erro) avisar(erro); aoMudar() }}>+</button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
      {zoom && <ModalCarta id={zoom} e={e} aoFechar={() => setZoom(null)} />}
    </>
  )
}

// ── loja ──

export function TelaLoja({ e, rng, aoMudar, avisar }: { e: Estado; rng: Aleatorio; aoMudar: () => void; avisar: (t: string) => void }) {
  const [aberto, setAberto] = useState<{ cartas: string[]; novas: Set<string> } | null>(null)
  const [virados, setVirados] = useState<Set<number>>(new Set())
  const comprar = (id: string) => {
    const antes = new Set(Object.keys(e.colecao))
    const r = abrirPacote(e, id, rng)
    if (typeof r === 'string') return avisar(r)
    setVirados(new Set())
    setAberto({ cartas: r, novas: new Set(r.filter((c) => !antes.has(c))) })
    aoMudar()
  }
  return (
    <>
      <div className="cabecalho-tela">
        <div>
          <h1>Loja de Cartas</h1>
          <p>Cinco cartas por pacote, e a última é sempre Rara ou melhor. Cada arena aberta põe um pacote novo na vitrine.</p>
        </div>
      </div>
      <div className="grade-pacotes">
        {PACOTES.map((p) => {
          const livre = pacoteLiberado(e, p)
          const vitrine = [...p.cartas].sort((a, b) => RARIDADES[carta(a).raridade].peso - RARIDADES[carta(b).raridade].peso)[0]
          return (
            <div key={p.id} className="painel pacote" style={livre ? undefined : { filter: 'grayscale(1) brightness(0.5)' }}>
              <div className="embalagem" style={{ '--cor': p.cor } as React.CSSProperties}>
                <div className="marca">DUEL MONSTERS</div>
                <img src={arteDaCarta(vitrine)} alt="" />
                <div className="nome-pacote">{p.nome}</div>
              </div>
              <div className="preco"><span className="icone-dp">DP</span>{p.preco.toLocaleString('pt-BR')}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--texto-3)' }}>{p.cartas.length} cartas possíveis · {ARENAS[indiceDaArena(p.arena)].nome}</div>
              <button className="botao ouro pequeno" disabled={!livre || e.dp < p.preco} onClick={() => comprar(p.id)}>{livre ? 'Comprar e abrir' : '🔒 Abra a arena'}</button>
            </div>
          )
        })}
      </div>
      {aberto && (
        <div className="modal-fundo">
          <div className="modal painel" style={{ textAlign: 'center' }}>
            <h2 className="titulo-fonte" style={{ color: 'var(--ouro-claro)', margin: 0 }}>Clique nas cartas para revelar</h2>
            <div className="abertura">
              {aberto.cartas.map((id, i) => (
                <div key={i} className={`virador ${virados.has(i) ? `virado brilha-${carta(id).raridade}` : ''}`}
                  onClick={() => setVirados(new Set([...virados, i]))}>
                  <div><Verso tam={2.6} /></div>
                  <div className="frente">
                    <Carta id={id} tam={2.6} />
                    {virados.has(i) && aberto.novas.has(id) && <span className="nova">NOVA!</span>}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button className="botao pequeno" onClick={() => setVirados(new Set([0, 1, 2, 3, 4]))}>Revelar todas</button>
              <button className="botao ouro pequeno" onClick={() => setAberto(null)}>Guardar na coleção</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── altar ──

export function TelaAltar({ e, aoMudar, avisar }: { e: Estado; aoMudar: () => void; avisar: (t: string) => void }) {
  const fusoes = CARTAS.filter(ehFusao)
  const sobras = Object.keys(e.colecao).filter((id) => sobrando(e, id) > 0)
  const poSobras = sobras.reduce((s, id) => s + sobrando(e, id) * RARIDADES[carta(id).raridade].po, 0)
  return (
    <>
      <div className="cabecalho-tela">
        <div>
          <h1>Altar de Fusão</h1>
          <p>Tendo os materiais (eles não se gastam) e o Pó Estelar, o altar cria o Monstro de Fusão. No duelo, a Fusão Arcana no deck invoca a fusão do Deck Extra.</p>
        </div>
        <div className="acoes">
          <button className="botao pequeno" disabled={!sobras.length} onClick={() => { const po = desmontarSobras(e); avisar(`As sobras viraram ${po} de Pó Estelar.`); aoMudar() }}>
            Desmontar sobras (+{poSobras} pó)
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        {fusoes.map((f) => {
          const mats = f.materiais!
          const temMats = mats.every((m, _i, l) => copias(e, m) >= l.filter((x) => x === m).length)
          const preco = precoDaFusao(f.id)
          return (
            <div key={f.id} className="painel receita">
              {mats.map((m, i) => (
                <div key={i} style={{ display: 'contents' }}>
                  {i > 0 && <span className="mais">+</span>}
                  {copias(e, m) > 0 ? <Carta id={m} /> : <div className="desconhecida" style={{ '--tam': '1.7px' } as React.CSSProperties}>?</div>}
                </div>
              ))}
              <span className="mais">=</span>
              <Carta id={f.id} className={copias(e, f.id) ? '' : 'apagada'} />
              <div className="info">
                <b className="titulo-fonte" style={{ color: 'var(--ouro-claro)', fontSize: '1rem' }}>{f.nome}</b>
                <span className="num">ATK {f.atk} / DEF {f.def} · você tem {copias(e, f.id)}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span className="icone-po" /> {preco} de Pó Estelar</span>
                <button className="botao ouro pequeno" style={{ alignSelf: 'flex-start' }} disabled={!temMats || e.po < preco}
                  onClick={() => { const erro = fundirNoAltar(e, f.id); avisar(erro ?? `${f.nome} nasceu no altar!`); aoMudar() }}>Fundir</button>
              </div>
            </div>
          )
        })}
      </div>
      <h2 className="titulo-fonte" style={{ color: 'var(--ouro)', marginTop: '2rem' }}>Desmontar cartas</h2>
      <p style={{ color: 'var(--texto-2)', fontSize: '0.85rem', marginTop: 0 }}>Só as cópias que não estão no deck. Comum 5 · Rara 20 · Super 60 · Ultra 200 · Secreta 600.</p>
      <div className="grade-cartas">
        {Object.keys(e.colecao).filter((id) => copias(e, id) - noDeck(e, id) > 0).map((id) => (
          <div key={id} className="item-colecao">
            <Carta id={id} />
            <div className="quantas">livres <b>{copias(e, id) - noDeck(e, id)}</b></div>
            <button className="botao pequeno" onClick={() => { const erro = desmontar(e, id); if (erro) avisar(erro); aoMudar() }}>+{RARIDADES[carta(id).raridade].po} pó</button>
          </div>
        ))}
      </div>
    </>
  )
}

// ── relíquias ──

export function TelaReliquias({ e }: { e: Estado }) {
  return (
    <>
      <div className="cabecalho-tela">
        <div>
          <h1>Relíquias do Milênio</h1>
          <p>{e.reliquias.length} de 7. Cada mestre de arena guarda uma, e o efeito vale para sempre.</p>
        </div>
      </div>
      <div className="tabua">
        {RELIQUIAS.map((r) => {
          const tem = e.reliquias.includes(r.id)
          const dono = ARENAS.find((a) => a.reliquia === r.id)!
          return (
            <div key={r.id} className={`painel reliquia ${tem ? 'tem' : 'falta'}`}>
              <div className="disco"><img src={arteDaReliquia(r.id)} alt="" /></div>
              <div>
                <h3>{r.nome}</h3>
                <p>{r.efeito}</p>
                <p style={{ marginTop: 6, color: tem ? 'var(--vitoria)' : 'var(--texto-3)', fontSize: '0.75rem' }}>
                  {tem ? 'Conquistada' : `Guardada por ${dono.mestre.nome} (${dono.nome})`}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

// ── estratégia ──

export function TelaRegras({ e, aoMudar }: { e: Estado; aoMudar: () => void }) {
  const est = e.estrategia
  const Chave = ({ campo }: { campo: 'fracosEmDefesa' | 'guardarDanoParaOFinal' | 'atacarViradas' | 'vorticeSoPerdendo' }) => (
    <button className={`chave ${est[campo] ? 'ligada' : ''}`} onClick={() => { est[campo] = !est[campo]; aoMudar() }} aria-pressed={est[campo]} />
  )
  return (
    <>
      <div className="cabecalho-tela">
        <div>
          <h1>Estratégia do Duelista</h1>
          <p>Como no OT Idle a barra de ações tinha regras, aqui é você quem ensina o seu duelista a jogar. Vale nos duelos ao vivo e nos de fora.</p>
        </div>
      </div>
      <div className="painel">
        <div className="regra"><div className="txt"><b>Monstros fracos entram em defesa</b><span>Quem não vence o maior monstro do oponente é colocado virado para baixo em Posição de Defesa.</span></div><Chave campo="fracosEmDefesa" /></div>
        <div className="regra"><div className="txt"><b>Atacar monstros virados</b><span>Ataca cartas viradas para baixo sem saber a DEF (com o Olho do Milênio, o duelista já sabe).</span></div><Chave campo="atacarViradas" /></div>
        <div className="regra"><div className="txt"><b>Guardar dano para o golpe final</b><span>As magias de dano direto esperam até somar o bastante para zerar os LP do oponente.</span></div><Chave campo="guardarDanoParaOFinal" /></div>
        <div className="regra"><div className="txt"><b>Vórtice Sombrio só perdendo</b><span>A magia que destrói todos os monstros só é usada quando o campo do oponente é bem mais forte.</span></div><Chave campo="vorticeSoPerdendo" /></div>
        <div className="regra">
          <div className="txt"><b>Curar abaixo de {est.curarAbaixo} LP</b><span>O Cálice Curativo espera os seus LP caírem até aqui.</span></div>
          <input type="range" min={1000} max={8000} step={500} value={est.curarAbaixo} onChange={(ev) => { est.curarAbaixo = Number(ev.target.value); aoMudar() }} style={{ accentColor: '#d4af37', width: 180 }} />
        </div>
      </div>
    </>
  )
}

// ── registro ──

export function TelaRegistro({ e, aoMudar, aoApagar, avisar }: { e: Estado; aoMudar: () => void; aoApagar: () => void; avisar: (t: string) => void }) {
  const s = e.estatisticas
  const horas = Math.max(1 / 60, (Date.now() - e.criadoEm) / 3_600_000)
  const [codigo, setCodigo] = useState('')
  return (
    <>
      <div className="cabecalho-tela"><div><h1>Registro do Duelista</h1><p>Tudo o que aconteceu desde {new Date(e.criadoEm).toLocaleDateString('pt-BR')}.</p></div></div>
      <div className="numeros-grandes">
        {[
          [s.duelos, 'duelos'], [s.vitorias, 'vitórias'], [`${s.duelos ? Math.round((s.vitorias / s.duelos) * 100) : 0}%`, 'taxa de vitória'],
          [Math.round(s.dpGanhos / horas).toLocaleString('pt-BR'), 'DP por hora'], [s.cartasGanhas, 'cartas ganhas'], [s.pacotesAbertos, 'pacotes abertos'],
        ].map(([v, r]) => <div key={r as string} className="painel numero-grande"><div className="v">{v}</div><div className="r">{r}</div></div>)}
      </div>
      <div className="painel" style={{ marginBottom: '1rem' }}>
        <div className="painel-titulo">Por arena</div>
        <table className="tabela">
          <thead><tr><th>Arena</th><th>Vitórias</th><th>Derrotas</th><th>Taxa</th><th>Mestre</th></tr></thead>
          <tbody>
            {ARENAS.map((a) => {
              const pa = s.porArena[a.id]
              return (
                <tr key={a.id}>
                  <td>{a.nome}</td><td className="num">{pa?.v ?? 0}</td><td className="num">{pa?.d ?? 0}</td>
                  <td className="num">{pa && pa.v + pa.d ? `${Math.round((pa.v / (pa.v + pa.d)) * 100)}%` : '—'}</td>
                  <td>{e.mestresVencidos.includes(a.mestre.id) ? '✔' : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="painel" style={{ marginBottom: '1rem' }}>
        <div className="painel-titulo">Últimos duelos</div>
        <table className="tabela">
          <tbody>
            {e.historico.slice(0, 15).map((h, i) => (
              <tr key={i}>
                <td style={{ color: h.venceu ? 'var(--vitoria)' : 'var(--perigo)' }}>{h.venceu ? 'Vitória' : h.venceu === false ? 'Derrota' : 'Empate'}</td>
                <td>{ARENAS.flatMap((a) => [...a.oponentes, a.mestre]).find((o) => o.id === h.oponente)?.nome}</td>
                <td className="num">+{h.dp} DP · +{h.xp} XP</td>
                <td>{h.carta ? carta(h.carta).nome : ''}{h.reliquia ? ` · ${RELIQUIAS.find((r) => r.id === h.reliquia)!.nome}` : ''}</td>
                <td style={{ color: 'var(--texto-3)', fontSize: '0.75rem' }}>{new Date(h.quando).toLocaleTimeString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="painel" style={{ padding: '1rem' }}>
        <div className="painel-titulo" style={{ padding: '0 0 0.6rem', marginBottom: '0.8rem' }}>Save</div>
        <p style={{ fontSize: '0.82rem', color: 'var(--texto-2)', marginTop: 0 }}>O jogo salva sozinho neste navegador. Para levar a outro aparelho, copie o código e cole lá. Com o jogo fechado, o duelista segue duelando por até {HORAS_MAXIMAS_FORA} horas.</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="botao pequeno" onClick={() => { void navigator.clipboard?.writeText(exportarSave(e)); avisar('Código do save copiado.') }}>Copiar código do save</button>
          <input value={codigo} onChange={(ev) => setCodigo(ev.target.value)} placeholder="Cole um código de save" style={{ flex: 1, minWidth: 200, background: '#000', border: '1px solid var(--fio)', color: 'var(--texto)', padding: '0 0.6rem' }} />
          <button className="botao pequeno" onClick={() => {
            const novo = importarSave(codigo)
            if (!novo) return avisar('Código inválido.')
            Object.assign(e, novo)
            aoMudar()
            avisar('Save carregado.')
          }}>Carregar</button>
          <button className="botao perigo pequeno" onClick={() => { if (confirm('Apagar o duelista e começar de novo?')) aoApagar() }}>Apagar tudo</button>
        </div>
      </div>
    </>
  )
}

// ── a volta ──

export function ModalAusencia({ a, aoFechar }: { a: Ausencia; aoFechar: () => void }) {
  const h = Math.floor(a.segundos / 3600)
  const m = Math.floor((a.segundos % 3600) / 60)
  const unicas = [...new Set(a.cartas)]
  return (
    <div className="modal-fundo" onClick={aoFechar}>
      <div className="modal painel" style={{ maxWidth: 640, textAlign: 'center' }} onClick={(ev) => ev.stopPropagation()}>
        <Olho style={{ width: 80 }} />
        <h2 className="titulo-fonte" style={{ color: 'var(--ouro-claro)', margin: '0.4rem 0' }}>Enquanto você estava fora</h2>
        <p style={{ color: 'var(--texto-2)', marginTop: 0 }}>{h > 0 ? `${h}h ` : ''}{m}min longe. O seu duelista não parou.</p>
        <div className="numeros-grandes">
          <div className="painel numero-grande"><div className="v">{a.duelos}</div><div className="r">duelos</div></div>
          <div className="painel numero-grande"><div className="v" style={{ color: 'var(--vitoria)' }}>{a.vitorias}</div><div className="r">vitórias</div></div>
          <div className="painel numero-grande"><div className="v">+{a.dp.toLocaleString('pt-BR')}</div><div className="r">DP</div></div>
          <div className="painel numero-grande"><div className="v">+{a.xp.toLocaleString('pt-BR')}</div><div className="r">XP</div></div>
        </div>
        {a.nivelDepois > a.nivelAntes && <p style={{ color: 'var(--ouro-claro)' }}>Subiu do nível {a.nivelAntes} para o {a.nivelDepois}!</p>}
        {unicas.length > 0 && (
          <>
            <p style={{ color: 'var(--texto-2)' }}>{a.cartas.length} cartas ganhas</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {unicas.slice(0, 8).map((id) => <Carta key={id} id={id} tam={1.6} />)}
            </div>
          </>
        )}
        <button className="botao ouro" style={{ marginTop: '1.2rem' }} onClick={aoFechar}>Voltar a duelar</button>
      </div>
    </div>
  )
}
