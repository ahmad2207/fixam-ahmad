export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { getComboDealBySlug } from '@/lib/combos';
import { ComboDealDetailClient } from '@/components/store/ComboDealDetailClient';

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const combo = await getComboDealBySlug(slug);
  if (!combo) return {};
  return {
    title: `${combo.name} — Fixam Africa`,
    description: combo.description ?? `Shop the ${combo.name} bundle at Fixam Africa.`,
  };
}

export default async function ComboDealDetailPage({ params }: Params) {
  const { slug } = await params;
  const combo = await getComboDealBySlug(slug);
  if (!combo || !combo.isActive) notFound();

  return <ComboDealDetailClient combo={combo} />;
}
