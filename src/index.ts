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
    name: 'build',
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
  }
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
      case 'build': {
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
