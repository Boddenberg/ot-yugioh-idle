// A carta desenhada como no Duel Monsters: moldura na cor do tipo, nome com o
// atributo, estrelas de nível, a arte, a caixa de texto e o ATK/DEF. Tudo em
// `em`: o mesmo componente serve do campo (pequeno) à abertura de pacote.
import type { CSSProperties } from 'react'
import { ATRIBUTOS, carta as acharCarta, RARIDADES, type Carta as TCarta } from '../nucleo/cartas'

export const arteDaCarta = (id: string) => `${import.meta.env.BASE_URL}arte/cartas/${id}.png`
export const arteDoDuelista = (id: string) => `${import.meta.env.BASE_URL}arte/duelistas/${id}.png`
export const arteDaReliquia = (id: string) => `${import.meta.env.BASE_URL}arte/reliquias/${id}.png`

export function classeDaMoldura(c: TCarta) {
  if (c.tipo === 'magia') return 'magia'
  if (c.tipo === 'armadilha') return 'armadilha'
  if (c.materiais) return 'fusao'
  if (c.atributo === 'divino') return 'divino'
  return c.efeitos.length ? 'efeito' : 'normal'
}

const ICONES = { normal: '', equipamento: '✚', rapida: 'ϟ', continua: '∞', contra: '➚' }

interface Props {
  id: string
  tam?: number
  className?: string
  style?: CSSProperties
  onClick?: () => void
  title?: string
}

export function Carta({ id, tam, className = '', style, onClick, title }: Props) {
  const c = acharCarta(id)
  const moldura = classeDaMoldura(c)
  const estilo = { ...(tam ? { '--tam': `${tam}px` } : {}), ...style } as CSSProperties
  const nomeTipo = c.tipo === 'monstro'
    ? `[${c.raca}${c.materiais ? '/Fusão' : ''}${c.efeitos.length ? '/Efeito' : ''}]`
    : null
  return (
    <div className={`carta ${moldura} r-${c.raridade} ${onClick ? 'clicavel' : ''} ${className}`} style={estilo} onClick={onClick}
      title={title ?? `${c.nome} — ${RARIDADES[c.raridade].nome}`}>
      <div className="moldura">
        <div className="nome-carta">
          <span>{c.nome}</span>
          {c.tipo === 'monstro'
            ? <div className={`atributo at-${c.atributo}`}><b>{ATRIBUTOS[c.atributo].kanji}</b></div>
            : <div className={`atributo at-${c.tipo}`}><b>{c.tipo === 'magia' ? '魔' : '罠'}</b></div>}
        </div>
        <div className="estrelas">
          {c.tipo === 'monstro'
            ? Array.from({ length: c.nivel }, (_, i) => <div key={i} className="estrela" />)
            : (
              <div className="tipo-magia">
                [{c.tipo === 'magia' ? 'Carta Mágica' : 'Carta Armadilha'}
                {ICONES[c.icone] && <span className="ic">{ICONES[c.icone]}</span>}]
              </div>
            )}
        </div>
        <div className="arte"><img src={arteDaCarta(c.id)} alt="" loading="lazy" draggable={false} /></div>
        <div className="caixa">
          {nomeTipo && <div className="linha-tipo">{nomeTipo}</div>}
          <div className="texto">{c.texto}</div>
          {c.tipo === 'monstro' && (
            <div className="numeros"><span>ATK/{c.atk}</span><span>DEF/{c.def}</span></div>
          )}
        </div>
      </div>
    </div>
  )
}

export function Verso({ tam, className = '', style }: { tam?: number; className?: string; style?: CSSProperties }) {
  const estilo = { ...(tam ? { '--tam': `${tam}px` } : {}), ...style } as CSSProperties
  return (
    <div className={`carta verso ${className}`} style={estilo}>
      <div className="moldura"><Olho className="olho-verso" /></div>
    </div>
  )
}

// o Olho de Wdjat, o símbolo das relíquias, desenhado à mão
export function Olho({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 200 130" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id="ouro-olho" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff3b8" />
          <stop offset="0.45" stopColor="#e2b23a" />
          <stop offset="0.55" stopColor="#a8741b" />
          <stop offset="1" stopColor="#f2cd5f" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="url(#ouro-olho)" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 52 Q100 -6 182 52" strokeWidth="9" />
        <path d="M30 58 Q100 8 172 58 Q100 104 30 58 Z" strokeWidth="8" />
        <path d="M90 100 L84 124" strokeWidth="8" />
        <path d="M118 96 Q140 104 146 120 Q150 128 140 126" strokeWidth="7" />
        <path d="M172 58 L194 60" strokeWidth="7" />
      </g>
      <circle cx="100" cy="56" r="19" fill="url(#ouro-olho)" />
      <circle cx="100" cy="56" r="8" fill="#1a0f02" />
    </svg>
  )
}
