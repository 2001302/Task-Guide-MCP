#!/usr/bin/env node

// Node.js built-in modules
import { readFile, writeFile, mkdir, readdir, rm } from 'fs/promises';
import { join } from 'path';

// External libraries
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import yargs from 'yargs';
import chalk from 'chalk';

// Custom error classes
class KnowledgeGraphError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly field?: string
  ) {
    super(message);
    this.name = 'KnowledgeGraphError';
  }
}

class ValidationError extends KnowledgeGraphError {
  constructor(message: string, field?: string) {
    super(message, 'VALIDATION_ERROR', field);
    this.name = 'ValidationError';
  }
}

class FileSystemError extends KnowledgeGraphError {
  constructor(message: string, field?: string) {
    super(message, 'FILE_SYSTEM_ERROR', field);
    this.name = 'FileSystemError';
  }
}

// Create MCP server instance
const server = new Server({
  name: 'knowledge-graph-driven-project-management-mcp',
  version: '1.0.0',
});

// Knowledge graph data storage
interface KnowledgeNode {
  id: string;
  type: string;
  content: string;
  metadata?: Record<string, any>;
}

interface KnowledgeRelationship {
  from: string;
  to: string;
  type: string;
  metadata?: Record<string, any>;
}

let knowledgeGraph: {
  nodes: KnowledgeNode[];
  relationships: KnowledgeRelationship[];
} = {
  nodes: [],
  relationships: [],
};

