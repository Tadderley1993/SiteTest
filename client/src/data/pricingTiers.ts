export interface PackageLineItem {
  serviceId: string
  label: string
  description: string
  qty: number
  unitPrice: number
  amount: number
  bonus?: boolean       // true = bundle bonus (shown as FREE, $0 in proposal)
  included?: boolean    // true = "included" in price, no separate line
}

export interface PricingTier {
  id: 'foundation' | 'growth' | 'authority' | 'signature' | 'custom'
  name: string
  emoji: string
  tagline: string
  price: number           // 0 for signature (custom quote)
  priceLabel: string      // e.g. "$4,500" or "Starting at $18,000+"
  valueLabel: string      // e.g. "Value: $5,800+"
  popular?: boolean
  cta: string             // button label
  highlights: string[]
  lineItems: PackageLineItem[]
  bonuses: { label: string; value: string }[]
  isCustomContact?: boolean  // Signature tier — opens message instead of package flow
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'foundation',
    name: 'The Foundation Experience',
    emoji: '🟢',
    tagline: 'For businesses getting established the right way.',
    price: 4500,
    priceLabel: '$4,500',
    valueLabel: 'Value: $5,800+',
    cta: 'Select Foundation',
    highlights: [
      'Base website setup',
      '4 core pages (Home, About, Services, Contact)',
      'Basic SEO setup',
      'Mobile optimization',
      'Contact form',
      'Basic UI design',
    ],
    lineItems: [
      { serviceId: 'base_website', label: 'Base Website Setup', description: 'Full project setup, hosting config, and deployment', qty: 1, unitPrice: 2500, amount: 2500 },
      { serviceId: 'core_pages', label: '4 Core Pages', description: 'Home, About, Services, Contact — fully designed and built', qty: 1, unitPrice: 2000, amount: 2000 },
      { serviceId: 'seo_basic', label: 'Basic SEO Setup', description: 'Meta tags, sitemap, Google Search Console', qty: 1, unitPrice: 500, amount: 500 },
      { serviceId: 'mobile_opt', label: 'Mobile Optimization', description: 'Fully responsive across all screen sizes', qty: 1, unitPrice: 0, amount: 0, included: true },
      { serviceId: 'contact_form', label: 'Contact Form', description: 'Email-connected inquiry form', qty: 1, unitPrice: 150, amount: 150 },
      { serviceId: 'basic_ui', label: 'Basic UI Design', description: 'Clean, modern interface aligned with your brand', qty: 1, unitPrice: 800, amount: 800 },
    ],
    bonuses: [
      { label: 'Speed Optimization', value: '$300 value' },
      { label: 'Launch Support', value: '$200 value' },
    ],
  },
  {
    id: 'growth',
    name: 'The Growth Experience',
    emoji: '🔵',
    tagline: 'For businesses ready to grow and convert.',
    price: 7500,
    priceLabel: '$7,500',
    valueLabel: 'Value: $10,000+',
    popular: true,
    cta: 'Select Growth',
    highlights: [
      'Everything in Foundation',
      '3 additional pages',
      'Custom UI/UX design',
      'Conversion strategy (CTAs + funnel structure)',
      'Blog / CMS setup',
      'Advanced SEO optimization',
      'Analytics integration',
    ],
    lineItems: [
      { serviceId: 'base_website', label: 'Base Website Setup', description: 'Full project setup, hosting config, and deployment', qty: 1, unitPrice: 2500, amount: 2500 },
      { serviceId: 'core_pages', label: '4 Core Pages', description: 'Home, About, Services, Contact', qty: 1, unitPrice: 2000, amount: 2000 },
      { serviceId: 'seo_basic', label: 'Basic SEO Setup', description: 'Meta tags, sitemap, Google Search Console', qty: 1, unitPrice: 500, amount: 500 },
      { serviceId: 'mobile_opt', label: 'Mobile Optimization', description: 'Fully responsive across all screen sizes', qty: 1, unitPrice: 0, amount: 0, included: true },
      { serviceId: 'contact_form', label: 'Contact Form', description: 'Email-connected inquiry form', qty: 1, unitPrice: 150, amount: 150 },
      { serviceId: 'additional_pages', label: '3 Additional Pages', description: 'Custom-designed pages beyond the core 4', qty: 3, unitPrice: 300, amount: 900 },
      { serviceId: 'custom_ui', label: 'Custom UI/UX Design', description: 'Fully bespoke interface tailored to your brand', qty: 1, unitPrice: 1000, amount: 1000 },
      { serviceId: 'conversion', label: 'Conversion Strategy', description: 'CTA placement, funnel structure, and user flow optimization', qty: 1, unitPrice: 800, amount: 800 },
      { serviceId: 'cms', label: 'Blog / CMS Setup', description: 'Content management system so you can update your own content', qty: 1, unitPrice: 600, amount: 600 },
      { serviceId: 'seo_adv', label: 'Advanced SEO Optimization', description: 'On-page SEO, keyword targeting, and performance tuning', qty: 1, unitPrice: 1000, amount: 1000 },
      { serviceId: 'analytics', label: 'Analytics Integration', description: 'Google Analytics 4 + Search Console setup', qty: 1, unitPrice: 300, amount: 300 },
    ],
    bonuses: [
      { label: 'Keyword Strategy', value: '$500 value' },
      { label: '1 Month Maintenance', value: '$200 value' },
    ],
  },
  {
    id: 'authority',
    name: 'The Authority Experience',
    emoji: '🔴',
    tagline: 'For brands that want to stand out and dominate.',
    price: 12000,
    priceLabel: '$12,000',
    valueLabel: 'Value: $16,000+',
    cta: 'Select Authority',
    highlights: [
      'Everything in Growth',
      '5–10 additional pages',
      'Full brand identity',
      'Advanced animations & interactions',
      'Copywriting guidance',
      'Sales funnel structuring',
      'Performance optimization',
    ],
    lineItems: [
      { serviceId: 'base_website', label: 'Base Website Setup', description: 'Full project setup, hosting config, and deployment', qty: 1, unitPrice: 2500, amount: 2500 },
      { serviceId: 'core_pages', label: '4 Core Pages', description: 'Home, About, Services, Contact', qty: 1, unitPrice: 2000, amount: 2000 },
      { serviceId: 'mobile_opt', label: 'Mobile Optimization', description: 'Fully responsive across all screen sizes', qty: 1, unitPrice: 0, amount: 0, included: true },
      { serviceId: 'contact_form', label: 'Contact Form', description: 'Email-connected inquiry form', qty: 1, unitPrice: 0, amount: 0, included: true },
      { serviceId: 'custom_ui', label: 'Custom UI/UX Design', description: 'Fully bespoke interface tailored to your brand', qty: 1, unitPrice: 1000, amount: 1000 },
      { serviceId: 'conversion', label: 'Conversion Strategy', description: 'CTA placement, funnel structure, and user flow', qty: 1, unitPrice: 800, amount: 800 },
      { serviceId: 'cms', label: 'Blog / CMS Setup', description: 'Content management system', qty: 1, unitPrice: 600, amount: 600 },
      { serviceId: 'seo_adv', label: 'Advanced SEO Optimization', description: 'On-page SEO, keyword targeting, and performance', qty: 1, unitPrice: 1000, amount: 1000 },
      { serviceId: 'analytics', label: 'Analytics Integration', description: 'Google Analytics 4 + Search Console', qty: 1, unitPrice: 300, amount: 300 },
      { serviceId: 'extra_pages', label: '5–10 Additional Pages', description: 'Full site build with all required pages', qty: 1, unitPrice: 2000, amount: 2000 },
      { serviceId: 'brand_identity', label: 'Full Brand Identity', description: 'Logo, colors, typography, and brand style guide', qty: 1, unitPrice: 2500, amount: 2500 },
      { serviceId: 'animations', label: 'Advanced Animations & Interactions', description: 'Scroll effects, micro-interactions, custom transitions', qty: 1, unitPrice: 1500, amount: 1500 },
      { serviceId: 'copywriting_guidance', label: 'Copywriting Guidance', description: 'Strategic review and direction of all website copy', qty: 1, unitPrice: 800, amount: 800 },
      { serviceId: 'funnel', label: 'Sales Funnel Structuring', description: 'End-to-end conversion path design', qty: 1, unitPrice: 1200, amount: 1200 },
      { serviceId: 'perf_opt', label: 'Performance Optimization', description: 'Speed, Core Web Vitals, and load time tuning', qty: 1, unitPrice: 500, amount: 500 },
    ],
    bonuses: [
      { label: 'Marketing Starter Kit', value: '$1,000 value' },
      { label: '2 Months Maintenance', value: '$400 value' },
    ],
  },
  {
    id: 'signature',
    name: 'The Signature Experience',
    emoji: '⚫',
    tagline: 'For serious brands, startups, or custom platforms.',
    price: 0,
    priceLabel: 'Starting at $18,000+',
    valueLabel: 'Value: $25,000+',
    cta: "Let's Talk",
    isCustomContact: true,
    highlights: [
      'Everything in Authority',
      'Web app / custom features',
      'Advanced integrations',
      'Full brand strategy',
      'Premium UX/UI systems',
      'Ongoing strategy consulting',
    ],
    lineItems: [],
    bonuses: [
      { label: '3 Months Maintenance', value: '$900 value' },
      { label: 'Priority Support', value: '$600 value' },
    ],
  },
]

