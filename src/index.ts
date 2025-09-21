#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import chalk from 'chalk';
import { KnowledgeTree, KnowledgeTreeNodeData } from './knowledge-tree/knowledge-tree.js';

const server = new Server({
  name: 'knowledge-graph-driven-project-management-mcp',
  version: '1.0.0',
});

enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  FILE_SYSTEM_ERROR = 'FILE_SYSTEM_ERROR',
  KNOWLEDGE_GRAPH_ERROR = 'KNOWLEDGE_GRAPH_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// Knowledge Tree instance
let knowledgeTree: KnowledgeTree = new KnowledgeTree();

// Define tool list
const tools = [
  {
    name: 'get-context',
    description: 'Get AI context for a specific node',
    inputSchema: {
      type: 'object',
      properties: {
        nodeName: {
          type: 'string',
          description: 'Name of the node to get context for',
        },
        includeSiblings: {
          type: 'boolean',
          description: 'Whether to include sibling nodes in context',
        },
        maxDepth: {
          type: 'number',
          description: 'Maximum depth of child nodes to include',
        },
      },
      required: ['nodeName'],
    },
  },
  {
    name: 'build-tree',
    description: 'Build knowledge tree from existing knowledge graph',
    inputSchema: {
      type: 'object',
      properties: {
        rootDirectory: {
          type: 'string',
          description: 'Root directory to build tree from',
        },
      },
      required: ['rootDirectory'],
    },
  },
  {
    name: 'get-tree-info',
    description: 'Get information about the knowledge tree structure',
    inputSchema: {
      type: 'object',
      properties: {
        nodeName: {
          type: 'string',
          description: 'Optional specific node to get info for',
        },
      },
    },
  },
];

// Tool list handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools,
  };
});

// Tool call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get-context': {
        const { nodeName, includeSiblings = true } = args as {
          nodeName: string;
          includeSiblings?: boolean;
          maxDepth?: number;
        };

        if (!nodeName || typeof nodeName !== 'string') {
          const error = new Error('Node name is required and must be a string');
          (error as any).code = ErrorCode.VALIDATION_ERROR;
          (error as any).field = 'nodeName';
          throw error;
        }

        console.log(chalk.blue(`Getting AI context for node: ${nodeName}`));

        const context = knowledgeTree.getContextualAIContext(nodeName, includeSiblings);
        
        if (context.includes('not found')) {
          return {
            content: [
              {
                type: 'text',
                text: `Node '${nodeName}' not found in knowledge tree.`,
              },
            ],
            isError: true,
          };
        }

        console.log(chalk.green('AI context generated successfully.'));

        return {
          content: [
            {
              type: 'text',
              text: context,
            },
          ],
        };
      }

      case 'build-tree': {
        const { rootDirectory } = args as { rootDirectory: string };

        if (!rootDirectory || typeof rootDirectory !== 'string') {
          const error = new Error('Root directory is required and must be a string');
          (error as any).code = ErrorCode.VALIDATION_ERROR;
          (error as any).field = 'rootDirectory';
          throw error;
        }

        console.log(chalk.blue('Building knowledge tree...'));

        // Build tree from existing knowledge graph
        await buildKnowledgeTree(rootDirectory);

        console.log(chalk.green('Knowledge tree built successfully.'));

        return {
          content: [
            {
              type: 'text',
              text: `Knowledge tree has been built successfully.\nTree size: ${knowledgeTree.getSize()} nodes\nMax depth: ${knowledgeTree.getMaxDepth()}`,
            },
          ],
        };
      }

      case 'get-tree-info': {
        const { nodeName } = args as { nodeName?: string };

        console.log(chalk.blue('Getting knowledge tree information...'));

        if (nodeName) {
          const node = knowledgeTree.findNode(nodeName);
          if (!node) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Node '${nodeName}' not found in knowledge tree.`,
                },
              ],
              isError: true,
            };
          }

          const info = {
            name: node.data.name,
            type: node.data.entityType,
            path: node.data.path,
            depth: node.getDepth(),
            isRoot: node.isRoot(),
            isLeaf: node.isLeaf(),
            childrenCount: node.children.length,
            fullPath: node.getFullPath(),
          };

          return {
            content: [
              {
                type: 'text',
                text: `**Node Information:**\n${JSON.stringify(info, null, 2)}`,
              },
            ],
          };
        } else {
          const info = {
            totalNodes: knowledgeTree.getSize(),
            maxDepth: knowledgeTree.getMaxDepth(),
            hasRoot: knowledgeTree.root !== null,
            rootName: knowledgeTree.root?.data.name || 'None',
          };

          return {
            content: [
              {
                type: 'text',
                text: `**Tree Information:**\n${JSON.stringify(info, null, 2)}\n\n**Tree Structure:**\n${knowledgeTree.toString()}`,
              },
            ],
          };
        }
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    console.error(chalk.red(`Error occurred: ${error}`));
    return {
      content: [
        {
          type: 'text',
          text: `An error occurred: ${error}`,
        },
      ],
      isError: true,
    };
  }
});

/**
 * Build knowledge tree from existing knowledge graph data
 */
async function buildKnowledgeTree(rootDirectory: string): Promise<void> {
  console.log(chalk.blue('Building knowledge tree from existing knowledge graph...'));

  // Clear existing tree
  knowledgeTree = new KnowledgeTree();

  // Create root node for the project
  const rootData: KnowledgeTreeNodeData = {
    name: 'project_root',
    entityType: 'project',
    observations: [`Project root directory: ${rootDirectory}`],
    path: rootDirectory,
    metadata: {
      type: 'project_root'
    }
  };

  knowledgeTree.addNode(rootData);

  console.log(chalk.green(`Knowledge tree built with ${knowledgeTree.getSize()} nodes`));
}

async function startServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log(
    chalk.green('Knowledge Graph Driven Project Management MCP server started.')
  );
}

async function main() {
  await startServer();
}

// Error handling
process.on('uncaughtException', (error) => {
  console.error(chalk.red('Unexpected error occurred:'), error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(chalk.red('Unhandled Promise rejection:'), reason);
  process.exit(1);
});

// Program execution
main().catch((error) => {
  if (error instanceof Error && (error as any).code) {
    console.error(
      chalk.red('Error occurred during program execution:'),
      error.message
    );
  } else {
    console.error(
      chalk.red('Unexpected error occurred during program execution:'),
      error
    );
  }
  process.exit(1);
});
