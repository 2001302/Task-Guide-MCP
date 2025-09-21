import * as fs from 'fs';
import * as path from 'path';

/**
 * Knowledge Tree Implementation
 * A tree structure for representing hierarchical knowledge and providing AI context
 */

/**
 * Structure of .knowledge-node.json file
 */
export interface KnowledgeNodeFile {
  purpose: string; // Purpose of the current node
  currentDirectorySummary: string; // Summary information about files in the current directory
  childSummaries: string[]; // Summary information of child directories' .knowledge-node.json files
  metadata?: {
    createdAt: string;
    updatedAt: string;
    directoryPath: string;
    fileCount: number;
    subdirectoryCount: number;
  };
}

export interface KnowledgeTreeNodeData {
  name: string;
  entityType: string;
  observations: string[];
  metadata?: Record<string, any>;
  path: string; // 파일/폴더 경로
}

export class KnowledgeTreeNode {
  public parent: KnowledgeTreeNode | null = null;
  public children: KnowledgeTreeNode[] = [];
  public data: KnowledgeTreeNodeData;
  public summary: string = '';
  public childSummaries: string = '';

  constructor(data: KnowledgeTreeNodeData) {
    this.data = data;
  }

  /**
   * Add child node
   */
  addChild(child: KnowledgeTreeNode): void {
    child.parent = this;
    this.children.push(child);
    this.updateChildSummaries();
  }

  /**
   * Remove child node
   */
  removeChild(child: KnowledgeTreeNode): void {
    const index = this.children.indexOf(child);
    if (index > -1) {
      this.children.splice(index, 1);
      child.parent = null;
      this.updateChildSummaries();
    }
  }

  /**
   * Generate summary information for the node
   */
  generateSummary(): string {
    const { name, entityType, observations, path } = this.data;
    
    let summary = `# ${name}\n`;
    summary += `**Type:** ${entityType}\n`;
    summary += `**Path:** ${path}\n\n`;
    
    if (observations.length > 0) {
      summary += `**Key Information:**\n`;
      observations.forEach(obs => {
        summary += `- ${obs}\n`;
      });
      summary += '\n';
    }

    // Include metadata if available
    if (this.data.metadata) {
      summary += `**Metadata:**\n`;
      Object.entries(this.data.metadata).forEach(([key, value]) => {
        summary += `- ${key}: ${value}\n`;
      });
      summary += '\n';
    }

    return summary;
  }

  /**
   * Update summary information of child nodes
   */
  private updateChildSummaries(): void {
    if (this.children.length === 0) {
      this.childSummaries = '';
      return;
    }

    this.childSummaries = `**Child Nodes (${this.children.length}):**\n`;
    this.children.forEach((child, index) => {
      this.childSummaries += `${index + 1}. **${child.data.name}** (${child.data.entityType})\n`;
      this.childSummaries += `   - Path: ${child.data.path}\n`;
      
      // Include only some key observations from children (to avoid being too long)
      const keyObservations = child.data.observations.slice(0, 2);
      if (keyObservations.length > 0) {
        this.childSummaries += `   - Key Info: ${keyObservations.join(', ')}\n`;
      }
      this.childSummaries += '\n';
    });
  }

  /**
   * Generate complete information for AI context
   */
  getAIContext(): string {
    let context = this.generateSummary();
    
    if (this.childSummaries) {
      context += this.childSummaries;
    }

    // Include parent node information (upper context)
    if (this.parent) {
      context += `**Parent Context:**\n`;
      context += `- Parent: ${this.parent.data.name} (${this.parent.data.entityType})\n`;
      context += `- Parent Path: ${this.parent.data.path}\n\n`;
    }

    return context;
  }

  /**
   * Generate subtree information up to a specific depth
   */
  getSubtreeContext(maxDepth: number = 2): string {
    let context = this.getAIContext();
    
    if (maxDepth > 1 && this.children.length > 0) {
      context += `**Detailed Child Information:**\n`;
      this.children.forEach(child => {
        context += child.getSubtreeContext(maxDepth - 1);
        context += '\n---\n\n';
      });
    }

    return context;
  }

  /**
   * Full path of the node (from root to current)
   */
  getFullPath(): string {
    const path: string[] = [];
    let current: KnowledgeTreeNode | null = this;
    
    while (current) {
      path.unshift(current.data.name);
      current = current.parent;
    }
    
    return path.join(' > ');
  }

