import { getKnowledgeEntryById } from '@/lib/knowledgeBaseService';
import KnowledgeBaseForm from '@/components/knowledge/KnowledgeBaseForm';
import { notFound } from 'next/navigation';

export default async function KnowledgeBaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entry = await getKnowledgeEntryById(id);

  if (!entry) {
    notFound();
  }

  return <KnowledgeBaseForm entry={entry} />;
}

