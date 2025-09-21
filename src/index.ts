#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import chalk from 'chalk';
import { KnowledgeTree } from './knowledge-tree/knowledge-tree.js';

const server = new Server({
  name: 'knowledge-graph-driven-project-management-mcp',
  version: '1.0.0',
});

// Global knowledge tree instance
let knowledgeTree = new KnowledgeTree();

// Tools definition
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
  },
];

// Request handlers
server.setRequestHandler(ListToolsRequestSchema, () => ({ tools }));
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;
    if (name === 'build') {
      const { rootDirectory } = args as { rootDirectory: string };

        if (!rootDirectory || typeof rootDirectory !== 'string') {
        throw new Error('Root directory is required and must be a string');
        }

        console.log(chalk.blue('Building knowledge tree...'));
  knowledgeTree = new KnowledgeTree();

      // Create root node
      knowledgeTree.addNode({
    name: 'project_root',
    entityType: 'project',
    observations: [`Project root directory: ${rootDirectory}`],
    path: rootDirectory,
        metadata: { type: 'project_root' }
      });
  console.log(chalk.green(`Knowledge tree built with ${knowledgeTree.getSize()} nodes`));

      return {
        content: [{
          type: 'text',
          text: `Knowledge tree built successfully.\nTree size: ${knowledgeTree.getSize()} nodes\nMax depth: ${knowledgeTree.getMaxDepth()}`,
        }],
      }
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    console.error(chalk.red(`Error: ${error}`));
    return {
      content: [{ type: 'text', text: `Error: ${error}` }],
      isError: true,
    };
  }
});

// Start server
async function startServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log(chalk.green('MCP server started.'));
}

startServer().catch(error => {
  console.error(chalk.red('Failed to start server:'), error);
  process.exit(1);
});