  /**
   * Filter only child nodes of a specific type
   */
  getChildrenByType(entityType: string): KnowledgeTreeNode[] {
    return this.children.filter(child => child.data.entityType === entityType);
  }

  /**
   * Depth of the node (distance from root)
   */
  getDepth(): number {
    let depth = 0;
    let current: KnowledgeTreeNode | null = this.parent;
    
    while (current) {
      depth++;
      current = current.parent;
    }
    
    return depth;
  }

  /**
   * Check if the node is a leaf node
   */
  isLeaf(): boolean {
    return this.children.length === 0;
  }

  /**
   * Check if the node is a root node
   */
  isRoot(): boolean {
    return this.parent === null;
  }
}

export class KnowledgeTree {
  public root: KnowledgeTreeNode | null = null;
  private nodeMap: Map<string, KnowledgeTreeNode> = new Map();

  constructor(rootData?: KnowledgeTreeNodeData) {
    if (rootData) {
      this.root = new KnowledgeTreeNode(rootData);
      this.nodeMap.set(rootData.name, this.root);
    }
  }

  /**
   * Add node
   */
  addNode(data: KnowledgeTreeNodeData, parentName?: string): KnowledgeTreeNode {
    const newNode = new KnowledgeTreeNode(data);
    this.nodeMap.set(data.name, newNode);

    if (!parentName) {
      // Set root node
      if (this.root) {
        throw new Error('Root node already exists. Specify a parent name.');
      }
      this.root = newNode;
    } else {
      // Find parent node and add
      const parent = this.nodeMap.get(parentName);
      if (!parent) {
        throw new Error(`Parent node '${parentName}' not found.`);
      }
      parent.addChild(newNode);
    }

    return newNode;
  }

  /**
   * Find node
   */
  findNode(name: string): KnowledgeTreeNode | undefined {
    return this.nodeMap.get(name);
  }

  /**
   * Find node by specific path
   */
  findNodeByPath(path: string): KnowledgeTreeNode | undefined {
    for (const node of this.nodeMap.values()) {
      if (node.data.path === path) {
        return node;
      }
    }
    return undefined;
  }

  /**
   * Return all nodes
   */
  getAllNodes(): KnowledgeTreeNode[] {
    return Array.from(this.nodeMap.values());
  }

  /**
   * Return all nodes of a specific type
   */
  getNodesByType(entityType: string): KnowledgeTreeNode[] {
    return this.getAllNodes().filter(node => node.data.entityType === entityType);
  }

  /**
   * Output tree structure as string (for debugging)
   */
  toString(indent: string = ''): string {
    if (!this.root) {
      return 'Empty tree';
    }

    let result = '';
    const printNode = (node: KnowledgeTreeNode, currentIndent: string) => {
      result += `${currentIndent}${node.data.name} (${node.data.entityType})\n`;
      node.children.forEach(child => {
        printNode(child, currentIndent + '  ');
      });
    };

    printNode(this.root, indent);
    return result;
  }

  /**
   * Generate AI context for the entire tree
   */
  getFullAIContext(): string {
    if (!this.root) {
      return 'Empty knowledge tree';
    }

    return this.root.getSubtreeContext(3); // Up to 3 levels deep
  }

  /**
   * Generate context only for a specific node
   */
  getContextualAIContext(nodeName: string, includeSiblings: boolean = true): string {
    const node = this.findNode(nodeName);
    if (!node) {
      return `Node '${nodeName}' not found`;
    }

    let context = node.getAIContext();

    // Decide whether to include sibling nodes
    if (includeSiblings && node.parent) {
      const siblings = node.parent.children.filter(child => child !== node);
      if (siblings.length > 0) {
        context += `**Sibling Nodes:**\n`;
        siblings.forEach(sibling => {
          context += `- ${sibling.data.name} (${sibling.data.entityType})\n`;
        });
        context += '\n';
      }
    }

    return context;
  }

  /**
   * Tree size (number of nodes)
   */
  getSize(): number {
    return this.nodeMap.size;
  }

  /**
   * Tree depth
   */
  getMaxDepth(): number {
    if (!this.root) return 0;

    const getDepth = (node: KnowledgeTreeNode): number => {
      if (node.isLeaf()) return 0;
      return 1 + Math.max(...node.children.map(child => getDepth(child)));
    };

    return getDepth(this.root);
  }
}

