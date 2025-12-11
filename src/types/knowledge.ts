export type KnowledgeFileType = 'pdf' | 'text' | 'markdown' | 'html';

export interface KnowledgeBase {
  id: string;
  title: string;
  content: string;
  file_url: string | null;
  file_type: KnowledgeFileType | null;
  category: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  is_active: boolean;
  embedding: number[] | null;
}

export interface CreateKnowledgeInput {
  title: string;
  content: string;
  file_url?: string;
  file_type?: KnowledgeFileType;
  category?: string;
  tags?: string[];
}

export interface UpdateKnowledgeInput {
  title?: string;
  content?: string;
  category?: string;
  tags?: string[];
  is_active?: boolean;
}

export interface KnowledgeSearchResult extends KnowledgeBase {
  similarity?: number;
}

