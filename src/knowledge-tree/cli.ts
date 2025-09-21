#!/usr/bin/env node

import { KnowledgeNodeManager } from './knowledge-tree.js';

/**
 * CLI command processing
 */
export class KnowledgeTreeCLI {
  private manager: KnowledgeNodeManager;

  constructor(rootPath: string = process.cwd()) {
    this.manager = new KnowledgeNodeManager(rootPath);
  }

  /**
   * Execute CLI command
   */
  async run(args: string[]): Promise<void> {
    const command = args[0];

    switch (command) {
      case 'new':
        await this.handleNewCommand(args.slice(1));
        break;
      case 'build':
        await this.handleBuildCommand(args.slice(1));
        break;
      case 'remove':
        await this.handleRemoveCommand(args.slice(1));
        break;
      case 'show':
        await this.handleShowCommand(args.slice(1));
        break;
      case 'sample':
        await this.handleSampleCommand(args.slice(1));
        break;
      case 'help':
        this.showHelp();
        break;
      default:
        console.error(`Unknown command: ${command}`);
        this.showHelp();
        process.exit(1);
    }
  }

  /**
   * Handle new command - create .knowledge-node.json in all directories
   */
  private async handleNewCommand(args: string[]): Promise<void> {
    const targetPath = args[0] || process.cwd();
    
    try {
      console.log(`Creating .knowledge-node.json files in ${targetPath}...`);
      this.manager.createAllKnowledgeNodes(targetPath);
      console.log('All .knowledge-node.json files have been created.');
    } catch (error) {
      console.error('Error occurred:', error);
      process.exit(1);
    }
  }

  /**
   * Handle build command - fill information from bottom up using BFS
   */
  private async handleBuildCommand(args: string[]): Promise<void> {
    const targetPath = args[0] || process.cwd();
    
    try {
      console.log(`Building knowledge tree in ${targetPath}...`);
      this.manager.buildKnowledgeTree(targetPath);
      console.log('Knowledge tree construction completed.');
    } catch (error) {
      console.error('Error occurred:', error);
      process.exit(1);
    }
  }

  /**
   * Handle remove command - delete .knowledge-node.json files
   */
  private async handleRemoveCommand(args: string[]): Promise<void> {
    const targetPath = args[0] || process.cwd();
    
    try {
      console.log(`Deleting .knowledge-node.json files in ${targetPath}...`);
      this.manager.removeAllKnowledgeNodes(targetPath);
      console.log('All .knowledge-node.json files have been deleted.');
    } catch (error) {
      console.error('Error occurred:', error);
      process.exit(1);
    }
  }

  /**
   * Handle show command - display .knowledge-node.json content of specific directory
   */
  private async handleShowCommand(args: string[]): Promise<void> {
    const targetPath = args[0] || process.cwd();
    
    try {
      const node = this.manager.readKnowledgeNode(targetPath);
      if (!node) {
        console.log(`No .knowledge-node.json file found in ${targetPath}.`);
        return;
      }

      console.log(`${targetPath}/.knowledge-node.json content:`);
      console.log(JSON.stringify(node, null, 2));
    } catch (error) {
      console.error('Error occurred:', error);
      process.exit(1);
    }
  }

  /**
   * Handle sample command - create sample project for testing
   */
  private async handleSampleCommand(args: string[]): Promise<void> {
    const targetPath = args[0] || './sample-project';
    
    try {
      console.log(`Creating sample project in ${targetPath}...`);
      
      // Create sample project structure
      this.createSampleProject(targetPath);
      
      console.log('Sample project created successfully.');
      console.log(`You can now test other commands in the ${targetPath} directory.`);
      console.log('Example commands:');
      console.log(`  knowledge-tree new ${targetPath}`);
      console.log(`  knowledge-tree build ${targetPath}`);
      console.log(`  knowledge-tree show ${targetPath}`);
    } catch (error) {
      console.error('Error occurred:', error);
      process.exit(1);
    }
  }

  /**
   * Create sample project structure
   */
  private createSampleProject(basePath: string): void {
    const fs = require('fs');
    const path = require('path');
    
    // Create main directories
    const dirs = [
      'src',
      'src/components',
      'src/utils',
      'src/types',
      'docs',
      'tests',
      'tests/unit',
      'tests/integration',
      'config',
      'scripts'
    ];
    
    // Create directories
    for (const dir of dirs) {
      const fullPath = path.join(basePath, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`Created directory: ${fullPath}`);
      }
    }
    