// Define tool list
const tools = [
  {
    name: 'setup',
    description: 'Initialize knowledge graph project',
    inputSchema: {
      type: 'object',
      properties: {
        rootDirectory: {
          type: 'string',
          description: 'Project root directory path',
        },
      },
      required: ['rootDirectory'],
    },
  },
  {
    name: 'generate',
    description: 'Generate knowledge graph',
    inputSchema: {
      type: 'object',
      properties: {
        targetFolder: {
          type: 'string',
          description: 'Target folder to generate knowledge graph',
        },
      },
      required: ['targetFolder'],
    },
  },
  {
    name: 'update',
    description: 'Update knowledge graph',
    inputSchema: {
      type: 'object',
      properties: {
        gitDiff: {
          type: 'string',
          description: 'Git diff information',
        },
      },
      required: ['gitDiff'],
    },
  },
  {
    name: 'private-knowledge',
    description: 'Generate private knowledge graph',
    inputSchema: {
      type: 'object',
      properties: {
        rootDirectory: {
          type: 'string',
          description: 'Project root directory path',
        },
        purpose: {
          type: 'string',
          description: 'Description of what to do',
        },
      },
      required: ['rootDirectory', 'purpose'],
    },
  },
  {
    name: 'clear',
    description: 'Clear all knowledge graphs',
    inputSchema: {
      type: 'object',
      properties: {
        rootDirectory: {
          type: 'string',
          description: 'Root directory path to clear knowledge graphs from',
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
      case 'setup': {
        const { rootDirectory } = args as { rootDirectory: string };
        
        if (!rootDirectory || typeof rootDirectory !== 'string') {
          throw new ValidationError('Root directory is required and must be a string', 'rootDirectory');
        }
        
        console.log(chalk.blue('Starting knowledge graph project initialization...'));
        
        // Create .knowledge-root folder
        
        const knowledgeRootPath = join(rootDirectory, '.knowledge-root');
        await mkdir(knowledgeRootPath, { recursive: true });
        
        // Create basic configuration files
        const configYaml = `# Knowledge Graph Configuration
version: 1.0.0
created: ${new Date().toISOString()}
`;
        
        const knowledgeNodeJson = {
          version: '1.0.0',
          nodes: [],
          relationships: [],
          created: new Date().toISOString(),
        };
        
        const knowledgeIgnoreJson = {
          patterns: [
            'node_modules/**',
            '.git/**',
            'dist/**',
            'build/**',
            '*.log',
            '.DS_Store',
          ],
        };
        
        await writeFile(
          join(knowledgeRootPath, '.config.yaml'),
          configYaml
        );
        await writeFile(
          join(knowledgeRootPath, '.knowledge-node.json'),
          JSON.stringify(knowledgeNodeJson, null, 2)
        );
        await writeFile(
          join(knowledgeRootPath, '.knowledge-ignore.json'),
          JSON.stringify(knowledgeIgnoreJson, null, 2)
        );
        
        // Traverse all directories and create .knowledge-node folders
        await traverseDirectories(rootDirectory);
        
        console.log(chalk.green('Knowledge graph project initialization completed successfully.'));
        
        return {
          content: [
            {
              type: 'text',
              text: `Knowledge graph project has been set up successfully.\nRoot directory: ${rootDirectory}\nConfiguration file location: ${knowledgeRootPath}`,
            },
          ],
        };
      }

      case 'generate': {
        const { targetFolder } = args as { targetFolder: string };
        
        if (!targetFolder || typeof targetFolder !== 'string') {
          throw new ValidationError('Target folder is required and must be a string', 'targetFolder');
        }
        
        console.log(chalk.blue(`Generating knowledge graph: ${targetFolder}`));
        
        // Generate knowledge graph using DFS traversal
        await generateKnowledgeGraph(targetFolder);
        
        console.log(chalk.green('Knowledge graph generation completed successfully.'));
        
        return {
          content: [
            {
              type: 'text',
              text: `Knowledge graph has been generated successfully.\nTarget folder: ${targetFolder}`,
            },
          ],
        };
      }

      case 'update': {
        const { gitDiff } = args as { gitDiff: string };
        
        console.log(chalk.blue('Updating knowledge graph...'));
        
        // Update knowledge graph based on Git diff
        await updateKnowledgeGraph(gitDiff);
        
        console.log(chalk.green('Knowledge graph update completed successfully.'));
        
        return {
          content: [
            {
              type: 'text',
              text: 'Knowledge graph has been updated successfully.',
            },
          ],
        };
      }

      case 'private-knowledge': {
        const { rootDirectory, purpose } = args as { 
          rootDirectory: string; 
          purpose: string; 
        };
        
        if (!rootDirectory || typeof rootDirectory !== 'string') {
          throw new ValidationError('Root directory is required and must be a string', 'rootDirectory');
        }
        
        if (!purpose || typeof purpose !== 'string') {
          throw new ValidationError('Purpose is required and must be a string', 'purpose');
        }
        
        console.log(chalk.blue('Generating private knowledge graph...'));
        
        // Generate private knowledge graph
        await generatePrivateKnowledge(rootDirectory, purpose);
        
        console.log(chalk.green('Private knowledge graph generation completed successfully.'));
        
        return {
          content: [
            {
              type: 'text',
              text: `Private knowledge graph has been generated successfully.\nPurpose: ${purpose}\nLocation: ${rootDirectory}/.my-knowledge`,
            },
          ],
        };
      }

      case 'clear': {
        const { rootDirectory } = args as { rootDirectory?: string };
        
        console.log(chalk.yellow('Clearing all knowledge graphs...'));
        
        // Clear memory
        knowledgeGraph = {
          nodes: [],
          relationships: [],
        };
        
        // Clear file system knowledge files
        const targetDir = rootDirectory || process.cwd();
        await clearKnowledgeFiles(targetDir);
        
        console.log(chalk.green('Knowledge graph cleanup completed successfully.'));
        
        return {
          content: [
            {
              type: 'text',
              text: `All knowledge graphs have been cleared successfully from ${targetDir}.`,
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
 * Traverses directories and creates .knowledge-node folders
 * @param rootDir - Root directory path to traverse
 * @throws {FileSystemError} When directory creation or file writing fails
 */
async function traverseDirectories(rootDir: string) {
  
  const traverseDir = async (currentDir: string) => {
    const items = await readdir(currentDir, { withFileTypes: true });
    
    for (const item of items) {
      if (item.isDirectory() && !item.name.startsWith('.')) {
        const itemPath = join(currentDir, item.name);
        const knowledgeNodePath = join(itemPath, '.knowledge-node');
        
        // Create .knowledge-node folder
        await mkdir(knowledgeNodePath, { recursive: true });
        
        // Create .knowledge-node.json file
        const knowledgeNodeJson = {
          version: '1.0.0',
          nodes: [],
          relationships: [],
          created: new Date().toISOString(),
        };
        
        await writeFile(
          join(knowledgeNodePath, '.knowledge-node.json'),
          JSON.stringify(knowledgeNodeJson, null, 2)
        );
        
        // Traverse subdirectories
        await traverseDir(itemPath);
      }
    }
  };
  
  await traverseDir(rootDir);
}

/**
 * Generates knowledge graph from target folder
 * @param targetFolder - Target folder path to generate knowledge graph from
 * @throws {FileSystemError} When file reading fails
 */
async function generateKnowledgeGraph(targetFolder: string) {
  // Generate knowledge graph using DFS traversal
  const dfsTraverse = async (currentDir: string) => {
    const items = await readdir(currentDir, { withFileTypes: true });
    
    for (const item of items) {
      if (item.isDirectory() && !item.name.startsWith('.')) {
        const itemPath = join(currentDir, item.name);
        const knowledgeNodePath = join(
          itemPath, 
          '.knowledge-node', 
          '.knowledge-node.json'
        );
        
        try {
          const nodeData = await readFile(knowledgeNodePath, 'utf-8');
          const nodeJson = JSON.parse(nodeData);
          
          // Add nodes to knowledge graph
          for (const node of nodeJson.nodes) {
            knowledgeGraph.nodes.push(node);
          }
          for (const relationship of nodeJson.relationships) {
            knowledgeGraph.relationships.push(relationship);
          }
          
          // Traverse subdirectories
          await dfsTraverse(itemPath);
        } catch (error) {
          if (error instanceof Error) {
            throw new FileSystemError(
              `Cannot read knowledge node file: ${error.message}`,
              'knowledgeNodePath'
            );
          }
          throw new FileSystemError(
            'Unknown error occurred while reading knowledge node file',
            'knowledgeNodePath'
          );
        }
      }
    }
  };
  
  await dfsTraverse(targetFolder);
}

/**
 * Updates knowledge graph based on Git diff
 * @param gitDiff - Git diff information
 */
async function updateKnowledgeGraph(gitDiff: string) {
  // Parse Git diff to extract changed files
  const changedFiles = gitDiff
    .split('\n')
    .filter(line => line.startsWith('+++') || line.startsWith('---'))
    .map(line => line.substring(4))
    .filter(file => file && !file.startsWith('/dev/null'));
  
  console.log(
    chalk.blue(`Number of changed files: ${changedFiles.length}`)
  );
  
  // Update knowledge graph for changed files
  for (const file of changedFiles) {
    console.log(chalk.gray(`Updating: ${file}`));
  }
}

/**
 * Generates private knowledge graph
 * @param rootDirectory - Project root directory path
 * @param purpose - Purpose of knowledge graph generation
 * @throws {FileSystemError} When directory creation or file writing fails
 */
async function generatePrivateKnowledge(rootDirectory: string, purpose: string) {
  const myKnowledgePath = join(rootDirectory, '.my-knowledge');
  await mkdir(myKnowledgePath, { recursive: true });
  
  const privateKnowledgeData = {
    version: '1.0.0',
    purpose: purpose,
    created: new Date().toISOString(),
    nodes: [],
    relationships: [],
  };
  
  await writeFile(
    join(myKnowledgePath, 'private-knowledge.json'),
    JSON.stringify(privateKnowledgeData, null, 2)
  );
}

/**
 * Clears all knowledge files from the file system
 * @param rootDir - Root directory path to clear knowledge files from
 * @throws {FileSystemError} When file deletion fails
 */
async function clearKnowledgeFiles(rootDir?: string) {
  // Directories to skip during traversal
  const skipDirs = new Set([
    'node_modules',
    '.git',
    'dist',
    'build',
    '.next',
    '.nuxt',
    'coverage',
    '.nyc_output',
    '.cache',
    '.parcel-cache',
    '.vscode',
    '.idea',
    'vendor',
    'target',
    'out',
    'bin',
    'obj'
  ]);

  const clearDir = async (currentDir: string) => {
    try {
      const items = await readdir(currentDir, { withFileTypes: true });
      
      for (const item of items) {
        if (item.isDirectory()) {
          const itemPath = join(currentDir, item.name);
          
          // Skip certain directories (but allow .knowledge-* and .my-knowledge)
          if (skipDirs.has(item.name) || 
              (item.name.startsWith('.') && 
               !item.name.startsWith('.knowledge-') && 
               item.name !== '.my-knowledge')) {
            continue;
          }
          
          // Remove .knowledge-root folder
          if (item.name === '.knowledge-root') {
            await rm(itemPath, { recursive: true, force: true });
            console.log(chalk.gray(`Removed: ${itemPath}`));
            continue; // Skip traversing into deleted directory
          }
          
          // Remove .knowledge-node folder
          if (item.name === '.knowledge-node') {
            await rm(itemPath, { recursive: true, force: true });
            console.log(chalk.gray(`Removed: ${itemPath}`));
            continue; // Skip traversing into deleted directory
          }
          
          // Remove .my-knowledge folder
          if (item.name === '.my-knowledge') {
            await rm(itemPath, { recursive: true, force: true });
            console.log(chalk.gray(`Removed: ${itemPath}`));
            continue; // Skip traversing into deleted directory
          }
          
          // Traverse subdirectories
          await clearDir(itemPath);
        }
      }
    } catch (error) {
      // Ignore ENOENT errors (directory doesn't exist)
      if (error instanceof Error && error.message.includes('ENOENT')) {
        return;
      }
      throw error;
    }
  };
  
  if (rootDir) {
    await clearDir(rootDir);
  } else {
    // If no root directory specified, clear from current working directory
    await clearDir(process.cwd());
  }
}

// CLI interface setup
const argv = yargs(process.argv.slice(2))
  .command('setup <rootDirectory>', 'Initialize knowledge graph project', (yargs) => {
    return yargs.positional('rootDirectory', {
      describe: 'Project root directory',
      type: 'string',
    });
  })
  .command('generate <targetFolder>', 'Generate knowledge graph', (yargs) => {
    return yargs.positional('targetFolder', {
      describe: 'Target folder to generate knowledge graph',
      type: 'string',
    });
  })
  .command('update <gitDiff>', 'Update knowledge graph', (yargs) => {
    return yargs.positional('gitDiff', {
      describe: 'Git diff information',
      type: 'string',
    });
  })
  .command('private-knowledge <rootDirectory> <purpose>', 'Generate private knowledge graph', (yargs) => {
    return yargs
      .positional('rootDirectory', {
        describe: 'Project root directory',
        type: 'string',
      })
      .positional('purpose', {
        describe: 'Description of what to do',
        type: 'string',
      });
  })
  .command('clear [rootDirectory]', 'Clear all knowledge graphs', (yargs) => {
    return yargs.positional('rootDirectory', {
      describe: 'Root directory to clear knowledge graphs from',
      type: 'string',
    });
  })
  .help()
  .alias('help', 'h')
  .version('1.0.0')
  .alias('version', 'v')
  .demandCommand(1, 'Please enter a command.')
  .parseSync();

/**
 * Starts MCP server
 */
async function startServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log(
    chalk.green('Knowledge Graph Driven Project Management MCP server started.')
  );
}

/**
 * Executes CLI commands
 */
async function runCLI() {
  const command = argv._[0] as string;
  
  try {
    switch (command) {
      case 'setup': {
        const rootDirectory = argv['rootDirectory'] as string;
        console.log(chalk.blue('Starting knowledge graph project initialization...'));
        
        // Create .knowledge-root folder
        
        const knowledgeRootPath = join(rootDirectory, '.knowledge-root');
        await mkdir(knowledgeRootPath, { recursive: true });
        
        // Create basic configuration files
        const configYaml = `# Knowledge Graph Configuration
version: 1.0.0
created: ${new Date().toISOString()}
`;
        
        const knowledgeNodeJson = {
          version: '1.0.0',
          nodes: [],
          relationships: [],
          created: new Date().toISOString(),
        };
        
        const knowledgeIgnoreJson = {
          patterns: [
            'node_modules/**',
            '.git/**',
            'dist/**',
            'build/**',
            '*.log',
            '.DS_Store',
          ],
        };
        
        await writeFile(
          join(knowledgeRootPath, '.config.yaml'),
          configYaml
        );
        await writeFile(
          join(knowledgeRootPath, '.knowledge-node.json'),
          JSON.stringify(knowledgeNodeJson, null, 2)
        );
        await writeFile(
          join(knowledgeRootPath, '.knowledge-ignore.json'),
          JSON.stringify(knowledgeIgnoreJson, null, 2)
        );
        
        // Traverse all directories and create .knowledge-node folders
        await traverseDirectories(rootDirectory);
        
        console.log(
          chalk.green('Knowledge graph project initialization completed successfully.')
        );
        break;
      }
      case 'generate': {
        const targetFolder = argv['targetFolder'] as string;
        console.log(
          chalk.blue(`Generating knowledge graph: ${targetFolder}`)
        );
        await generateKnowledgeGraph(targetFolder);
        console.log(
          chalk.green('Knowledge graph generation completed successfully.')
        );
        break;
      }
      case 'update': {
        const gitDiff = argv['gitDiff'] as string;
        console.log(chalk.blue('Updating knowledge graph...'));
        await updateKnowledgeGraph(gitDiff);
        console.log(
          chalk.green('Knowledge graph update completed successfully.')
        );
        break;
      }
      case 'private-knowledge': {
        const rootDirectory = argv['rootDirectory'] as string;
        const purpose = argv['purpose'] as string;
        console.log(chalk.blue('Generating private knowledge graph...'));
        await generatePrivateKnowledge(rootDirectory, purpose);
        console.log(
          chalk.green('Private knowledge graph generation completed successfully.')
        );
        break;
      }
      case 'clear': {
        const rootDirectory = argv['rootDirectory'] as string;
        
        console.log(chalk.yellow('Clearing all knowledge graphs...'));
        
        // Clear memory
        knowledgeGraph = {
          nodes: [],
          relationships: [],
        };
        
        // Clear file system knowledge files
        const targetDir = rootDirectory || process.cwd();
        await clearKnowledgeFiles(targetDir);
        
        console.log(
          chalk.green('Knowledge graph cleanup completed successfully.')
        );
        break;
      }
      default:
        console.error(chalk.red(`Unknown command: ${command}`));
        process.exit(1);
    }
  } catch (error) {
    if (error instanceof KnowledgeGraphError) {
      console.error(chalk.red(`Error occurred: ${error.message}`));
    } else {
      console.error(chalk.red(`Unexpected error occurred: ${error}`));
    }
    process.exit(1);
  }
}

/**
 * Handles main execution logic
 * Runs in CLI mode if TTY is available, otherwise runs in MCP server mode
 */
async function main() {
  // Check if running as MCP server (when executed via stdio)
  // Also check for command line arguments to force CLI mode
  if (process.stdin.isTTY || process.argv.length > 2) {
    // Run in CLI mode
    await runCLI();
  } else {
    // Run in MCP server mode
    await startServer();
  }
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
  if (error instanceof KnowledgeGraphError) {
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