/**
 * Knowledge Node file management class
 */
export class KnowledgeNodeManager {
  private rootPath: string;

  constructor(rootPath: string) {
    this.rootPath = path.resolve(rootPath);
  }

  /**
   * Analyze files in directory and generate summary information
   */
  private analyzeDirectory(dirPath: string): { fileCount: number; subdirectoryCount: number; summary: string } {
    const files = fs.readdirSync(dirPath, { withFileTypes: true });
    const fileCount = files.filter(f => f.isFile() && f.name !== '.knowledge-node.json').length;
    const subdirectoryCount = files.filter(f => f.isDirectory()).length;

    const fileList = files
      .filter(f => f.isFile() && f.name !== '.knowledge-node.json')
      .map(f => f.name)
      .sort();

    const subdirList = files
      .filter(f => f.isDirectory())
      .map(f => f.name)
      .sort();

    let summary = `This directory contains ${fileCount} files and ${subdirectoryCount} subdirectories.\n\n`;
    
    if (fileList.length > 0) {
      summary += `**File List:**\n${fileList.map(f => `- ${f}`).join('\n')}\n\n`;
    }
    
    if (subdirList.length > 0) {
      summary += `**Subdirectories:**\n${subdirList.map(d => `- ${d}/`).join('\n')}\n\n`;
    }

    return { fileCount, subdirectoryCount, summary };
  }

  /**
   * Create .knowledge-node.json file
   */
  createKnowledgeNode(dirPath: string, purpose: string = ''): void {
    const nodePath = path.join(dirPath, '.knowledge-node.json');
    
    // Skip if file already exists
    if (fs.existsSync(nodePath)) {
      console.log(`Already exists: ${nodePath}`);
      return;
    }

    const analysis = this.analyzeDirectory(dirPath);
    const now = new Date().toISOString();

    const knowledgeNode: KnowledgeNodeFile = {
      purpose: purpose || `Please describe the purpose of directory ${path.basename(dirPath)}`,
      currentDirectorySummary: analysis.summary,
      childSummaries: [],
      metadata: {
        createdAt: now,
        updatedAt: now,
        directoryPath: dirPath,
        fileCount: analysis.fileCount,
        subdirectoryCount: analysis.subdirectoryCount
      }
    };

    fs.writeFileSync(nodePath, JSON.stringify(knowledgeNode, null, 2), 'utf-8');
    console.log(`Created: ${nodePath}`);
  }

  /**
   * Create .knowledge-node.json files in all subdirectories (new command)
   */
  createAllKnowledgeNodes(startPath?: string): void {
    const targetPath = startPath || this.rootPath;
    
    if (!fs.existsSync(targetPath)) {
      throw new Error(`Path does not exist: ${targetPath}`);
    }

    if (!fs.statSync(targetPath).isDirectory()) {
      throw new Error(`Not a directory: ${targetPath}`);
    }

    // Create .knowledge-node.json in current directory
    this.createKnowledgeNode(targetPath);

    // Process subdirectories recursively
    const entries = fs.readdirSync(targetPath, { withFileTypes: true });
    const directories = entries.filter(entry => entry.isDirectory());

    for (const dir of directories) {
      const subPath = path.join(targetPath, dir.name);
      this.createAllKnowledgeNodes(subPath);
    }
  }

