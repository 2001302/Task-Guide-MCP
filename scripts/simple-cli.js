#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { readFile, writeFile, mkdir, readdir, rm } = require('fs/promises');
const { join } = require('path');

// MCP 서버의 함수들을 직접 구현 (간소화된 버전)
class SimpleKnowledgeGraphCLI {
  constructor() {
    this.projectRoot = process.cwd();
  }

  // Setup 명령 - 지식 그래프 프로젝트 초기화
  async setup(rootDirectory = this.projectRoot) {
    console.log('📋 Setting up knowledge graph project...');
    
    try {
      // .knowledge-root 폴더 생성
      const knowledgeRootPath = join(rootDirectory, '.knowledge-root');
      await mkdir(knowledgeRootPath, { recursive: true });

      // 기본 설정 파일들 생성
      const configYaml = `# Knowledge Graph Configuration
version: 1.0.0
project: ${path.basename(rootDirectory)}
created: ${new Date().toISOString()}`;

      const knowledgeNodeJson = {
        version: '1.0.0',
        nodes: [],
        relationships: [],
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

      await writeFile(join(knowledgeRootPath, '.config.yaml'), configYaml);
      await writeFile(
        join(knowledgeRootPath, '.knowledge-node.json'),
        JSON.stringify(knowledgeNodeJson, null, 2)
      );
      await writeFile(
        join(knowledgeRootPath, '.knowledge-ignore.json'),
        JSON.stringify(knowledgeIgnoreJson, null, 2)
      );

      // 모든 디렉토리를 순회하며 .knowledge-node 폴더 생성
      await this.traverseDirectories(rootDirectory);

      console.log('✅ Knowledge graph project setup completed successfully');
      console.log(`📁 Root directory: ${rootDirectory}`);
      console.log(`⚙️  Configuration: ${knowledgeRootPath}`);
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      throw error;
    }
  }

  // Generate 명령 - 지식 그래프 생성
  async generate(targetFolder = this.projectRoot) {
    console.log('🔍 Generating knowledge graph...');
    
    try {
      const sourceFiles = await this.findSourceFiles(targetFolder);
      console.log(`📄 Found ${sourceFiles.length} source files`);

      if (sourceFiles.length === 0) {
        console.log('⚠️  No source files found to process');
        return;
      }

      // 지식 그래프 생성
      const knowledgeGraph = await this.createKnowledgeGraphFromFiles(sourceFiles, targetFolder);
      
      // 지식 그래프 저장
      await this.saveKnowledgeGraph(targetFolder, knowledgeGraph);

      console.log(`✅ Knowledge graph generated successfully`);
      console.log(`📊 Nodes: ${knowledgeGraph.nodes.length}, Relationships: ${knowledgeGraph.relationships.length}`);
    } catch (error) {
      console.error('❌ Generate failed:', error.message);
      throw error;
    }
  }

  // Clear 명령 - 지식 그래프 파일들 삭제
  async clear(rootDirectory = this.projectRoot) {
    console.log('🧹 Clearing knowledge graph files...');
    
    try {
      await this.clearKnowledgeFiles(rootDirectory);
      console.log('✅ Knowledge graph files cleared successfully');
    } catch (error) {
      console.error('❌ Clear failed:', error.message);
      throw error;
    }
  }

  // Create 명령 - 테스트 프로젝트 생성
  async create(testProjectPath = './test-project') {
    console.log('🏗️  Creating test project structure...');
    
    try {
      // 기존 테스트 프로젝트 정리
      if (fs.existsSync(testProjectPath)) {
        fs.rmSync(testProjectPath, { recursive: true, force: true });
        console.log('🧹 Cleaned up existing test project');
      }

      // 디렉토리 생성
      const dirs = [
        'src',
        'src/components',
        'src/utils',
        'src/api',
        'tests',
        'docs'
      ];
      
      dirs.forEach(dir => {
        const fullPath = path.join(testProjectPath, dir);
        if (!fs.existsSync(fullPath)) {
          fs.mkdirSync(fullPath, { recursive: true });
          console.log(`📁 Created directory: ${dir}`);
        }
      });

      // 소스 파일들 생성
      const files = [
        {
          path: 'src/index.ts',
          content: `import { Calculator } from './components/Calculator';
import { utils } from './utils/helper';
import { ApiClient } from './api/client';

export function main() {
  const calc = new Calculator();
  const result = calc.add(5, 3);
  
  console.log('Result:', result);
  console.log('Utils:', utils.format(result));
  
  const api = new ApiClient();
  api.fetchData();
}

export { Calculator } from './components/Calculator';
`
        },
        {
          path: 'src/components/Calculator.ts',
          content: `export class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }
  
  subtract(a: number, b: number): number {
    return a - b;
  }
  
  multiply(a: number, b: number): number {
    return a * b;
  }
  
  divide(a: number, b: number): number {
    if (b === 0) {
      throw new Error('Division by zero');
    }
    return a / b;
  }
}

export interface CalculatorOptions {
  precision?: number;
  rounding?: 'up' | 'down' | 'nearest';
}
`
        },
        {
          path: 'src/utils/helper.ts',
          content: `export function format(number: number): string {
  return number.toFixed(2);
}

export function validateNumber(value: any): boolean {
  return typeof value === 'number' && !isNaN(value);
}

export const utils = {
  format,
  validateNumber,
  constants: {
    PI: Math.PI,
    E: Math.E
  }
};

export type ValidationResult = {
  isValid: boolean;
  error?: string;
};
`
        },
        {
          path: 'src/api/client.ts',
          content: `import { ApiResponse } from './types';

export class ApiClient {
  private baseUrl: string;
  
  constructor(baseUrl: string = 'https://api.example.com') {
    this.baseUrl = baseUrl;
  }
  
  async fetchData(): Promise<ApiResponse> {
    try {
      const response = await fetch(\`\${this.baseUrl}/data\`);
      return await response.json();
    } catch (error) {
      throw new Error(\`API Error: \${error.message}\`);
    }
  }
  
  async postData(data: any): Promise<ApiResponse> {
    const response = await fetch(\`\${this.baseUrl}/data\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    return await response.json();
  }
}
`
        },
        {
          path: 'src/api/types.ts',
          content: `export interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}
`
        },
        {
          path: 'tests/calculator.test.ts',
          content: `import { Calculator } from '../src/components/Calculator';

describe('Calculator', () => {
  let calculator: Calculator;
  
  beforeEach(() => {
    calculator = new Calculator();
  });
  
  test('should add two numbers correctly', () => {
    expect(calculator.add(2, 3)).toBe(5);
  });
  
  test('should subtract two numbers correctly', () => {
    expect(calculator.subtract(5, 3)).toBe(2);
  });
  
  test('should throw error when dividing by zero', () => {
    expect(() => calculator.divide(5, 0)).toThrow('Division by zero');
  });
});
`
        },
        {
          path: 'docs/README.md',
          content: `# Test Project

This is a test project for testing the knowledge graph generation functionality.

## Structure

- \`src/\` - Source code files
- \`src/components/\` - React components or class components
- \`src/utils/\` - Utility functions
- \`src/api/\` - API client and types
- \`tests/\` - Test files
- \`docs/\` - Documentation

## Usage

Run the knowledge graph generation to see how it analyzes this project structure.
`
        }
      ];
      
      files.forEach(file => {
        const fullPath = path.join(testProjectPath, file.path);
        fs.writeFileSync(fullPath, file.content);
        console.log(`📄 Created file: ${file.path}`);
      });
      
      console.log('\\n✅ Test project created successfully!');
      console.log('\\nYou can now run:');
      console.log('  npm run test:setup    - Initialize knowledge graph');
      console.log('  npm run test:generate - Generate knowledge graph from source files');
      console.log('  npm run test:clear    - Clear knowledge graph files');
    } catch (error) {
      console.error('❌ Create failed:', error.message);
      throw error;
    }
  }

  // 소스 파일 찾기
  async findSourceFiles(dirPath) {
    const sourceFiles = [];
    const SOURCE_FILE_EXTENSIONS = [
      '.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.cpp', '.c', '.h', '.hpp',
      '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.scala', '.m', '.mm',
      '.vue', '.svelte', '.dart', '.r', '.jl', '.sh', '.bash', '.zsh', '.fish',
      '.sql', '.html', '.css', '.scss', '.sass', '.less', '.xml', '.json', '.yaml', '.yml'
    ];

    const findFiles = async (currentDir) => {
      try {
        const items = await readdir(currentDir, { withFileTypes: true });

        for (const item of items) {
          if (item.isDirectory() && !item.name.startsWith('.')) {
            const skipDirs = ['node_modules', '.git', 'dist', 'build', '.next', '.nuxt', 'coverage', '.nyc_output', '.cache', '.parcel-cache', '.vscode', '.idea', 'vendor', 'target', 'out', 'bin', 'obj'];
            if (!skipDirs.includes(item.name)) {
              await findFiles(join(currentDir, item.name));
            }
          } else if (item.isFile()) {
            const ext = item.name.substring(item.name.lastIndexOf('.'));
            if (SOURCE_FILE_EXTENSIONS.includes(ext)) {
              sourceFiles.push(join(currentDir, item.name));
            }
          }
        }
      } catch (error) {
        console.warn(`⚠️  Could not read directory ${currentDir}: ${error.message}`);
      }
    };

    await findFiles(dirPath);
    return sourceFiles;
  }

  // 지식 그래프 생성
  async createKnowledgeGraphFromFiles(sourceFiles, dirPath) {
    const nodes = [];
    const relationships = [];

    for (const filePath of sourceFiles) {
      try {
        const content = await readFile(filePath, 'utf-8');
        const relativePath = filePath.replace(dirPath, '').replace(/^[\/\\]/, '');
        const fileName = relativePath.split(/[\/\\]/).pop() || relativePath;
        const extension = filePath.substring(filePath.lastIndexOf('.'));

        // 파일 엔티티 생성
        const fileEntity = {
          name: `file_${relativePath.replace(/[\/\\]/g, '_')}`,
          entityType: 'source_file',
          observations: [
            `File path: ${relativePath}`,
            `File size: ${content.length} characters`,
            `File extension: ${extension}`,
            `Content preview: ${content.substring(0, 200)}...`
          ],
          version: 1,
          metadata: {
            path: relativePath,
            fullPath: filePath,
            size: content.length,
            extension: extension
          }
        };
        nodes.push(fileEntity);

        // import 관계 생성
        const importMatches = content.match(/import\s+.*\s+from\s+['"]([^'"]+)['"]/g);
        if (importMatches) {
          for (const importMatch of importMatches) {
            const importPath = importMatch.match(/['"]([^'"]+)['"]/)?.[1];
            if (importPath) {
              const relationship = {
                from: fileEntity.name,
                to: `import_${importPath.replace(/[\/\\]/g, '_')}`,
                relationType: 'imports',
                version: 1,
                metadata: {
                  importPath: importPath
                }
              };
              relationships.push(relationship);
            }
          }
        }

        // 함수/클래스 엔티티 생성
        const functionMatches = content.match(/(?:function|const|let|var)\s+(\w+)\s*[=\(]/g);
        if (functionMatches) {
          for (const funcMatch of functionMatches) {
            const funcName = funcMatch.match(/(?:function|const|let|var)\s+(\w+)/)?.[1];
            if (funcName) {
              const funcEntity = {
                name: `func_${fileName}_${funcName}`,
                entityType: 'function',
                observations: [
                  `Function name: ${funcName}`,
                  `Defined in file: ${relativePath}`,
                  `File: ${fileName}`
                ],
                version: 1,
                metadata: {
                  functionName: funcName,
                  filePath: relativePath,
                  fileName: fileName
                }
              };
              nodes.push(funcEntity);

              // 파일과 함수 간의 관계 생성
              const fileFuncRelationship = {
                from: fileEntity.name,
                to: funcEntity.name,
                relationType: 'contains',
                version: 1,
                metadata: {
                  relationship: 'file_contains_function'
                }
              };
              relationships.push(fileFuncRelationship);
            }
          }
        }

      } catch (error) {
        console.warn(`⚠️  Could not read file ${filePath}: ${error.message}`);
      }
    }

    return { nodes, relationships };
  }

  // 지식 그래프 저장
  async saveKnowledgeGraph(dirPath, knowledgeGraph) {
    const knowledgeNodePath = join(dirPath, '.knowledge-node');
    await mkdir(knowledgeNodePath, { recursive: true });

    const knowledgeNodeJson = {
      version: '1.0.0',
      nodes: knowledgeGraph.nodes,
      relationships: knowledgeGraph.relationships,
    };

    await writeFile(
      join(knowledgeNodePath, '.knowledge-node.json'),
      JSON.stringify(knowledgeNodeJson, null, 2)
    );
  }

  // 디렉토리 순회
  async traverseDirectories(rootDir) {
    const traverseDir = async (currentDir) => {
      const items = await readdir(currentDir, { withFileTypes: true });

      for (const item of items) {
        if (item.isDirectory() && !item.name.startsWith('.')) {
          const itemPath = join(currentDir, item.name);
          const knowledgeNodePath = join(itemPath, '.knowledge-node');

          // .knowledge-node 폴더 생성
          await mkdir(knowledgeNodePath, { recursive: true });

          // .knowledge-node.json 파일 생성
          const knowledgeNodeJson = {
            version: '1.0.0',
            nodes: [],
            relationships: [],
          };

          await writeFile(
            join(knowledgeNodePath, '.knowledge-node.json'),
            JSON.stringify(knowledgeNodeJson, null, 2)
          );

          // 하위 디렉토리 순회
          await traverseDir(itemPath);
        }
      }
    };

    await traverseDir(rootDir);
  }

  // 지식 그래프 파일들 삭제
  async clearKnowledgeFiles(rootDir) {
    const skipDirs = new Set([
      'node_modules', '.git', 'dist', 'build', '.next', '.nuxt', 'coverage',
      '.nyc_output', '.cache', '.parcel-cache', '.vscode', '.idea', 'vendor',
      'target', 'out', 'bin', 'obj'
    ]);

    const clearDir = async (currentDir) => {
      try {
        const items = await readdir(currentDir, { withFileTypes: true });

        for (const item of items) {
          if (item.isDirectory()) {
            const itemPath = join(currentDir, item.name);

            // 특정 디렉토리 건너뛰기
            if (skipDirs.has(item.name) ||
              (item.name.startsWith('.') &&
                !item.name.startsWith('.knowledge-') &&
                item.name !== '.my-knowledge')) {
              continue;
            }

            // .knowledge-root 폴더 삭제
            if (item.name === '.knowledge-root') {
              await rm(itemPath, { recursive: true, force: true });
              console.log(`🗑️  Removed: ${itemPath}`);
              continue;
            }

            // .knowledge-node 폴더 삭제
            if (item.name === '.knowledge-node') {
              await rm(itemPath, { recursive: true, force: true });
              console.log(`🗑️  Removed: ${itemPath}`);
              continue;
            }

            // .my-knowledge 폴더 삭제
            if (item.name === '.my-knowledge') {
              await rm(itemPath, { recursive: true, force: true });
              console.log(`🗑️  Removed: ${itemPath}`);
              continue;
            }

            // 하위 디렉토리 순회
            await clearDir(itemPath);
          }
        }
      } catch (error) {
        // ENOENT 에러 무시 (디렉토리가 존재하지 않음)
        if (error.message && error.message.includes('ENOENT')) {
          return;
        }
        throw error;
      }
    };

    await clearDir(rootDir);
  }
}

// CLI 인터페이스
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const cli = new SimpleKnowledgeGraphCLI();

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    showHelp();
    return;
  }

  try {
    switch (command) {
      case 'setup':
        await cli.setup(args[1]);
        break;
      case 'generate':
        await cli.generate(args[1]);
        break;
      case 'clear':
        await cli.clear(args[1]);
        break;
      case 'create':
        await cli.create(args[1]);
        break;
      default:
        console.error(`❌ Unknown command: ${command}`);
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// 도움말 출력
function showHelp() {
  console.log(`
📚 Knowledge Graph Driven Project Management CLI

Usage: node scripts/simple-cli.js <command> [options]

Commands:
  setup              - Initialize knowledge graph project
  generate           - Generate knowledge graph from source files
  clear              - Clear all knowledge graph files
  create             - Create test project structure

Examples:
  node scripts/simple-cli.js setup
  node scripts/simple-cli.js generate ./src
  node scripts/simple-cli.js clear
  node scripts/simple-cli.js create

For more information, visit: https://github.com/your-repo
`);
}

// 에러 핸들링
process.on('uncaughtException', (error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Promise rejection:', reason);
  process.exit(1);
});

// CLI 실행
if (require.main === module) {
  main();
}

module.exports = SimpleKnowledgeGraphCLI;