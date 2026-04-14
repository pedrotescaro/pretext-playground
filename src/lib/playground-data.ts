export type FontPresetId = 'grotesk' | 'serif' | 'mono'

export type FontPreset = {
  id: FontPresetId
  label: string
  vibe: string
  family: string
  weight: number
}

export type TextPreset = {
  id: string
  label: string
  body: string
}

export type TextCard = {
  id: string
  title: string
  body: string
  accent: string
}

export const FONT_PRESETS: FontPreset[] = [
  {
    id: 'grotesk',
    label: 'Space Grotesk',
    vibe: 'Produto / interface',
    family: '"Space Grotesk", sans-serif',
    weight: 500,
  },
  {
    id: 'serif',
    label: 'Newsreader',
    vibe: 'Editorial / contraste',
    family: '"Newsreader", serif',
    weight: 500,
  },
  {
    id: 'mono',
    label: 'IBM Plex Mono',
    vibe: 'Debug / ferramental',
    family: '"IBM Plex Mono", monospace',
    weight: 400,
  },
]

export const TEXT_PRESETS: TextPreset[] = [
  {
    id: 'manifesto',
    label: 'Manifesto',
    body:
      'Pretext.js permite medir e distribuir texto sem tocar no DOM. Isso muda a forma como desenhamos interfaces: cards deixam de ser estimativa, labels deixam de saltar e o layout passa a responder como um sistema grafico.\n\nArraste a largura, troque a tipografia e observe as linhas respirarem em tempo real. Unicode continua vivo: cafe, Sao Paulo, Tokyo, al-arabiya e microdetalhes como quebra manual e distribuicao por banda.',
  },
  {
    id: 'poema',
    label: 'Poema',
    body:
      'As linhas nao caem por acaso.\nElas dobram, negociam, se apoiam.\nUm slider altera o espaco.\nUma forma surge no meio do texto.\nE a pagina responde sem pedir permissao ao DOM.',
  },
  {
    id: 'ui-copy',
    label: 'UI Copy',
    body:
      'Headline fit.\nCard heights.\nMasonry sem chute.\nObstacle-aware wrapping.\nPerformance previsivel.\n\nTudo isso nasce quando medir texto deixa de ser um efeito colateral do navegador e vira um dado de composicao.',
  },
]

export const DEFAULT_TEXT = TEXT_PRESETS[0]!.body

export const TEXT_CARDS: TextCard[] = [
  {
    id: 'card-01',
    title: 'Shrink-wrap real',
    body:
      'O maior comprimento de linha revela a menor caixa util para chat bubbles, captions e labels sem depender de fit-content.',
    accent: '#67e8f9',
  },
  {
    id: 'card-02',
    title: 'Virtualizacao sem chute',
    body:
      'Quando a altura de texto eh conhecida antes da renderizacao, listas enormes deixam de oscilar ou "saltar" durante o scroll.',
    accent: '#f9a8d4',
  },
  {
    id: 'card-03',
    title: 'Editorial engine',
    body:
      'Linhas podem continuar em outra coluna, contornar formas e manter uma narrativa continua como numa composicao impressa.',
    accent: '#a5f3fc',
  },
  {
    id: 'card-04',
    title: 'Unicode de verdade',
    body:
      'Mesma logica para latin, CJK, RTL e emoji. O playground serve como instrumento visual para testar essas tensoes.',
    accent: '#fde68a',
  },
  {
    id: 'card-05',
    title: 'Hot path barato',
    body:
      'prepare() faz o trabalho pesado uma vez. Depois, layout() vira aritmetica pura para resize, drag e interacoes densas.',
    accent: '#86efac',
  },
  {
    id: 'card-06',
    title: 'Figma feeling',
    body:
      'Aqui o texto age como material de composicao: responde a largura, aceita intervencao manual e vira dado para outros algoritmos.',
    accent: '#c4b5fd',
  },
]
