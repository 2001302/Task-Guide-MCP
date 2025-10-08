import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';
import { HierarchicalNode, MetadataVector } from '../types/index.js';

export class HierarchicalRAG {
  private nodes: Map<string, HierarchicalNode> = new Map();
  private embeddings: Map<string, number[]> = new Map();

  constructor() {
    this.nodes = new Map();
    this.embeddings = new Map();
  }

  async buildHierarchy(rootPath: string): Promise<void> {
    console.log(`Building hierarchical structure: ${rootPath}`);
    
    // Scan directory structure
    await this.scanDirectory(rootPath, null);
    
    // Analyze file contents
    await this.analyzeFiles();
    
    // Set hierarchical relationships
    this.buildRelationships();
    
    console.log(`Hierarchical structure built: ${this.nodes.size} nodes`);
  }

  private async scanDirectory(dirPath: string, parentId: string | null): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const nodeId = this.generateNodeId(fullPath);
        
        if (entry.isDirectory()) {
          // Create directory node
          const node: HierarchicalNode = {
            id: nodeId,
            type: 'directory',
            name: entry.name,
            path: fullPath,
            parentId: parentId || undefined,
            children: [],
            metadata: {
              size: await this.getDirectorySize(fullPath),
            },
          };
          
          this.nodes.set(nodeId, node);
          
          // Scan subdirectories
          await this.scanDirectory(fullPath, nodeId);
        } else if (this.isCodeFile(entry.name)) {
          // Create file node
          const node: HierarchicalNode = {
            id: nodeId,
            type: 'file',
            name: entry.name,
            path: fullPath,
            parentId: parentId || undefined,
            children: [],
            metadata: {
              size: (await fs.stat(fullPath)).size,
              language: this.getLanguage(entry.name),
            },
          };
          
          this.nodes.set(nodeId, node);
        }
      }
    } catch (error) {
      console.error(`Failed to scan directory: ${dirPath}`, error);
    }
  }

  private async analyzeFiles(): Promise<void> {
    for (const [nodeId, node] of this.nodes) {
      if (node.type === 'file') {
        try {
          const content = await fs.readFile(node.path, 'utf-8');
          node.content = content;
          
          // Extract functions, classes, interfaces
          const codeElements = this.extractCodeElements(content, node.metadata.language);
          
          for (const element of codeElements) {
            const elementId = `${nodeId}_${element.name}`;
            const elementNode: HierarchicalNode = {
              id: elementId,
              type: element.type as any,
              name: element.name,
              path: node.path,
              parentId: nodeId,
              children: [],
              content: element.content,
              metadata: {
                language: node.metadata.language,
                complexity: this.calculateComplexity(element.content),
                dependencies: this.extractDependencies(element.content),
              },
            };
            
            this.nodes.set(elementId, elementNode);
          }
        } catch (error) {
          console.error(`Failed to analyze file: ${node.path}`, error);
        }
      }
    }
  }

  private buildRelationships(): void {
    for (const [nodeId, node] of this.nodes) {
      if (node.parentId) {
        const parent = this.nodes.get(node.parentId);
        if (parent) {
          parent.children.push(nodeId);
        }
      }
    }
  }

  private extractCodeElements(content: string, language?: string): Array<{
    name: string;
    type: string;
    content: string;
  }> {
    const elements: Array<{ name: string; type: string; content: string }> = [];
    
    if (language === 'typescript' || language === 'javascript') {
      // Extract TypeScript/JavaScript functions, classes, interfaces
      const functionRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\([^)]*\)\s*\{[^}]*\}/g;
      const classRegex = /(?:export\s+)?class\s+(\w+)(?:\s+extends\s+\w+)?\s*\{[^}]*\}/g;
      const interfaceRegex = /(?:export\s+)?interface\s+(\w+)\s*\{[^}]*\}/g;
      
      let match;
      
      // Extract functions
      while ((match = functionRegex.exec(content)) !== null) {
        elements.push({
          name: match[1],
          type: 'function',
          content: match[0],
        });
      }
      
      // Extract classes
      while ((match = classRegex.exec(content)) !== null) {
        elements.push({
          name: match[1],
          type: 'class',
          content: match[0],
        });
      }
      
      // Extract interfaces
      while ((match = interfaceRegex.exec(content)) !== null) {
        elements.push({
          name: match[1],
          type: 'interface',
          content: match[0],
        });
      }
    }
    
    return elements;
  }

  private calculateComplexity(content: string): number {
    // Simple complexity calculation (based on cyclomatic complexity)
    const complexityKeywords = ['if', 'else', 'for', 'while', 'switch', 'case', 'catch', '&&', '||'];
    let complexity = 1;
    
    for (const keyword of complexityKeywords) {
      const matches = content.match(new RegExp(`\\b${keyword}\\b`, 'g'));
      if (matches) {
        complexity += matches.length;
      }
    }
    
    return complexity;
  }

  private extractDependencies(content: string): string[] {
    const dependencies: string[] = [];
    
    // Extract import statements
    const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      dependencies.push(match[1]);
    }
    
    return dependencies;
  }

  private isCodeFile(filename: string): boolean {
    const codeExtensions = ['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.cpp', '.c', '.cs', '.go', '.rs', '.php', '.rb'];
    return codeExtensions.some(ext => filename.endsWith(ext));
  }

  private getLanguage(filename: string): string {
    const extension = path.extname(filename);
    const languageMap: Record<string, string> = {
      '.ts': 'typescript',
      '.js': 'javascript',
      '.tsx': 'typescript',
      '.jsx': 'javascript',
      '.py': 'python',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.cs': 'csharp',
      '.go': 'go',
      '.rs': 'rust',
      '.php': 'php',
      '.rb': 'ruby',
    };
    
    return languageMap[extension] || 'unknown';
  }

  private async getDirectorySize(dirPath: string): Promise<number> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      let size = 0;
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          size += await this.getDirectorySize(fullPath);
        } else {
          const stats = await fs.stat(fullPath);
          size += stats.size;
        }
      }
      
      return size;
    } catch (error) {
      return 0;
    }
  }

  private generateNodeId(path: string): string {
    return Buffer.from(path).toString('base64').replace(/[+/=]/g, '');
  }

  // Hierarchical search method
  async searchHierarchical(query: string, startLevel: 'directory' | 'file' | 'function' | 'class' = 'directory'): Promise<HierarchicalNode[]> {
    const results: HierarchicalNode[] = [];
    const queryLower = query.toLowerCase();
    
    for (const [nodeId, node] of this.nodes) {
      if (node.type === startLevel) {
        if (this.matchesQuery(node, queryLower)) {
          results.push(node);
        }
      }
    }
    
    return results.sort((a, b) => this.calculateRelevanceScore(b, queryLower) - this.calculateRelevanceScore(a, queryLower));
  }

  private matchesQuery(node: HierarchicalNode, query: string): boolean {
    return (
      node.name.toLowerCase().includes(query) ||
      (node.content && node.content.toLowerCase().includes(query)) ||
      node.path.toLowerCase().includes(query)
    );
  }

  private calculateRelevanceScore(node: HierarchicalNode, query: string): number {
    let score = 0;
    
    if (node.name.toLowerCase().includes(query)) score += 10;
    if (node.path.toLowerCase().includes(query)) score += 5;
    if (node.content && node.content.toLowerCase().includes(query)) score += 3;
    
    return score;
  }

  getNode(id: string): HierarchicalNode | undefined {
    return this.nodes.get(id);
  }

  getChildren(nodeId: string): HierarchicalNode[] {
    const node = this.nodes.get(nodeId);
    if (!node) return [];
    
    return node.children.map(childId => this.nodes.get(childId)).filter(Boolean) as HierarchicalNode[];
  }

  getParent(nodeId: string): HierarchicalNode | undefined {
    const node = this.nodes.get(nodeId);
    if (!node || !node.parentId) return undefined;
    
    return this.nodes.get(node.parentId);
  }

  getAllNodes(): HierarchicalNode[] {
    return Array.from(this.nodes.values());
  }
}
