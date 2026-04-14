export type StoryBlockType = 'eyebrow' | 'body' | 'quote' | 'list'

export type StoryBlock = {
  id: string
  type: StoryBlockType
  text: string
  x: number
  y: number
  width: number
  height: number
}

export type StoryScenePreset = {
  id: string
  label: string
  blocks: StoryBlock[]
}

function block(
  id: string,
  type: StoryBlockType,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
): StoryBlock {
  return { id, type, text, x, y, width, height }
}

function cloneBlock(blockData: StoryBlock): StoryBlock {
  return { ...blockData }
}

export function cloneBlocks(blocks: StoryBlock[]): StoryBlock[] {
  return blocks.map(cloneBlock)
}

export const STORY_SCENES: StoryScenePreset[] = [
  {
    id: 'flow-overview',
    label: 'How This Demo Works',
    blocks: [
      block(
        'scene1-eyebrow-1',
        'eyebrow',
        'How This Demo Works',
        558,
        76,
        320,
        24,
      ),
      block(
        'scene1-body-1',
        'body',
        'Each text region behaves like a live layout surface. Pretext measures the paragraph once, then asks for one line at a time while the Spider-Man silhouette keeps changing in front of it.',
        558,
        112,
        360,
        220,
      ),
      block(
        'scene1-quote-1',
        'quote',
        'Every row checks the free lane again before committing the next line.',
        1018,
        92,
        500,
        96,
      ),
      block(
        'scene1-body-2',
        'body',
        'The renderer samples the contour from the WebGL canvas, collapses it into a tight blocked interval, and lets the paragraph use whatever horizontal span is actually free on that band.',
        1112,
        268,
        620,
        220,
      ),
      block(
        'scene1-body-3',
        'body',
        'That means lower rows can immediately widen when the body narrows, instead of inheriting a skinny width from the lines above.',
        1184,
        516,
        540,
        170,
      ),
    ],
  },
  {
    id: 'wider-rows',
    label: 'Wider Rows Win',
    blocks: [
      block(
        'scene2-eyebrow-1',
        'eyebrow',
        'Why The Flow Feels Better',
        622,
        86,
        340,
        24,
      ),
      block(
        'scene2-body-1',
        'body',
        'Narrow rows are no longer treated as a column that must continue forever. When a band is too tight to be readable, the layout can wait for the next wider lane instead of locking the paragraph into a cramped gutter.',
        622,
        122,
        364,
        240,
      ),
      block(
        'scene2-quote-1',
        'quote',
        'Every line should breathe if the geometry allows it.',
        1104,
        108,
        430,
        90,
      ),
      block(
        'scene2-body-2',
        'body',
        'This preserves longer words, reduces brittle breaks, and keeps the reading rhythm from collapsing into a narrow stack beside the character.',
        1158,
        270,
        540,
        190,
      ),
      block(
        'scene2-body-3',
        'body',
        'The biggest visual gain is simple: upper rows can stay compact while lower rows expand the moment the silhouette leaves more room.',
        1228,
        506,
        470,
        170,
      ),
    ],
  },
  {
    id: 'editor-mode',
    label: 'Scene Editor',
    blocks: [
      block(
        'scene3-eyebrow-1',
        'eyebrow',
        'Scene Editor',
        560,
        84,
        290,
        24,
      ),
      block(
        'scene3-body-1',
        'body',
        'Edit mode exposes draggable text regions so you can reposition the story. Each block still wraps around the Spider-Man contour, but now the scene can be art directed without falling back to DOM text measurement.',
        560,
        120,
        372,
        240,
      ),
      block(
        'scene3-quote-1',
        'quote',
        'Editing changes the stage. Pretext rewrites the performance.',
        1042,
        110,
        470,
        96,
      ),
      block(
        'scene3-body-2',
        'body',
        'Pull a region outward and the paragraph relaxes into longer lines. Push it closer to the mesh and the same copy tightens, but only where the silhouette truly blocks the lane.',
        1114,
        288,
        570,
        210,
      ),
      block(
        'scene3-body-3',
        'body',
        'That makes the editor useful for previews, exports, and experiments where the layout needs to stay faithful to the scene while still feeling designed.',
        1188,
        522,
        500,
        170,
      ),
    ],
  },
  {
    id: 'pretext-motion',
    label: 'Pretext In Motion',
    blocks: [
      block(
        'scene4-eyebrow-1',
        'eyebrow',
        'Pretext In Motion',
        574,
        84,
        320,
        24,
      ),
      block(
        'scene4-body-1',
        'body',
        'Rotate the plush, slide the camera, or zoom toward the mask. The paragraph is laid out again from the beginning, so later rows can immediately use any width opened by the changing contour.',
        574,
        120,
        360,
        230,
      ),
      block(
        'scene4-quote-1',
        'quote',
        'Measure once. Expand whenever the shape lets go.',
        1060,
        102,
        480,
        92,
      ),
      block(
        'scene4-body-2',
        'body',
        'That is the difference between a rigid text column and a responsive contour layout: geometry changes the lane, and the lane changes the line breaks in real time.',
        1124,
        280,
        570,
        210,
      ),
      block(
        'scene4-body-3',
        'body',
        'The result feels much closer to the reference editor because the copy wraps around the Spider-Man silhouette instead of simply sinking down one narrow side track.',
        1198,
        520,
        500,
        170,
      ),
    ],
  },
]

export const STORY_BLOCKS: StoryBlock[] = cloneBlocks(STORY_SCENES[0].blocks)
