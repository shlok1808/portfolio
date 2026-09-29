export type Cat = 'background' | 'episode' | 'abstract' | 'explorable' | 'concept'
export type Paper = 'lbys' | 'audit' | 'kyc'

export interface LabOption {
  n: number
  slug: string
  cat: Cat
  name: string
  blurb: string
  paper?: Paper
  /** backgrounds: what happens to the horizon photo */
  sky?: 'photo' | 'dim' | 'none'
  /** backgrounds: scrolls away with the header, or stays fixed behind the whole page */
  layer?: 'hero' | 'fixed'
  /** fixed backgrounds: opacity once you've scrolled into the text (1 = no dimming) */
  rest?: number
  tech: string
}

export const CATS: Record<Cat, { label: string; range: string; note: string }> = {
  background: {
    label: 'Backgrounds',
    range: '01–10 · 24',
    note: 'Ambient layers behind the real page. Most are tied to your research or your astrophotography.',
  },
  episode: {
    label: 'Research episodes',
    range: '11–13',
    note: 'Saturday-morning-TV explainers with the real technical terms. Play, pause, scrub, jump by chapter.',
  },
  abstract: {
    label: 'One-image summaries',
    range: '14–16',
    note: 'Each paper as a single figure that assembles itself. Doubles as the preview image.',
  },
  explorable: {
    label: 'Explorables',
    range: '17–19',
    note: 'Hands-on toys: readers poke the idea until it clicks.',
  },
  concept: {
    label: 'Full-site concepts',
    range: '20–23',
    note: 'Whole-page directions that combine the pieces above.',
  },
}

