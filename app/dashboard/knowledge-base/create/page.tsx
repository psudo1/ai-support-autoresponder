import KnowledgeBaseForm from '@/components/knowledge/KnowledgeBaseForm';

export default function CreateKnowledgeBasePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Knowledge Base Entry</h1>
      <KnowledgeBaseForm />
    </div>
  );
}

