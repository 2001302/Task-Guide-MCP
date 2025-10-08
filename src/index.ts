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
    // Provide tool list
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
        name: 'create_guidance',
        description: 'Creates a new task guidance',
            inputSchema: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  description: 'Guide title',
                },
                objective: {
                  type: 'string',
                  description: 'Task objective',
                },
                technicalConstraints: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Technical constraints',
                },
                workRules: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Work rules',
                },
                completionCriteria: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Completion criteria',
                },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Tags (optional)',
                },
                priority: {
                  type: 'string',
                  enum: ['low', 'medium', 'high'],
                  description: 'Priority (optional)',
                },
              },
              required: ['title', 'objective', 'technicalConstraints', 'workRules', 'completionCriteria'],
            },
          },
          {
        name: 'update_guidance',
        description: 'Updates an existing task guidance',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  description: 'Guide ID',
                },
                title: {
                  type: 'string',
                  description: 'Guide title (optional)',
                },
                objective: {
                  type: 'string',
                  description: 'Task objective (optional)',
                },
                technicalConstraints: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Technical constraints (optional)',
                },
                workRules: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Work rules (optional)',
                },
                completionCriteria: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Completion criteria (optional)',
                },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Tags (optional)',
                },
                priority: {
                  type: 'string',
                  enum: ['low', 'medium', 'high'],
                  description: 'Priority (optional)',
                },
              },
              required: ['id'],
            },
          },
          {
        name: 'list_guidances',
        description: 'Lists all task guidances',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
        name: 'get_guidance',
        description: 'Retrieves a specific task guidance',
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
        description: 'Deletes a task guidance',
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
        description: 'Indexes codebase and documents for a guidance',
            inputSchema: {
              type: 'object',
              properties: {
                guidanceId: {
                  type: 'string',
                  description: 'Guide ID',
                },
                codebasePath: {
                  type: 'string',
                  description: 'Codebase path (optional)',
                },
                externalDocs: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'External document paths (optional)',
                },
              },
              required: ['guidanceId'],
            },
          },
          {
        name: 'search',
        description: 'Performs hybrid search',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query',
                },
                guidanceId: {
                  type: 'string',
                  description: 'Limit search to specific guide ID (optional)',
                },
                type: {
                  type: 'string',
                  enum: ['code', 'document', 'guidance', 'all'],
                  description: 'Search type (optional)',
                },
                limit: {
                  type: 'number',
                  description: 'Result limit (optional, default: 10)',
                },
                threshold: {
                  type: 'number',
                  description: 'Similarity threshold (optional, default: 0.5)',
                },
              },
              required: ['query'],
            },
          },
          {
        name: 'build_hierarchy',
        description: 'Builds hierarchical structure of codebase',
            inputSchema: {
              type: 'object',
              properties: {
                rootPath: {
                  type: 'string',
                  description: 'Root path',
                },
              },
              required: ['rootPath'],
            },
          },
        ],
      };
    });

    // Handle tool execution
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
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error occurred: ${error instanceof Error ? error.message : String(error)}`,
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
          text: `Guidance created successfully:\n\n${JSON.stringify(guidance, null, 2)}`,
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
          text: `Guidance updated successfully:\n\n${JSON.stringify(guidance, null, 2)}`,
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
          text: `Total ${guidances.length} guidances found:\n\n${guidances
            .map(
              (g) =>
                `- ${g.title} (ID: ${g.id})\n  Objective: ${g.objective}\n  Priority: ${g.metadata.priority}\n  Updated: ${g.metadata.updatedAt}`
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
            text: `Guidance not found: ${args.id}`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `Guidance information:\n\n${JSON.stringify(guidance, null, 2)}`,
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
            ? `Guidance deleted successfully: ${args.id}`
            : `Failed to delete guidance: ${args.id}`,
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
          text: `Guidance indexing completed: ${args.guidanceId}`,
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
          text: `Search results (${results.length} found):\n\n${results
            .map(
              (result, index) =>
                `${index + 1}. [${result.type}] ${result.metadata.source}\n   Score: ${result.score.toFixed(3)}\n   Content: ${result.content.substring(0, 200)}...`
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
          text: `Hierarchical structure built: ${args.rootPath}\nTotal ${nodes.length} nodes created.`,
        },
      ],
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Task Guide MCP server started.');
  }
}

// Start server
const server = new TaskGuideMCPServer();
server.run().catch((error) => {
  console.error('Error occurred while running server:', error);
  process.exit(1);
});
