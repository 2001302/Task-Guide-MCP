import { z } from 'zod';

// Guidance 관련 타입 정의
export const GuidanceSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  objective: z.string(),
  technicalConstraints: z.array(z.string()),
  workRules: z.array(z.string()),
  completionCriteria: z.array(z.string()),
  metadata: z.object({
    createdAt: z.string(),
    updatedAt: z.string(),
    version: z.string(),
    tags: z.array(z.string()).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
  }),
});

export type GuidanceSummary = z.infer<typeof GuidanceSummarySchema>;

// 메타데이터 벡터 타입
export interface MetadataVector {
  id: string;
  guidanceId: string;
  type: 'codebase' | 'external_doc' | 'reference';
  content: string;
  embedding: number[];
  metadata: {
    source: string;
    path?: string;
    lineStart?: number;
    lineEnd?: number;
    hierarchy?: string[];
    tags?: string[];
  };
  createdAt: string;
}

// 계층적 구조 타입
export interface HierarchicalNode {
  id: string;
  type: 'directory' | 'file' | 'function' | 'class' | 'interface';
  name: string;
  path: string;
  parentId?: string;
  children: string[];
  content?: string;
  metadata: {
    size?: number;
    language?: string;
    complexity?: number;
    dependencies?: string[];
  };
}

// 검색 결과 타입
export interface SearchResult {
  id: string;
  type: 'code' | 'document' | 'guidance';
  content: string;
  score: number;
  metadata: {
    source: string;
    path?: string;
    hierarchy?: string[];
    relevance?: string[];
  };
}

// MCP 도구 타입
export interface CreateGuidanceParams {
  title: string;
  objective: string;
  technicalConstraints: string[];
  workRules: string[];
  completionCriteria: string[];
  tags?: string[];
  priority?: 'low' | 'medium' | 'high';
}

export interface UpdateGuidanceParams {
  id: string;
  title?: string;
  objective?: string;
  technicalConstraints?: string[];
  workRules?: string[];
  completionCriteria?: string[];
  tags?: string[];
  priority?: 'low' | 'medium' | 'high';
}

export interface SearchParams {
  query: string;
  guidanceId?: string;
  type?: 'code' | 'document' | 'guidance' | 'all';
  limit?: number;
  threshold?: number;
}
