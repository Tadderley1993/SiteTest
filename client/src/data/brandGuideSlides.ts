export interface Slide {
  number: string
  tag: string
  headline: string
  subheadline: string
  body: string[]
  bullets?: { icon: string; text: string }[]
  twoCol?: { left: { label: string; items: string[] }; right: { label: string; items: string[] } }
  callout: string | null
  isFinal?: boolean
}

export const SLIDES: Slide[] = [
  {
    number: '01',
    tag: 'Welcome',
    headline: "Hi, I'm Terrence Adderley.",
    subheadline: 'Founder of Designs By Terrence Adderley — DBTA',
    body: [
      "If you're here, it means you're serious about building something meaningful — whether that's a business, a brand, or a new digital presence.",
      'This guide is my way of walking you through how branding actually works, why design impacts your business more than you think, and how we can turn your vision into something real — and profitable.',
    ],
    callout: "You don't need to know everything. That's my job. Your job is to dream big — I'll help you shape it.",
  },
  {
    number: '02',
    tag: 'Branding',
    headline: 'What Branding Really Is',
    subheadline: "Let me clear something up right away:",
    body: [
      'Branding is not just a logo.',
      "When I think about branding for my clients, I think about how people feel when they see your business — the impression you leave in seconds, and the trust you build without saying a word.",
    ],
    callout: 'Your brand is your first impression, your reputation, and your identity — all in one.',
  },
  {
    number: '03',
    tag: 'Brand System',
    headline: 'What Makes a Strong Brand',
    subheadline: 'When I work with clients at DBTA, I focus on building a complete system:',
    body: [],
    bullets: [
      { icon: '◈', text: 'Your logo — your identity' },
      { icon: '◈', text: 'Your colors — your emotional language' },
      { icon: '◈', text: 'Your typography — your voice, visually' },
      { icon: '◈', text: 'Your messaging — how you communicate' },
      { icon: '◈', text: 'Your overall style — how everything feels together' },
    ],
    callout: 'When all of these align, your business feels intentional and trustworthy.',
  },
  {
    number: '04',
    tag: 'First Impressions',
    headline: 'First Impressions',
    subheadline: "Here's something I always tell my clients:",
    body: [
      'People decide how they feel about your business in seconds.',
      "Before they read anything… before they understand what you do… they've already made a judgment.",
    ],
    callout: "That's why I focus heavily on visual impact early — because that's what keeps people from leaving.",
  },
  {
    number: '05',
    tag: 'Color Strategy',
    headline: 'How I Use Color Strategically',
    subheadline: "Color is one of the most powerful tools I use. It's not random — it's intentional.",
    body: [],
    bullets: [
      { icon: '◈', text: 'Blue → builds trust — ideal for professional brands' },
      { icon: '◈', text: 'Black → creates a premium, luxury feel' },
      { icon: '◈', text: 'Red → creates urgency and energy' },
      { icon: '◈', text: 'Green → signals growth and balance' },
    ],
    callout: '"What should your audience feel the moment they land on your site?"',
  },
  {
    number: '06',
    tag: 'Logo',
    headline: 'Your Logo — One Symbol, One Impression',
    subheadline: 'Your logo is often the first thing people remember about you.',
    body: ['When I design or evaluate a logo, I ask:'],
    bullets: [
      { icon: '◈', text: 'Is it simple?' },
      { icon: '◈', text: 'Is it memorable?' },
      { icon: '◈', text: 'Does it reflect your brand personality?' },
    ],
    callout: "A strong logo doesn't just look good — it sticks.",
  },
  {
    number: '07',
    tag: 'Perception',
    headline: 'What Your Business Looks Like Matters',
    subheadline: "People don't separate design from quality.",
    body: [],
    bullets: [
      { icon: '◈', text: "Clean design → they assume you're professional" },
      { icon: '◈', text: "Modern design → they assume you're current" },
      { icon: '◈', text: "Premium design → they assume you're worth more" },
    ],
    callout: "Whether it's fair or not — your design becomes your reputation.",
  },
  {
    number: '08',
    tag: 'Web Design',
    headline: 'What Web Design Means to Me',
    subheadline: "When I design a website, I'm not just making something look good.",
    body: ["I'm thinking:"],
    bullets: [
      { icon: '◈', text: 'How do we guide your visitors?' },
      { icon: '◈', text: 'How do we build trust quickly?' },
      { icon: '◈', text: 'How do we turn visitors into customers?' },
    ],
    callout: 'Every decision I make is based on strategy, not just aesthetics.',
  },
  {
    number: '09',
    tag: 'Website Structure',
    headline: 'How I Structure Your Website',
    subheadline: 'Every high-performing website I create follows a flow:',
    body: [],
    bullets: [
      { icon: '01', text: 'Grab attention immediately' },
      { icon: '02', text: 'Build trust quickly' },
      { icon: '03', text: 'Show value clearly' },
      { icon: '04', text: 'Guide users to take action' },
    ],
    callout: "This is what turns a website into a sales tool — not just a digital brochure.",
  },
  {
    number: '10',
    tag: 'CTAs',
    headline: 'Why I Focus on Call-To-Actions',
    subheadline: "If your website doesn't guide users, they leave.",
    body: ["That's why I strategically place buttons like:"],
    bullets: [
      { icon: '→', text: '"Book a Call"' },
      { icon: '→', text: '"Get Started"' },
      { icon: '→', text: '"View Services"' },
    ],
    callout: 'I\'m always asking: "What is the next step we want your visitor to take?"',
  },
  {
    number: '11',
    tag: 'Results',
    headline: 'Why Structure Impacts Results',
    subheadline: "I've seen this time and time again:",
    body: ['When a website is clear and easy to follow:'],
    bullets: [
      { icon: '◈', text: 'People stay longer' },
      { icon: '◈', text: 'People trust more' },
      { icon: '◈', text: 'People take action' },
    ],
    callout: "Good structure isn't just design — it directly impacts your results.",
  },
  {
    number: '12',
    tag: 'Mobile',
    headline: 'Mobile Design — A Non-Negotiable',
    subheadline: 'Most people will visit your website on their phone.',
    body: ['So when I design your site, I make sure:'],
    bullets: [
      { icon: '◈', text: 'It looks clean on mobile' },
      { icon: '◈', text: "It's easy to navigate" },
      { icon: '◈', text: 'It loads quickly' },
    ],
    callout: "If your mobile experience is bad, you're losing customers — simple as that.",
  },
  {
    number: '13',
    tag: 'Mistakes',
    headline: 'Mistakes I Help You Avoid',
    subheadline: 'A lot of clients come to me after struggling with things like:',
    body: [],
    bullets: [
      { icon: '✕', text: 'A confusing website' },
      { icon: '✕', text: 'Weak branding' },
      { icon: '✕', text: 'Too many design styles mixed together' },
      { icon: '✕', text: 'No clear direction' },
    ],
    callout: 'My job is to simplify everything and give your brand clarity and focus.',
  },
  {
    number: '14',
    tag: 'SEO',
    headline: 'SEO — Helping People Find You',
    subheadline: "A great website means nothing if people can't find it. That's where SEO comes in.",
    body: ['I help structure your site so:'],
    bullets: [
      { icon: '◈', text: 'Search engines understand it' },
      { icon: '◈', text: 'Your audience can find you' },
      { icon: '◈', text: 'You can grow consistently over time' },
    ],
    callout: null,
  },
  {
    number: '15',
    tag: 'Impact',
    headline: 'How Design Impacts Your Business',
    subheadline: 'This is something I want you to remember:',
    body: ['Design directly affects:'],
    bullets: [
      { icon: '◈', text: 'Trust' },
      { icon: '◈', text: 'Engagement' },
      { icon: '◈', text: 'Conversions' },
    ],
    callout: 'When your brand looks right, people feel more confident choosing you.',
  },
  {
    number: '16',
    tag: 'Insight',
    headline: "What I've Learned Working With Clients",
    subheadline: "One thing I've learned:",
    body: [
      "Most clients don't struggle because their idea is bad…",
      "They struggle because their presentation doesn't match their potential.",
    ],
    callout: "That's where I come in.",
  },
  {
    number: '17',
    tag: 'My Focus',
    headline: 'What I Focus on at DBTA',
    subheadline: 'When you work with me, I focus on:',
    body: [],
    bullets: [
      { icon: '◈', text: 'Clarity over confusion' },
      { icon: '◈', text: 'Strategy over guesswork' },
      { icon: '◈', text: 'Consistency over randomness' },
      { icon: '◈', text: 'Experience over just visuals' },
    ],
    callout: "I don't just design — I help you position your business properly.",
  },
  {
    number: '18',
    tag: 'Collaboration',
    headline: 'How I Work With You',
    subheadline: 'This is a collaboration.',
    body: [],
    twoCol: {
      left: { label: 'You bring:', items: ['Your vision', 'Your ideas', 'Your goals'] },
      right: { label: 'I bring:', items: ['Strategy', 'Design expertise', 'Structure'] },
    },
    callout: 'Together, we build something that works.',
  },
  {
    number: '19',
    tag: 'Reflection',
    headline: 'Questions I Want You Thinking About',
    subheadline: 'As you go through this process, think about:',
    body: [],
    bullets: [
      { icon: '?', text: 'What do I want people to feel when they see my brand?' },
      { icon: '?', text: 'What action do I want them to take?' },
      { icon: '?', text: "Does my current presence reflect my true potential?" },
    ],
    callout: null,
  },
  {
    number: '20',
    tag: 'Final Thoughts',
    headline: 'Final Thoughts From Me',
    subheadline: "I'll leave you with this:",
    body: [
      "People don't always choose the best business…",
      'They choose the one that feels right.',
    ],
    bullets: [
      { icon: '◈', text: 'Trustworthy' },
      { icon: '◈', text: 'Professional' },
      { icon: '◈', text: 'Memorable' },
    ],
    callout: "And most importantly… worth choosing.\n\n— Terrence Adderley\nDesigns By Terrence Adderley",
    isFinal: true,
  },
]

export const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
}