  /**
   * Read .knowledge-node.json file
   */
  readKnowledgeNode(dirPath: string): KnowledgeNodeFile | null {
    const nodePath = path.join(dirPath, '.knowledge-node.json');
    
    if (!fs.existsSync(nodePath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(nodePath, 'utf-8');
      return JSON.parse(content) as KnowledgeNodeFile;
    } catch (error) {
      console.error(`Failed to read file: ${nodePath}`, error);
      return null;
    }
  }

  /**
   * Update .knowledge-node.json file
   */
  updateKnowledgeNode(dirPath: string, updates: Partial<KnowledgeNodeFile>): void {
    const nodePath = path.join(dirPath, '.knowledge-node.json');
    const existing = this.readKnowledgeNode(dirPath);
    
    if (!existing) {
      throw new Error(`.knowledge-node.json file does not exist: ${dirPath}`);
    }

    const updated: KnowledgeNodeFile = {
      ...existing,
      ...updates,
      metadata: {
        createdAt: existing.metadata?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        directoryPath: existing.metadata?.directoryPath || nodePath,
        fileCount: existing.metadata?.fileCount || 0,
        subdirectoryCount: existing.metadata?.subdirectoryCount || 0,
        ...updates.metadata
      }
    };

    fs.writeFileSync(nodePath, JSON.stringify(updated, null, 2), 'utf-8');
  }

  /**
   * Fill information from bottom up using BFS (build command)
   */
  buildKnowledgeTree(startPath?: string): void {
    const targetPath = startPath || this.rootPath;
    
    if (!fs.existsSync(targetPath)) {
      throw new Error(`Path does not exist: ${targetPath}`);
    }

    // Queue for BFS and visited nodes
    const queue: string[] = [];
    const visited = new Set<string>();
    const leafNodes: string[] = [];

    // Find leaf nodes by traversing all directories with BFS
    queue.push(targetPath);
    
    while (queue.length > 0) {
      const currentDir = queue.shift()!;
      
      if (visited.has(currentDir)) continue;
      visited.add(currentDir);

      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      const subdirs = entries.filter(entry => entry.isDirectory());
      
      if (subdirs.length === 0) {
        // Leaf node
        leafNodes.push(currentDir);
      } else {
        // Add subdirectories to queue
        for (const subdir of subdirs) {
          const subPath = path.join(currentDir, subdir.name);
          queue.push(subPath);
        }
      }
    }

    console.log(`Found ${leafNodes.length} leaf nodes`);

    // Start from leaf nodes and update information going up to parents
    const processed = new Set<string>();
    
    for (const leafNode of leafNodes) {
      this.processNodeUpward(leafNode, processed);
    }
  }

  /**
   * Update information going up from a specific node to parent
   */
  private processNodeUpward(nodePath: string, processed: Set<string>): void {
    if (processed.has(nodePath)) return;
    
    const node = this.readKnowledgeNode(nodePath);
    if (!node) return;

    // Update current directory analysis
    const analysis = this.analyzeDirectory(nodePath);
    const childSummaries: string[] = [];

    // Collect summary information from subdirectories
    const entries = fs.readdirSync(nodePath, { withFileTypes: true });
    const subdirs = entries.filter(entry => entry.isDirectory());
    
    for (const subdir of subdirs) {
      const subPath = path.join(nodePath, subdir.name);
      const childNode = this.readKnowledgeNode(subPath);
      
      if (childNode) {
        childSummaries.push(`${subdir.name}: ${childNode.purpose}`);
      }
    }

    // Update node information
    this.updateKnowledgeNode(nodePath, {
      currentDirectorySummary: analysis.summary,
      childSummaries,
      metadata: {
        createdAt: node.metadata?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        directoryPath: node.metadata?.directoryPath || nodePath,
        fileCount: analysis.fileCount,
        subdirectoryCount: analysis.subdirectoryCount
      }
    });

    processed.add(nodePath);
    console.log(`Processed: ${nodePath}`);

    // Move to parent directory
    const parentPath = path.dirname(nodePath);
    if (parentPath !== nodePath && fs.existsSync(parentPath)) {
      this.processNodeUpward(parentPath, processed);
    }
  }

  /**
   * Delete .knowledge-node.json file from specific directory
   */
  removeKnowledgeNode(dirPath: string): void {
    const nodePath = path.join(dirPath, '.knowledge-node.json');
    
    if (fs.existsSync(nodePath)) {
      fs.unlinkSync(nodePath);
      console.log(`Deleted: ${nodePath}`);
    }
  }

  /**
   * Delete all .knowledge-node.json files
   */
  removeAllKnowledgeNodes(startPath?: string): void {
    const targetPath = startPath || this.rootPath;
    
    if (!fs.existsSync(targetPath)) {
      throw new Error(`Path does not exist: ${targetPath}`);
    }

    const entries = fs.readdirSync(targetPath, { withFileTypes: true });
    
    // Delete .knowledge-node.json from current directory
    this.removeKnowledgeNode(targetPath);
    
    // Process subdirectories recursively
    const directories = entries.filter(entry => entry.isDirectory());
    for (const dir of directories) {
      const subPath = path.join(targetPath, dir.name);
      this.removeAllKnowledgeNodes(subPath);
    }
  }
}