    // Create sample files
    const files = [
      { path: 'package.json', content: `{
  "name": "sample-project",
  "version": "1.0.0",
  "description": "A sample project for testing knowledge tree commands",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "test": "jest",
    "build": "tsc"
  },
  "dependencies": {
    "express": "^4.18.0"
  },
  "devDependencies": {
    "typescript": "^4.9.0",
    "jest": "^29.0.0"
  }
}` },
      { path: 'README.md', content: `# Sample Project

This is a sample project created for testing knowledge tree commands.

## Structure

- \`src/\` - Source code
- \`docs/\` - Documentation
- \`tests/\` - Test files
- \`config/\` - Configuration files
- \`scripts/\` - Build and utility scripts

## Usage

This project demonstrates a typical Node.js project structure that can be used to test the knowledge tree functionality.` },
      { path: 'src/index.js', content: `// Main entry point
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello from Sample Project!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});` },
      { path: 'src/components/Button.js', content: `// Button component
class Button {
  constructor(text, onClick) {
    this.text = text;
    this.onClick = onClick;
  }
  
  render() {
    return \`<button onclick="\${this.onClick}">\${this.text}</button>\`;
  }
}

module.exports = Button;` },
      { path: 'src/utils/helpers.js', content: `// Utility functions
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = {
  formatDate,
  capitalize
};` },
      { path: 'src/types/index.js', content: `// Type definitions
const User = {
  id: 'string',
  name: 'string',
  email: 'string',
  createdAt: 'Date'
};

const Product = {
  id: 'string',
  name: 'string',
  price: 'number',
  category: 'string'
};

module.exports = {
  User,
  Product
};` },
      { path: 'docs/api.md', content: `# API Documentation

## Endpoints

### GET /
Returns a welcome message.

### GET /api/users
Returns list of users.

### POST /api/users
Creates a new user.` },
      { path: 'tests/unit/helpers.test.js', content: `// Unit tests for helpers
const { formatDate, capitalize } = require('../../src/utils/helpers');

describe('Helpers', () => {
  test('formatDate formats date correctly', () => {
    const date = new Date('2023-12-01');
    expect(formatDate(date)).toBe('2023-12-01');
  });
  
  test('capitalize capitalizes first letter', () => {
    expect(capitalize('hello')).toBe('Hello');
  });
});` },
      { path: 'config/database.js', content: `// Database configuration
const config = {
  development: {
    host: 'localhost',
    port: 5432,
    database: 'sample_dev'
  },
  production: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
  }
};

module.exports = config;` },
      { path: 'scripts/build.js', content: `// Build script
const fs = require('fs');
const path = require('path');

console.log('Building project...');

// Build logic would go here
console.log('Build completed!');` }
    ];
    
    // Create files
    for (const file of files) {
      const fullPath = path.join(basePath, file.path);
      const dir = path.dirname(fullPath);
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(fullPath, file.content);
      console.log(`Created file: ${fullPath}`);
    }
  }

  /**
   * Show help
   */
  private showHelp(): void {
    console.log(`
Knowledge Tree CLI

Usage: knowledge-tree <command> [options]

Commands:
  new [path]     Create .knowledge-node.json files in all subdirectories 
                 of the specified path (default: current directory).

  build [path]   Fill information from bottom up using BFS in the specified 
                 path (default: current directory), starting from leaf nodes 
                 and going up to parents.

  remove [path]  Delete all .knowledge-node.json files in the specified 
                 path (default: current directory).

  show [path]    Display the content of .knowledge-node.json file in the 
                 specified path (default: current directory).

  sample [path]  Create a sample project structure for testing other commands
                 in the specified path (default: ./sample-project).

  help           Show this help message.

Examples:
  node dist/knowledge-tree/cli.js sample                # Create sample project in ./sample-project
  node dist/knowledge-tree/cli.js sample ./my-test      # Create sample project in ./my-test
  node dist/knowledge-tree/cli.js new                   # Start from current directory
  node dist/knowledge-tree/cli.js new ./src             # Start from src directory
  node dist/knowledge-tree/cli.js build                 # Build in current directory
  node dist/knowledge-tree/cli.js show ./docs           # Show content of docs directory
  node dist/knowledge-tree/cli.js remove                # Delete all .knowledge-node.json files
`);
  }
}

// CLI execution (when this file is run directly)
if (require.main === module) {
  const cli = new KnowledgeTreeCLI();
  cli.run(process.argv.slice(2)).catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}
