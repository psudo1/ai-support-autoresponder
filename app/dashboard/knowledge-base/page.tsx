import KnowledgeBaseList from '@/components/knowledge/KnowledgeBaseList';
import { getAllKnowledgeEntries } from '@/lib/knowledgeBaseService';

export default async function KnowledgeBasePage() {
  const entries = await getAllKnowledgeEntries();

  return <KnowledgeBaseList initialEntries={entries} />;
}

