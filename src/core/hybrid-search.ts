import { promises as fs } from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { MetadataVector, SearchResult, SearchParams, HierarchicalNode } from '../types/index.js';
import { HierarchicalRAG } from './hierarchical-rag.js';

export class HybridSearch {
  private db: Database.Database;
  private hierarchicalRAG: HierarchicalRAG;
  private embeddings: Map<string, number[]> = new Map();

  constructor(dbPath: string = './data/search.db', hierarchicalRAG: HierarchicalRAG) {
    this.db = new Database(dbPath);
    this.hierarchicalRAG = hierarchicalRAG;
    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    // 벡터 저장 테이블
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS vectors (
        id TEXT PRIMARY KEY,
        guidance_id TEXT NOT NULL,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        embedding BLOB NOT NULL,
        metadata TEXT NOT NULL,
        created_at TEXT NOT NULL,
        INDEX(guidance_id),
        INDEX(type)
      )
    `);

    // 구조적 인덱스 테이블
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS structural_index (
        id TEXT PRIMARY KEY,
        guidance_id TEXT NOT NULL,
        node_id TEXT NOT NULL,
        hierarchy_path TEXT NOT NULL,
        tags TEXT,
        content_hash TEXT NOT NULL,
        created_at TEXT NOT NULL,
        INDEX(guidance_id),
        INDEX(hierarchy_path),
        INDEX(tags)
      )
    `);

