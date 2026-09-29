import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { LabPreview } from '@/components/lab/lab-preview'
import { OPTIONS, bySlug, pad } from '@/components/lab/registry'

export function generateStaticParams() {
  return OPTIONS.map((o) => ({ slug: o.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const opt = bySlug(slug)
  return { title: opt ? `${pad(opt.n)} · ${opt.name} — design lab` : 'design lab' }
}

export default async function LabOptionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!bySlug(slug)) notFound()
  return <LabPreview slug={slug} />
}