// À La Carte catalog — shown after tier cards
export interface AlaCarteItem {
  id: string
  category: string
  label: string
  description: string
  price: number
  priceLabel: string
}

export const ALA_CARTE: AlaCarteItem[] = [
  // Website & Pages
  { id: 'base_website', category: 'Website & Pages', label: 'Base Website Setup', description: 'Project setup, hosting config, deployment', price: 2500, priceLabel: '$2,500' },
  { id: 'home_page', category: 'Website & Pages', label: 'Home Page', description: 'Full custom homepage design & build', price: 800, priceLabel: '$800' },
  { id: 'standard_page', category: 'Website & Pages', label: 'Standard Page', description: 'Any additional page (About, Services, etc.)', price: 400, priceLabel: '$300–$500' },
  // Design
  { id: 'custom_ui', category: 'Design', label: 'Custom UI Design', description: 'Bespoke interface design', price: 1000, priceLabel: '$1,000' },
  { id: 'advanced_design', category: 'Design', label: 'Advanced Design', description: 'Complex layouts, custom components', price: 1500, priceLabel: '$1,500' },
  // Branding
  { id: 'logo', category: 'Branding', label: 'Logo', description: '2 concepts + 1 revision round', price: 800, priceLabel: '$800' },
  { id: 'brand_identity', category: 'Branding', label: 'Brand Identity', description: 'Logo, colors, typography, style guide', price: 2500, priceLabel: '$2,500' },
  { id: 'brand_strategy', category: 'Branding', label: 'Full Brand Strategy', description: 'Positioning, messaging, and voice', price: 2000, priceLabel: '$2,000' },
  // Features
  { id: 'booking', category: 'Features', label: 'Booking System', description: 'Calendar scheduling integration', price: 700, priceLabel: '$700' },
  { id: 'payment_integration', category: 'Features', label: 'Payment Integration', description: 'Stripe or similar checkout', price: 500, priceLabel: '$500' },
  { id: 'ecommerce', category: 'Features', label: 'E-Commerce', description: 'Product catalog, cart, and checkout', price: 3500, priceLabel: '$2,000–$5,000' },
  { id: 'membership', category: 'Features', label: 'Membership System', description: 'Gated content and user accounts', price: 1500, priceLabel: '$1,500+' },
  // SEO
  { id: 'seo_basic', category: 'SEO', label: 'Basic SEO', description: 'Meta tags, sitemap, Search Console', price: 500, priceLabel: '$500' },
  { id: 'seo_advanced', category: 'SEO', label: 'Advanced SEO', description: 'On-page + off-page optimization', price: 1000, priceLabel: '$1,000' },
  { id: 'keyword_strategy', category: 'SEO', label: 'Keyword Strategy', description: 'Research, targeting, and content plan', price: 500, priceLabel: '$500' },
  // Content
  { id: 'copywriting', category: 'Content', label: 'Copywriting (per page)', description: 'Professional web copy, SEO-optimized', price: 225, priceLabel: '$150–$300/page' },
  { id: 'content_strategy', category: 'Content', label: 'Content Strategy', description: 'Brand voice and messaging framework', price: 800, priceLabel: '$800' },
  // Marketing
  { id: 'social_kit', category: 'Marketing', label: 'Social Media Kit', description: 'Templates for Instagram, LinkedIn, etc.', price: 500, priceLabel: '$500' },
  { id: 'marketing_materials', category: 'Marketing', label: 'Marketing Materials', description: 'Business cards, flyers, email headers', price: 1000, priceLabel: '$300–$2,000' },
  // Maintenance
  { id: 'maintenance_monthly', category: 'Maintenance', label: 'Monthly Maintenance', description: 'Updates, backups, and minor changes', price: 200, priceLabel: '$100–$300/mo' },
]