    // 지식 그래프 테이블
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS knowledge_graph (
        id TEXT PRIMARY KEY,
        source_id TEXT NOT NULL,
        target_id TEXT NOT NULL,
        relation_type TEXT NOT NULL,
        weight REAL DEFAULT 1.0,
        created_at TEXT NOT NULL,
        INDEX(source_id),
        INDEX(target_id),
        INDEX(relation_type)
      )
    `);
  }

  async indexGuidance(guidanceId: string, codebasePath?: string, externalDocs?: string[]): Promise<void> {
    console.log(`Guidance 인덱싱 시작: ${guidanceId}`);

    // 1. 코드베이스 인덱싱
    if (codebasePath) {
      await this.indexCodebase(guidanceId, codebasePath);
    }

    // 2. 외부 문서 인덱싱
    if (externalDocs && externalDocs.length > 0) {
      await this.indexExternalDocuments(guidanceId, externalDocs);
    }

    // 3. 지식 그래프 구축
    await this.buildKnowledgeGraph(guidanceId);

    console.log(`Guidance 인덱싱 완료: ${guidanceId}`);
  }

  private async indexCodebase(guidanceId: string, codebasePath: string): Promise<void> {
    // 계층적 RAG를 사용하여 코드베이스 구조 분석
    await this.hierarchicalRAG.buildHierarchy(codebasePath);
    
    const nodes = this.hierarchicalRAG.getAllNodes();
    
    for (const node of nodes) {
      if (node.content) {
        // 벡터 임베딩 생성
        const embedding = await this.generateEmbedding(node.content);
        
        // 벡터 저장
        const vectorId = uuidv4();
        const vector: MetadataVector = {
          id: vectorId,
          guidanceId,
          type: 'codebase',
          content: node.content,
          embedding,
          metadata: {
            source: node.path,
            path: node.path,
            hierarchy: this.getHierarchyPath(node),
            tags: this.extractTags(node),
          },
          createdAt: new Date().toISOString(),
        };

        await this.storeVector(vector);

        // 구조적 인덱스 저장
        await this.storeStructuralIndex(guidanceId, node);
      }
    }
  }

  private async indexExternalDocuments(guidanceId: string, docPaths: string[]): Promise<void> {
    for (const docPath of docPaths) {
      try {
        const content = await this.extractDocumentContent(docPath);
        if (content) {
          const embedding = await this.generateEmbedding(content);
          
          const vectorId = uuidv4();
          const vector: MetadataVector = {
            id: vectorId,
            guidanceId,
            type: 'external_doc',
            content,
            embedding,
            metadata: {
              source: docPath,
              path: docPath,
              tags: this.extractDocumentTags(content),
            },
            createdAt: new Date().toISOString(),
          };

          await this.storeVector(vector);
        }
      } catch (error) {
        console.error(`외부 문서 인덱싱 실패: ${docPath}`, error);
      }
    }
  }

  private async extractDocumentContent(filePath: string): Promise<string | null> {
    const ext = path.extname(filePath).toLowerCase();
    
    try {
      switch (ext) {
        case '.md':
        case '.txt':
          return await fs.readFile(filePath, 'utf-8');
        case '.json':
          const jsonContent = await fs.readFile(filePath, 'utf-8');
          return JSON.stringify(JSON.parse(jsonContent), null, 2);
        default:
          console.warn(`지원하지 않는 파일 형식: ${ext}`);
          return null;
      }
    } catch (error) {
      console.error(`문서 내용 추출 실패: ${filePath}`, error);
      return null;
    }
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    // 간단한 해시 기반 임베딩 (실제로는 OpenAI API 등을 사용)
    // 실제 구현에서는 OpenAI의 text-embedding-ada-002 등을 사용
    const hash = this.simpleHash(text);
    const embedding = new Array(1536).fill(0);
    
    for (let i = 0; i < Math.min(hash.length, 1536); i++) {
      embedding[i] = (hash.charCodeAt(i % hash.length) - 128) / 128;
    }
    
    return embedding;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit integer로 변환
    }
    return Math.abs(hash).toString(36);
  }

  private async storeVector(vector: MetadataVector): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO vectors 
      (id, guidance_id, type, content, embedding, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      vector.id,
      vector.guidanceId,
      vector.type,
      vector.content,
      JSON.stringify(vector.embedding),
      JSON.stringify(vector.metadata),
      vector.createdAt
    );
  }

  private async storeStructuralIndex(guidanceId: string, node: HierarchicalNode): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO structural_index
      (id, guidance_id, node_id, hierarchy_path, tags, content_hash, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const hierarchyPath = this.getHierarchyPath(node).join('/');
    const tags = (this.extractTags(node) || []).join(',');
    const contentHash = this.simpleHash(node.content || '');

    stmt.run(
      uuidv4(),
      guidanceId,
      node.id,
      hierarchyPath,
      tags,
      contentHash,
      new Date().toISOString()
    );
  }

  private getHierarchyPath(node: HierarchicalNode): string[] {
    const path: string[] = [];
    let currentNode: HierarchicalNode | undefined = node;
    
    while (currentNode) {
      path.unshift(currentNode.name);
      currentNode = this.hierarchicalRAG.getParent(currentNode.id);
    }
    
    return path;
  }

  private extractTags(node: HierarchicalNode): string[] {
    const tags: string[] = [];
    
    if (node.metadata.language) {
      tags.push(`lang:${node.metadata.language}`);
    }
    
    if (node.type) {
      tags.push(`type:${node.type}`);
    }
    
    if (node.metadata.complexity) {
      const complexity = node.metadata.complexity > 10 ? 'high' : node.metadata.complexity > 5 ? 'medium' : 'low';
      tags.push(`complexity:${complexity}`);
    }
    
    return tags;
  }

  private extractDocumentTags(content: string): string[] {
    const tags: string[] = [];
    
    // 문서 타입 추출
    if (content.includes('# ')) {
      tags.push('type:markdown');
    }
    
    if (content.includes('```')) {
      tags.push('type:code-documentation');
    }
    
    // 키워드 기반 태그
    const keywords = ['api', 'function', 'class', 'interface', 'config', 'setup', 'guide'];
    for (const keyword of keywords) {
      if (content.toLowerCase().includes(keyword)) {
        tags.push(`keyword:${keyword}`);
      }
    }
    
    return tags;
  }

  private async buildKnowledgeGraph(guidanceId: string): Promise<void> {
    // 벡터 간의 유사도 기반으로 관계 구축
    const vectors = this.getVectorsByGuidance(guidanceId);
    
    for (let i = 0; i < vectors.length; i++) {
      for (let j = i + 1; j < vectors.length; j++) {
        const similarity = this.calculateSimilarity(vectors[i].embedding, vectors[j].embedding);
        
        if (similarity > 0.7) { // 임계값
          await this.addRelation(vectors[i].id, vectors[j].id, 'similar', similarity);
        }
      }
    }
  }

  private getVectorsByGuidance(guidanceId: string): MetadataVector[] {
    const stmt = this.db.prepare('SELECT * FROM vectors WHERE guidance_id = ?');
    const rows = stmt.all(guidanceId) as any[];
    
    return rows.map(row => ({
      id: row.id,
      guidanceId: row.guidance_id,
      type: row.type as any,
      content: row.content,
      embedding: JSON.parse(row.embedding),
      metadata: JSON.parse(row.metadata),
      createdAt: row.created_at,
    }));
  }

  private calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    // 코사인 유사도 계산
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  private async addRelation(sourceId: string, targetId: string, relationType: string, weight: number): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO knowledge_graph
      (id, source_id, target_id, relation_type, weight, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      uuidv4(),
      sourceId,
      targetId,
      relationType,
      weight,
      new Date().toISOString()
    );
  }

  // 하이브리드 검색 메서드
  async search(params: SearchParams): Promise<SearchResult[]> {
    const { query, guidanceId, type = 'all', limit = 10, threshold = 0.5 } = params;
    
    // 1. 벡터 검색 (의미적 검색)
    const vectorResults = await this.vectorSearch(query, guidanceId, type, limit * 2);
    
    // 2. 구조적 검색
    const structuralResults = await this.structuralSearch(query, guidanceId, type, limit * 2);
    
    // 3. 지식 그래프 검색
    const graphResults = await this.graphSearch(query, guidanceId, limit);
    
    // 4. 결과 통합 및 랭킹
    const combinedResults = this.combineResults(vectorResults, structuralResults, graphResults, query);
    
    // 5. 임계값 필터링 및 제한
    return combinedResults
      .filter(result => result.score >= threshold)
      .slice(0, limit);
  }

  private async vectorSearch(query: string, guidanceId?: string, type?: string, limit?: number): Promise<SearchResult[]> {
    const queryEmbedding = await this.generateEmbedding(query);
    const results: SearchResult[] = [];
    
    let sql = 'SELECT * FROM vectors WHERE 1=1';
    const params: any[] = [];
    
    if (guidanceId) {
      sql += ' AND guidance_id = ?';
      params.push(guidanceId);
    }
    
    if (type && type !== 'all') {
      sql += ' AND type = ?';
      params.push(type);
    }
    
    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as any[];
    
    for (const row of rows) {
      const embedding = JSON.parse(row.embedding);
      const similarity = this.calculateSimilarity(queryEmbedding, embedding);
      
      results.push({
        id: row.id,
        type: row.type as any,
        content: row.content,
        score: similarity,
        metadata: {
          source: JSON.parse(row.metadata).source,
          path: JSON.parse(row.metadata).path,
          hierarchy: JSON.parse(row.metadata).hierarchy,
          relevance: ['vector_similarity'],
        },
      });
    }
    
    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  private async structuralSearch(query: string, guidanceId?: string, type?: string, limit?: number): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const queryLower = query.toLowerCase();
    
    let sql = 'SELECT * FROM structural_index WHERE 1=1';
    const params: any[] = [];
    
    if (guidanceId) {
      sql += ' AND guidance_id = ?';
      params.push(guidanceId);
    }
    
    sql += ' AND (hierarchy_path LIKE ? OR tags LIKE ?)';
    params.push(`%${queryLower}%`, `%${queryLower}%`);
    
    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as any[];
    
    for (const row of rows) {
      const node = this.hierarchicalRAG.getNode(row.node_id);
      if (node) {
        const score = this.calculateStructuralScore(node, queryLower);
        
        results.push({
          id: row.id,
          type: 'code',
          content: node.content || '',
          score,
          metadata: {
            source: node.path,
            path: node.path,
            hierarchy: this.getHierarchyPath(node),
            relevance: ['structural_match'],
          },
        });
      }
    }
    
    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  private async graphSearch(query: string, guidanceId?: string, limit?: number): Promise<SearchResult[]> {
    // 지식 그래프를 통한 관련 노드 검색
    const results: SearchResult[] = [];
    
    // 구현 생략 (복잡한 그래프 탐색 로직)
    // 실제로는 그래프 데이터베이스나 복잡한 쿼리 로직이 필요
    
    return results;
  }

  private calculateStructuralScore(node: HierarchicalNode, query: string): number {
    let score = 0;
    
    if (node.name.toLowerCase().includes(query)) score += 10;
    if (node.path.toLowerCase().includes(query)) score += 5;
    if (node.content && node.content.toLowerCase().includes(query)) score += 3;
    
    return score / 18; // 정규화
  }

  private combineResults(
    vectorResults: SearchResult[],
    structuralResults: SearchResult[],
    graphResults: SearchResult[],
    query: string
  ): SearchResult[] {
    const combined = new Map<string, SearchResult>();
    
    // 벡터 검색 결과 (가중치 0.4)
    for (const result of vectorResults) {
      const existing = combined.get(result.id);
      if (existing) {
        existing.score = Math.max(existing.score, result.score * 0.4);
        existing.metadata.relevance = [...new Set([...(existing.metadata.relevance || []), ...(result.metadata.relevance || [])])];
      } else {
        combined.set(result.id, { ...result, score: result.score * 0.4 });
      }
    }
    
    // 구조적 검색 결과 (가중치 0.3)
    for (const result of structuralResults) {
      const existing = combined.get(result.id);
      if (existing) {
        existing.score = Math.max(existing.score, result.score * 0.3);
        existing.metadata.relevance = [...new Set([...(existing.metadata.relevance || []), ...(result.metadata.relevance || [])])];
      } else {
        combined.set(result.id, { ...result, score: result.score * 0.3 });
      }
    }
    
    // 그래프 검색 결과 (가중치 0.3)
    for (const result of graphResults) {
      const existing = combined.get(result.id);
      if (existing) {
        existing.score = Math.max(existing.score, result.score * 0.3);
        existing.metadata.relevance = [...new Set([...(existing.metadata.relevance || []), ...(result.metadata.relevance || [])])];
      } else {
        combined.set(result.id, { ...result, score: result.score * 0.3 });
      }
    }
    
    return Array.from(combined.values()).sort((a, b) => b.score - a.score);
  }

  close(): void {
    this.db.close();
  }
}
