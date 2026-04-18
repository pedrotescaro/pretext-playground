import type {
  MiranhaSceneBlueprint,
  NarrativeBlockBlueprint,
  OrbitTagBlueprint,
} from '../lib/miranha-types'

function block(
  id: string,
  type: NarrativeBlockBlueprint['type'],
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
): NarrativeBlockBlueprint {
  return { id, type, text, x, y, width, height }
}

export const MIRANHA_SCENES: MiranhaSceneBlueprint[] = [
  {
    id: 'close-dramatico',
    label: 'Close dramático',
    capsule: '01 / Close dramático',
    chapter: 'Intro',
    heading: {
      overline: 'Close / leitura imediata / silhueta forte',
      titleLead: 'Pelúcia',
      titleAccent: 'do Miranha',
      deck:
        'Cena de abertura em close para vender o impacto do plush logo de cara.',
      sideNote:
        'A pelúcia invade o quadro e o texto ocupa o espaço livre como no vídeo de referência.',
    },
    callout:
      'Cabeça grande, olhos marcantes e teia preta: a leitura do personagem acontece em segundos.',
    footerNote: 'Close first.',
    metrics: [
      { label: 'Enquadramento', value: 'dramático' },
      { label: 'Silhueta', value: 'instantânea' },
      { label: 'Leitura', value: 'objeto heroico' },
    ],
    camera: {
      target: [4.85, -0.26, 1.23],
      position: [-3.24, 1.78, 11.55],
      modelRotation: 0.16,
      modelScale: 1.89,
      modelOffsetX: 0,
      modelOffsetY: 0,
    },
    blocks: [
      block('close-eyebrow-1', 'eyebrow', 'o que é o projeto', 500, 78, 260, 24),
      block(
        'close-body-1',
        'body',
        'Miranha é um laboratório interativo de texto dinâmico trabalhando em harmonia com renderização 3D. A tipografia mede cada segmento disponível e se agarra aos contornos do objeto, realizando uma quebra de linha puramente matemática e reativa.\n\nA sacada principal aqui é a separação das funções. A medição é exata e flui em volta da pelúcia pesada sem gargalos, graças à matriz dinâmica. Você ganha inúmeras colunas esculpidas contra a máscara de tecido sem comprometer o visual.',
        500,
        104,
        260,
        380,
      ),
      block(
        'close-body-2',
        'body',
        'Essa solução reage ao plush vivo e em movimento rápido. A cada quadro, a silhueta real do Miranha dita a área. O motor descarta os pixels preenchidos e o texto flui como água exatamente onde o corpo abre espaço.',
        840,
        78,
        260,
        180,
      ),
      block(
        'close-quote',
        'quote',
        'Macio ao toque.\nPreciso no código.',
        840,
        284,
        260,
        90,
      ),
      block(
        'close-body-3',
        'body',
        'O trackeamento lida com a curvatura complexa da aranha e dos olhos bordados sem bater na malha e sem cortar as palavras abruptamente pela metade.',
        840,
        390,
        260,
        150,
      ),
      block('close-eyebrow-2', 'eyebrow', 'ferramentas-chave', 1180, 78, 260, 24),
      block(
        'close-body-4',
        'body',
        'Três abordagens funcionam em conjunto para levantar essa arquitetura. A rotina central processa a geometria viva.',
        1180,
        104,
        260,
        150,
      ),
      block(
        'close-list',
        'list',
        '• silhueta real — detecta o formato exato da cabeça e do braço do splat 3D\n• fallback inteligente — lida bem com cantos impossíveis, pulando linhas vazias\n• renderização iterativa — gerencia as letras fora da thread do DOM',
        1180,
        210,
        260,
        220,
      ),
    ],
    tags: [],
  },
  {
    id: 'frente-heroica',
    label: 'Frente heroica',
    capsule: '02 / Frente heroica',
    chapter: 'Center view',
    heading: {
      overline: 'frente / equilíbrio / colunas laterais',
      titleLead: 'Pelúcia',
      titleAccent: 'do Miranha',
      deck:
        'A segunda cena deixa o plush centralizado e organiza a leitura dos dois lados.',
      sideNote:
        'É a composição mais parecida com a demo principal do vídeo.',
    },
    callout:
      'A pose frontal faz o Miranha parecer menor, mas mais colecionável e mais claro como objeto central.',
    footerNote: 'Center stage.',
    metrics: [
      { label: 'Pose', value: 'frontal' },
      { label: 'Layout', value: 'colunas' },
      { label: 'Vibe', value: 'demo editorial' },
    ],
    camera: {
      target: [0.16, -0.18, 0.11],
      position: [7.52, 1.71, -3.79],
      modelRotation: 0.02,
      modelScale: 0.7,
      modelOffsetX: 0,
      modelOffsetY: 0,
    },
    blocks: [
      block('front-eyebrow-left', 'eyebrow', 'como essa demo funciona', 460, 90, 320, 24),
      block(
        'front-body-left-top',
        'body',
        'O editor de cena define regiões retangulares onde o texto deve aparecer. Cada retângulo tem uma posição em coordenadas relativas à janela, um tamanho e uma contagem de colunas. O texto flui através desses retângulos em ordem, da esquerda para a direita, de cima para baixo.',
        460,
        120,
        320,
        150,
      ),
      block(
        'front-body-left-bottom',
        'body',
        'Para cada retângulo, o motor de layout o divide em colunas menores, contabilizando o vão obrigatório entre elas. Cada coluna é então preenchida executando o laço de distribuição.',
        460,
        300,
        320,
        150,
      ),
      block(
        'front-body-right-top',
        'body',
        'layoutNextLine atua repetidamente, avançando um cursor compartilhado sobre todas as colunas e todos os retângulos, construindo as frases de forma encadeada.',
        880,
        90,
        400,
        80,
      ),
      block('front-eyebrow-right', 'eyebrow', 'pipeline do layout', 880, 190, 400, 24),
      block(
        'front-list-right',
        'list',
        'Passo — O que acontece\nPreparar — Texto medido de uma vez no Pretext\nOrdenar — Retângulos alinhados na lógica de leitura\nSilhueta — Bordas do splat 3D são sampleadas\nEsculpir — Sistema cria as caixas ao redor do volume\nQuebrar — Linhas matemáticas fluem naquele espaço\nRenderizar — Elementos DOM finalizados na tela',
        880,
        220,
        400,
        180,
      ),
      block(
        'front-eyebrow-right-down',
        'eyebrow',
        'detecção de silhueta',
        960,
        460,
        400,
        24,
      ),
      block(
        'front-body-right-down',
        'body',
        'A cada dois frames, o canvas WebGL é reduzido para um buffer de rascunhos. Uma varredura de pixels compara as cores, busca o contorno sólido e gera intervalos horizontais — a margem esquerda e a margem direita do volume do objeto.\n\nEsses intervalos ganham espaçamento extra e são salvos. Durante o layout da linha, cada posição horizontal é checada contra essa silhueta 3D.',
        960,
        490,
        400,
        200,
      ),
      block(
        'front-quote-bottom-sub',
        'eyebrow',
        'O texto não sabe sobre o objeto 3D. Ele apenas conhece espaço disponível.',
        880,
        740,
        480,
        60,
      ),
    ],
    tags: [],
  },
  {
    id: 'perfil-agil',
    label: 'Perfil ágil',
    capsule: '03 / Perfil ágil',
    chapter: 'Side view',
    heading: {
      overline: 'perfil / movimento / teias / poderes',
      titleLead: 'Pelúcia',
      titleAccent: 'do Miranha',
      deck:
        'Com o modelo de lado, a cena fica mais narrativa e mais parecida com o terceiro quadro do vídeo.',
      sideNote:
        'Aqui o texto acompanha o gesto, em vez de abraçar o plush dos dois lados.',
    },
    callout:
      'Mesmo parado, o plush parece pronto para saltar. Isso vende bem a fantasia do personagem.',
    footerNote: 'Profile motion.',
    metrics: [
      { label: 'Rotação', value: 'perfil' },
      { label: 'Poderes', value: 'teia e escalada' },
      { label: 'Ritmo', value: 'mais técnico' },
    ],
    camera: {
      target: [-0.86, -0.84, 5.83],
      position: [-14.53, 2.46, -4.28],
      modelRotation: -Math.PI / 2.55,
      modelScale: 1.42,
      modelOffsetX: 0,
      modelOffsetY: 0,
    },
    blocks: [
      block('profile-eyebrow-1', 'eyebrow', 'a regra de preenchimento', 560, 90, 680, 24),
      block(
        'profile-body-1',
        'body',
        'Nem todas as colunas são iguais. Uma coluna estreita perto do objeto 3D pode gerar linhas onde as palavras são cortadas pela silhueta. Ler texto onde muitas linhas são curtas é uma péssima experiência.',
        560,
        120,
        680,
        100,
      ),
      block(
        'profile-body-2',
        'body',
        'Após distribuir um parágrafo, a engine verifica qual porcentagem de linhas caiu abaixo do limite de largura. Se muitas linhas passarem desse limite, o parágrafo é recuado e mandado para a próxima coluna.',
        560,
        230,
        680,
        100,
      ),
      block(
        'profile-quote',
        'quote',
        'Um parágrafo que não se ajusta bem, não deve se ajustar.',
        600,
        340,
        640,
        70,
      ),
      block('profile-eyebrow-2', 'eyebrow', 'proteção de cabeçalhos', 640, 430, 600, 24),
      block(
        'profile-body-3',
        'body',
        'Quando um parágrafo é empurrado para a próxima coluna, qualquer título ou cabeçalho logo acima dele deve acompanhá-lo. Um título ilhado no fim de coluna sem conteúdo abaixo é um erro tipográfico.',
        640,
        460,
        600,
        100,
      ),
      block(
        'profile-body-4',
        'body',
        'A engine agrupa e move como unidade.',
        700,
        560,
        540,
        40,
      ),
      block(
        'profile-body-5',
        'body',
        'Isso cria um efeito cascata. Empurrar um parágrafo pode empurrar seu cabeçalho. Tudo é resolvido em um simples loop.',
        700,
        610,
        540,
        100,
      ),
      block('profile-eyebrow-3', 'eyebrow', 'limites mínimos', 700, 710, 540, 24),
      block(
        'profile-list',
        'list',
        'Valor  Efeito\n0%     Sem limites. O texto preenche tudo\n25%    Suave. Rejeita ajustes incertos',
        700,
        740,
        540,
        100,
      ),
    ],
    tags: [],
  },
  {
    id: 'shelf-layout',
    label: 'Shelf layout',
    capsule: '04 / Shelf layout',
    chapter: 'Extended scene',
    heading: {
      overline: 'coleção / lore / configuração / expansão',
      titleLead: 'Pelúcia',
      titleAccent: 'do Miranha',
      deck:
        'A quarta cena abre a composição e deixa o plush menor, quase como uma peça curadora dentro de um painel maior.',
      sideNote:
        'É a ponte ideal para o modo de edição parecer parte natural da mesma experiência.',
    },
    callout:
      'O objeto central pode mudar depois, mas a estrutura continua pronta para Miles, Noir, 2099 ou qualquer outro personagem.',
    footerNote: 'Open system.',
    metrics: [
      { label: 'Escala', value: 'adaptável' },
      { label: 'Lore', value: 'expandido' },
      { label: 'Uso', value: 'portfólio e editor' },
    ],
    camera: {
      target: [3.81, -2.76, 0.15],
      position: [4.64, -1.78, 15.34],
      modelRotation: 0.22,
      modelScale: 0.75,
      modelOffsetX: 0,
      modelOffsetY: 0,
    },
    blocks: [
      block('shelf-eyebrow-1', 'eyebrow', 'pretexto em movimento', 560, 84, 420, 24),
      block(
        'shelf-body-1',
        'body',
        'Rotacionar a pelúcia, afastar a câmera ou aproximar a máscara muda tudo. O parágrafo é recalculado do zero e o texto reage imediatamente, contornando qualquer espaço livre.',
        560,
        120,
        560,
        150,
      ),
      block(
        'shelf-quote-1',
        'quote',
        'Meça uma vez. Expanda sempre que a forma permitir.',
        600,
        340,
        480,
        92,
      ),
      block(
        'shelf-body-2',
        'body',
        'Essa é a diferença real entre uma margem travada e um layout de fato flexível: a malha 3D impõe o limite e ajusta as quebras de linha perfeitamente em tempo real.',
        640,
        490,
        500,
        150,
      ),
      block(
        'shelf-body-3',
        'body',
        'A peça final escapa daquela estética chata de blocos quadrados, criando uma leitura natural que escorrega amigavelmente em volta do aracnídeo na tela do navegador.',
        700,
        670,
        500,
        170,
      ),
    ],
    tags: [],
  },
]

function cloneBlocks(blocks: NarrativeBlockBlueprint[]): NarrativeBlockBlueprint[] {
  return blocks.map(block => ({ ...block }))
}

function cloneTags(tags: OrbitTagBlueprint[]): OrbitTagBlueprint[] {
  return tags.map(currentTag => ({ ...currentTag }))
}

export function cloneScenes(): MiranhaSceneBlueprint[] {
  return MIRANHA_SCENES.map(scene => ({
    ...scene,
    heading: { ...scene.heading },
    metrics: scene.metrics.map(metric => ({ ...metric })),
    camera: { ...scene.camera },
    blocks: cloneBlocks(scene.blocks),
    tags: cloneTags(scene.tags),
  }))
}
