import { Helmet } from 'react-helmet-async'
import { ReactNode } from 'react'

interface PageWrapperProps {
  title: string
  description: string
  canonical?: string
  ogImage?: string
  children: ReactNode
}

export default function PageWrapper({
  title,
  description,
  canonical,
  ogImage = 'https://designsbyta.com/imgs/hero-desk.png',
  children,
}: PageWrapperProps) {
  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        {canonical && <link rel="canonical" href={canonical} />}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImage} />
        {canonical && <meta property="og:url" content={canonical} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />
        <meta property="og:type" content="website" />
      </Helmet>
      <div className="min-h-screen bg-background text-text-primary">
        {children}
      </div>
    </>
  )
}
