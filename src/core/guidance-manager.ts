import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { GuidanceSummary, GuidanceSummarySchema, CreateGuidanceParams, UpdateGuidanceParams } from '../types/index.js';

export class GuidanceManager {
  private guidanceDir: string;

  constructor(guidanceDir: string = './guidance') {
    this.guidanceDir = guidanceDir;
  }

  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.guidanceDir, { recursive: true });
      await fs.mkdir(path.join(this.guidanceDir, 'metadata'), { recursive: true });
    } catch (error) {
      console.error('Guidance 디렉토리 초기화 실패:', error);
      throw error;
    }
  }

  async createGuidance(params: CreateGuidanceParams): Promise<GuidanceSummary> {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const guidance: GuidanceSummary = {
      id,
      title: params.title,
      objective: params.objective,
      technicalConstraints: params.technicalConstraints,
      workRules: params.workRules,
      completionCriteria: params.completionCriteria,
      metadata: {
        createdAt: now,
        updatedAt: now,
        version: '1.0.0',
        tags: params.tags || [],
        priority: params.priority || 'medium',
      },
    };

    // 유효성 검사
    const validatedGuidance = GuidanceSummarySchema.parse(guidance);

    // summary.json 파일로 저장
    const guidancePath = path.join(this.guidanceDir, id);
    await fs.mkdir(guidancePath, { recursive: true });
    
    const summaryPath = path.join(guidancePath, 'summary.json');
    await fs.writeFile(summaryPath, JSON.stringify(validatedGuidance, null, 2));

    return validatedGuidance;
  }

  async updateGuidance(params: UpdateGuidanceParams): Promise<GuidanceSummary> {
    const existingGuidance = await this.getGuidance(params.id);
    if (!existingGuidance) {
      throw new Error(`Guidance with ID ${params.id} not found`);
    }

    const updatedGuidance: GuidanceSummary = {
      ...existingGuidance,
      title: params.title ?? existingGuidance.title,
      objective: params.objective ?? existingGuidance.objective,
      technicalConstraints: params.technicalConstraints ?? existingGuidance.technicalConstraints,
      workRules: params.workRules ?? existingGuidance.workRules,
      completionCriteria: params.completionCriteria ?? existingGuidance.completionCriteria,
      metadata: {
        ...existingGuidance.metadata,
        updatedAt: new Date().toISOString(),
        tags: params.tags ?? existingGuidance.metadata.tags,
        priority: params.priority ?? existingGuidance.metadata.priority,
      },
    };

    // 유효성 검사
    const validatedGuidance = GuidanceSummarySchema.parse(updatedGuidance);

    // 파일 업데이트
    const summaryPath = path.join(this.guidanceDir, params.id, 'summary.json');
    await fs.writeFile(summaryPath, JSON.stringify(validatedGuidance, null, 2));

    return validatedGuidance;
  }

  async getGuidance(id: string): Promise<GuidanceSummary | null> {
    try {
      const summaryPath = path.join(this.guidanceDir, id, 'summary.json');
      const content = await fs.readFile(summaryPath, 'utf-8');
      const guidance = JSON.parse(content);
      return GuidanceSummarySchema.parse(guidance);
    } catch (error) {
      return null;
    }
  }

  async listGuidances(): Promise<GuidanceSummary[]> {
    try {
      const entries = await fs.readdir(this.guidanceDir, { withFileTypes: true });
      const guidanceDirs = entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name);

      const guidances: GuidanceSummary[] = [];
      for (const dir of guidanceDirs) {
        const guidance = await this.getGuidance(dir);
        if (guidance) {
          guidances.push(guidance);
        }
      }

      return guidances.sort((a, b) => 
        new Date(b.metadata.updatedAt).getTime() - new Date(a.metadata.updatedAt).getTime()
      );
    } catch (error) {
      console.error('Guidance 목록 조회 실패:', error);
      return [];
    }
  }

  async deleteGuidance(id: string): Promise<boolean> {
    try {
      const guidancePath = path.join(this.guidanceDir, id);
      await fs.rm(guidancePath, { recursive: true, force: true });
      return true;
    } catch (error) {
      console.error('Guidance 삭제 실패:', error);
      return false;
    }
  }

  getGuidancePath(id: string): string {
    return path.join(this.guidanceDir, id);
  }

  getMetadataPath(id: string): string {
    return path.join(this.guidanceDir, 'metadata', `${id}.vec`);
  }
}
