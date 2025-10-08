import { z } from 'zod';

// Guidance-related type definitions
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

// Metadata vector type
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

// Hierarchical structure type
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

// Search result type
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

// MCP tool types
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