export const OPTIONS: LabOption[] = [
  {
    n: 1,
    slug: 'living-horizon',
    cat: 'background',
    name: 'Living Horizon',
    blurb:
      'Your wallpaper, alive. Stars come out in the dark sky, a satellite slips into Earth’s shadow, meteors streak past, and the night side gets city lights and thunderstorm flashes, as seen from the ISS.',
    sky: 'photo',
    layer: 'hero',
    tech: 'Canvas 2D · aligned to the measured limb of your photo',
  },
  {
    n: 2,
    slug: 'star-trails',
    cat: 'background',
    name: 'Star Trails',
    blurb:
      'A long exposure that runs while people read. Trails lengthen around Polaris the longer they stay, and a camera readout ticks in the corner.',
    sky: 'dim',
    layer: 'hero',
    tech: 'Canvas 2D · analytic arcs, no accumulation buffer',
  },
  {
    n: 3,
    slug: 'aurora',
    cat: 'background',
    name: 'Aurora from Orbit',
    blurb: 'Green-to-violet curtains rising off the planet’s limb, the way astronauts see them from the ISS.',
    sky: 'dim',
    layer: 'hero',
    tech: 'WebGL fragment shader following the photo’s limb',
  },
  {
    n: 4,
    slug: 'constellation',
    cat: 'background',
    name: 'Feature Constellation',
    blurb:
      'An SAE feature atlas as a planetarium. Every star is a feature’s decoder direction, families of related features form labelled constellations, and hovering a star opens its dashboard: explanation, activation density, top activating examples, promoted and suppressed logits, nearest neighbour.',
    sky: 'none',
    layer: 'fixed',
    rest: 0.85,
    tech: 'Canvas 2D · 3-D point cloud, k-NN by cosine',
  },
  {
    n: 5,
    slug: 'residual-stream',
    cat: 'background',
    name: 'Residual Stream',
    blurb:
      'Each line is one token of your About text flowing through 42 layers. Attention arcs move information between positions, and the right margin shows each position’s next-token prediction.',
    sky: 'none',
    layer: 'fixed',
    rest: 0.8,
    tech: 'Canvas 2D · noise-driven streamlines',
  },
  {
    n: 6,
    slug: 'loss-landscape',
    cat: 'background',
    name: 'Loss Landscape',
    blurb:
      'A topographic map of a slowly shifting loss surface, with Adam and SGD finding their way downhill. Pure line art, so it also works in light mode.',
    sky: 'none',
    layer: 'fixed',
    rest: 0.85,
    tech: 'Canvas 2D · marching squares + real Adam updates',
  },
  {
    n: 7,
    slug: 'logit-lens',
    cat: 'background',
    name: 'Logit Lens',
    blurb:
      'Laid out like a real logit-lens plot: columns are layers L0 → L27, rows are tokens. Early layers read out multilingual junk and late layers settle into English, and a tuned lens follows your cursor.',
    sky: 'none',
    layer: 'fixed',
    rest: 0.8,
    tech: 'Canvas 2D · incremental glyph grid',
  },
  {
    n: 8,
    slug: 'dither-sky',
    cat: 'background',
    name: 'Dither Horizon',
    blurb:
      'Your horizon photo re-rendered live through an 8×8 Bayer dither, with drifting cloud and a cursor that lights it up. Recolors with the palette switcher.',
    sky: 'none',
    layer: 'hero',
    tech: 'WebGL · ordered dithering at native pixel scale',
  },
  {
    n: 9,
    slug: 'superposition',
    cat: 'background',
    name: 'Superposition',
    blurb:
      'Toy Models of Superposition as floating line art. Features pack into digons, triangles, pentagons and tetrahedra, and the big diagram re-packs itself as sparsity rises.',
    sky: 'none',
    layer: 'fixed',
    rest: 0.9,
    tech: 'Canvas 2D · 3-D wireframes',
  },
  {
    n: 10,
    slug: 'nebula',
    cat: 'background',
    name: 'Orion',
    blurb:
      'A shader nebula tinted from your own Orion Nebula photo: hydrogen-alpha reds, reflection blues and dark dust lanes, with parallax stars.',
    sky: 'none',
    layer: 'fixed',
    rest: 0.55,
    tech: 'WebGL domain-warped fBm + Canvas 2D stars',
  },
  {
    n: 24,
    slug: 'activations',
    cat: 'background',
    name: 'Activations',
    blurb:
      'Feature activations on real text, the way SAE feature dashboards show them. One feature fires at a time and its tokens light up in orange, sweeping like a forward pass. Hover any token to read its activation. Same feature families as the constellation.',
    sky: 'none',
    layer: 'fixed',
    rest: 0.85,
    tech: 'Canvas 2D · token highlighting, reading lane',
  },
  {
    n: 11,
    slug: 'episode-steer',
    cat: 'episode',
    paper: 'lbys',
    name: 'Ep. 1 · Look Before You Steer',
    blurb:
      'SAEs, steering, α*, neighbor density, co-recruitment and the results, with the paper’s terms in the captions and cartoon features who get pushed around.',
    tech: 'Canvas scene graph · scrubbable timeline',
  },
  {
    n: 12,
    slug: 'episode-audit',
    cat: 'episode',
    paper: 'audit',
    name: 'Ep. 2 · The Probe That Read the Labels',
    blurb:
      'The ConfAIde audit as a detective story: the 0.89 probe, the 28-of-30 twist, what survives (+0.16 over text), and the controls that tried to break it.',
    tech: 'Canvas scene graph · scrubbable timeline',
  },
  {
    n: 13,
    slug: 'episode-kyc',
    cat: 'episode',
    paper: 'kyc',
    name: 'Ep. 3 · Does the Advisor Know?',
    blurb:
      'Mechanistic KYC: clients on a willingness × capacity grid, implicit twins with no risk words, a frozen Gemma-2-9B advisor, and probes that look inside.',
    tech: 'Canvas scene graph · scrubbable timeline',
  },
  {
    n: 14,
    slug: 'figure-steer',
    cat: 'abstract',
    paper: 'lbys',
    name: 'Summary figure · Look Before You Steer',
    blurb: 'Geometry → steering → correlation, with the headline numbers, drawn in when it scrolls into view.',
    tech: 'SVG + GSAP DrawSVG',
  },
  {
    n: 15,
    slug: 'figure-audit',
    cat: 'abstract',
    paper: 'audit',
    name: 'Summary figure · Probe audit',
    blurb: 'Claim → audit → what survives. One figure a reviewer could read in ten seconds.',
    tech: 'SVG + GSAP DrawSVG',
  },
  {
    n: 16,
    slug: 'figure-kyc',
    cat: 'abstract',
    paper: 'kyc',
    name: 'Summary figure · Mechanistic KYC',
    blurb: 'Clients → advisor → inside the model, with the three research questions underneath.',
    tech: 'SVG + GSAP DrawSVG',
  },
  {
    n: 17,
    slug: 'play-steer',
    cat: 'explorable',
    paper: 'lbys',
    name: 'Explorable · Steer a feature',
    blurb:
      'Pick a feature in a toy decoder space, turn the α knob, and watch its dose-response curve cross the threshold, then see where it lands on the density-vs-α* trend.',
    tech: 'Canvas + DOM controls · toy model, labeled as such',
  },
  {
    n: 18,
    slug: 'play-audit',
    cat: 'explorable',
    paper: 'audit',
    name: 'Explorable · Be the auditor',
    blurb:
      'Re-annotate the 30 “refused” cases yourself, then switch the text baseline on and off to see what the privileged increment Δ really means.',
    tech: 'DOM + SVG · paper numbers only',
  },
  {
    n: 19,
    slug: 'play-kyc',
    cat: 'explorable',
    paper: 'kyc',
    name: 'Explorable · Build a client',
    blurb:
      'Drag a client around the willingness × capacity grid, read the explicit card next to its implicit twin, and flip one field to make a counterfactual pair.',
    tech: 'DOM + SVG · illustrates the method, no results',
  },
  {
    n: 20,
    slug: 'observatory',
    cat: 'concept',
    name: 'Concept · Observatory',
    blurb:
      'The whole site as a night sky: the feature atlas behind everything, and each paper drawn as its own constellation. Click one to observe it: its episode opens in a telescope view.',
    tech: 'Canvas 2D + episode player',
  },
  {
    n: 21,
    slug: 'forward-pass',
    cat: 'concept',
    name: 'Concept · Forward Pass',
    blurb:
      'Scrolling is a forward pass. A token rides the residual stream from embed to unembed, each paper’s episode is scrubbed by your scroll, and the contact section is the logits.',
    tech: 'Scroll-driven · reuses the episode renderers',
  },
  {
    n: 22,
    slug: 'channel-shlok',
    cat: 'concept',
    name: 'Concept · Channel Shlok',
    blurb:
      'A retro CRT television on the page with three channels and three episodes, static between them, and a remote that works with your keyboard.',
    tech: 'CSS/SVG TV + canvas static + CRT post-processing',
  },
  {
    n: 23,
    slug: 'field-notes',
    cat: 'concept',
    name: 'Concept · Field Notes',
    blurb:
      'A researcher’s notebook in light mode. Hand-drawn figures sketch themselves as you scroll, with handwritten notes in the margin.',
    tech: 'SVG with hand-drawn strokes + GSAP ScrollTrigger',
  },
]

export const bySlug = (slug: string) => OPTIONS.find((o) => o.slug === slug)
export const byNumber = (n: number) => OPTIONS.find((o) => o.n === n)
export const pad = (n: number) => String(n).padStart(2, '0')
