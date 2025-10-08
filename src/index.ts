#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { GuidanceManager } from './core/guidance-manager.js';
import { HierarchicalRAG } from './core/hierarchical-rag.js';
import { HybridSearch } from './core/hybrid-search.js';
import { CreateGuidanceParams, UpdateGuidanceParams, SearchParams } from './types/index.js';

class TaskGuideMCPServer {
  private server: Server;
  private guidanceManager: GuidanceManager;
  private hierarchicalRAG: HierarchicalRAG;
  private hybridSearch: HybridSearch;

  constructor() {
    this.server = new Server(
      {
        name: 'task-guide-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.guidanceManager = new GuidanceManager();
    this.hierarchicalRAG = new HierarchicalRAG();
    this.hybridSearch = new HybridSearch('./data/search.db', this.hierarchicalRAG);

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // 도구 목록 제공
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'create_guidance',
            description: '새로운 작업 가이드를 생성합니다',
            inputSchema: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  description: '가이드 제목',
                },
                objective: {
                  type: 'string',
                  description: '작업 목표',
                },
                technicalConstraints: {
                  type: 'array',
                  items: { type: 'string' },
                  description: '기술적 제약 사항',
                },
                workRules: {
                  type: 'array',
                  items: { type: 'string' },
                  description: '작업 규칙',
                },
                completionCriteria: {
                  type: 'array',
                  items: { type: 'string' },
                  description: '완료 기준',
                },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                  description: '태그 (선택사항)',
                },
                priority: {
                  type: 'string',
                  enum: ['low', 'medium', 'high'],
                  description: '우선순위 (선택사항)',
                },
              },
              required: ['title', 'objective', 'technicalConstraints', 'workRules', 'completionCriteria'],
            },
          },
          {
            name: 'update_guidance',
            description: '기존 작업 가이드를 업데이트합니다',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  description: '가이드 ID',
                },
                title: {
                  type: 'string',
                  description: '가이드 제목 (선택사항)',
                },
                objective: {
                  type: 'string',
                  description: '작업 목표 (선택사항)',
                },
                technicalConstraints: {
                  type: 'array',
                  items: { type: 'string' },
                  description: '기술적 제약 사항 (선택사항)',
                },
                workRules: {
                  type: 'array',
                  items: { type: 'string' },
                  description: '작업 규칙 (선택사항)',
                },
                completionCriteria: {
                  type: 'array',
                  items: { type: 'string' },
                  description: '완료 기준 (선택사항)',
                },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                  description: '태그 (선택사항)',
                },
                priority: {
                  type: 'string',
                  enum: ['low', 'medium', 'high'],
                  description: '우선순위 (선택사항)',
                },
              },
              required: ['id'],
            },
          },
          {
            name: 'list_guidances',
            description: '모든 작업 가이드 목록을 조회합니다',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_guidance',
            description: '특정 작업 가이드를 조회합니다',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  description: '가이드 ID',
                },
              },
              required: ['id'],
            },
          },
          {
            name: 'delete_guidance',
            description: '작업 가이드를 삭제합니다',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  description: '가이드 ID',
                },
              },
              required: ['id'],
            },
          },
          {
            name: 'index_guidance',
            description: '가이드에 대한 코드베이스와 문서를 인덱싱합니다',
            inputSchema: {
              type: 'object',
              properties: {
                guidanceId: {
                  type: 'string',
                  description: '가이드 ID',
                },
                codebasePath: {
                  type: 'string',
                  description: '코드베이스 경로 (선택사항)',
                },
                externalDocs: {
                  type: 'array',
                  items: { type: 'string' },
                  description: '외부 문서 경로들 (선택사항)',
                },
              },
              required: ['guidanceId'],
            },
          },
          {
            name: 'search',
            description: '하이브리드 검색을 수행합니다',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: '검색 쿼리',
                },
                guidanceId: {
                  type: 'string',
                  description: '특정 가이드 ID로 검색 제한 (선택사항)',
                },
                type: {
                  type: 'string',
                  enum: ['code', 'document', 'guidance', 'all'],
                  description: '검색 타입 (선택사항)',
                },
                limit: {
                  type: 'number',
                  description: '결과 제한 수 (선택사항, 기본값: 10)',
                },
                threshold: {
                  type: 'number',
                  description: '유사도 임계값 (선택사항, 기본값: 0.5)',
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'build_hierarchy',
            description: '코드베이스의 계층 구조를 구축합니다',
            inputSchema: {
              type: 'object',
              properties: {
                rootPath: {
                  type: 'string',
                  description: '루트 경로',
                },
              },
              required: ['rootPath'],
            },
          },
        ],
      };
    });

    // 도구 실행 처리
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'create_guidance':
            return await this.handleCreateGuidance(args as unknown as CreateGuidanceParams);

          case 'update_guidance':
            return await this.handleUpdateGuidance(args as unknown as UpdateGuidanceParams);

          case 'list_guidances':
            return await this.handleListGuidances();

          case 'get_guidance':
            return await this.handleGetGuidance(args as { id: string });

          case 'delete_guidance':
            return await this.handleDeleteGuidance(args as { id: string });

          case 'index_guidance':
            return await this.handleIndexGuidance(args as {
              guidanceId: string;
              codebasePath?: string;
              externalDocs?: string[];
            });

          case 'search':
            return await this.handleSearch(args as unknown as SearchParams);

          case 'build_hierarchy':
            return await this.handleBuildHierarchy(args as { rootPath: string });

          default:
            throw new Error(`알 수 없는 도구: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `오류 발생: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    });
  }

  private async handleCreateGuidance(args: CreateGuidanceParams) {
    await this.guidanceManager.initialize();
    const guidance = await this.guidanceManager.createGuidance(args);

    return {
      content: [
        {
          type: 'text',
          text: `가이드가 성공적으로 생성되었습니다:\n\n${JSON.stringify(guidance, null, 2)}`,
        },
      ],
    };
  }

  private async handleUpdateGuidance(args: UpdateGuidanceParams) {
    const guidance = await this.guidanceManager.updateGuidance(args);

    return {
      content: [
        {
          type: 'text',
          text: `가이드가 성공적으로 업데이트되었습니다:\n\n${JSON.stringify(guidance, null, 2)}`,
        },
      ],
    };
  }

  private async handleListGuidances() {
    const guidances = await this.guidanceManager.listGuidances();

    return {
      content: [
        {
          type: 'text',
          text: `총 ${guidances.length}개의 가이드가 있습니다:\n\n${guidances
            .map(
              (g) =>
                `- ${g.title} (ID: ${g.id})\n  목표: ${g.objective}\n  우선순위: ${g.metadata.priority}\n  업데이트: ${g.metadata.updatedAt}`
            )
            .join('\n\n')}`,
        },
      ],
    };
  }

  private async handleGetGuidance(args: { id: string }) {
    const guidance = await this.guidanceManager.getGuidance(args.id);

    if (!guidance) {
      return {
        content: [
          {
            type: 'text',
            text: `가이드를 찾을 수 없습니다: ${args.id}`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `가이드 정보:\n\n${JSON.stringify(guidance, null, 2)}`,
        },
      ],
    };
  }

  private async handleDeleteGuidance(args: { id: string }) {
    const success = await this.guidanceManager.deleteGuidance(args.id);

    return {
      content: [
        {
          type: 'text',
          text: success
            ? `가이드가 성공적으로 삭제되었습니다: ${args.id}`
            : `가이드 삭제에 실패했습니다: ${args.id}`,
        },
      ],
    };
  }

  private async handleIndexGuidance(args: {
    guidanceId: string;
    codebasePath?: string;
    externalDocs?: string[];
  }) {
    await this.hybridSearch.indexGuidance(
      args.guidanceId,
      args.codebasePath,
      args.externalDocs
    );

    return {
      content: [
        {
          type: 'text',
          text: `가이드 인덱싱이 완료되었습니다: ${args.guidanceId}`,
        },
      ],
    };
  }

  private async handleSearch(args: SearchParams) {
    const results = await this.hybridSearch.search(args);

    return {
      content: [
        {
          type: 'text',
          text: `검색 결과 (${results.length}개):\n\n${results
            .map(
              (result, index) =>
                `${index + 1}. [${result.type}] ${result.metadata.source}\n   점수: ${result.score.toFixed(3)}\n   내용: ${result.content.substring(0, 200)}...`
            )
            .join('\n\n')}`,
        },
      ],
    };
  }

  private async handleBuildHierarchy(args: { rootPath: string }) {
    await this.hierarchicalRAG.buildHierarchy(args.rootPath);
    const nodes = this.hierarchicalRAG.getAllNodes();

    return {
      content: [
        {
          type: 'text',
          text: `계층 구조가 구축되었습니다: ${args.rootPath}\n총 ${nodes.length}개의 노드가 생성되었습니다.`,
        },
      ],
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Task Guide MCP 서버가 시작되었습니다.');
  }
}

// 서버 시작
const server = new TaskGuideMCPServer();
server.run().catch((error) => {
  console.error('서버 실행 중 오류 발생:', error);
  process.exit(1);
});
