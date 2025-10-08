# Task Guide MCP Server

An MCP (Model Context Protocol) server for improving AI Agent task performance. It addresses AI performance degradation issues that occur as projects become larger by providing task area segmentation, hierarchical RAG, and hybrid search capabilities.

## Key Features

### 1. Guidance Management
- **create_guidance**: Creates a new task guidance
- **update_guidance**: Updates an existing guidance
- **list_guidances**: Lists all guidances
- **get_guidance**: Retrieves a specific guidance
- **delete_guidance**: Deletes a guidance

### 2. Hierarchical RAG
- Indexes codebase in hierarchical structure (directory, file, function, class)
- Progressive exploration from high-level concepts to detailed information
- Dynamically combines relevant context based on required abstraction level

### 3. Hybrid Search
- Combines vector (semantic) search with structural indexing
- Relationship-based search through knowledge graphs
- Combines high-precision evidence, code, and decision history

### 4. Indexing and Search
- **index_guidance**: Indexes codebase and documents for a guidance
- **search**: Performs hybrid search
- **build_hierarchy**: Builds codebase hierarchical structure

## Installation and Execution

### 1. Install Dependencies
```bash
npm install
```

### 2. Build
```bash
npm run build
```

### 3. Development Mode
```bash
npm run dev
```

### 4. Production Execution
```bash
npm start
```

## Usage

### MCP Client Configuration
Configure the server in your MCP client as follows:

```json
{
  "mcpServers": {
    "task-guide": {
      "command": "node",
      "args": ["/path/to/task-guide-mcp/dist/index.js"]
    }
  }
}
```

### Guidance Creation Example
```javascript
// Create a new guidance
await mcp.callTool('create_guidance', {
  title: 'React Component Development',
  objective: 'Develop reusable React components',
  technicalConstraints: [
    'Use TypeScript',
    'Use only functional components',
    'Tailwind CSS styling'
  ],
  workRules: [
    'Components follow single responsibility principle',
    'Props defined with interfaces',
    'Storybook documentation required'
  ],
  completionCriteria: [
    'Component functions correctly',
    'No TypeScript errors',
    'Storybook stories completed'
  ],
  tags: ['react', 'typescript', 'component'],
  priority: 'high'
});
```

### Search Example
```javascript
// Hybrid search
const results = await mcp.callTool('search', {
  query: 'React component',
  type: 'code',
  limit: 5,
  threshold: 0.7
});
```

## Project Structure

```
task-guide-mcp/
├── src/
│   ├── types/
│   │   └── index.ts              # Type definitions
│   ├── core/
│   │   ├── guidance-manager.ts   # Guidance management
│   │   ├── hierarchical-rag.ts   # Hierarchical RAG
│   │   └── hybrid-search.ts      # Hybrid search
│   └── index.ts                  # MCP server main
├── guidance/                     # Guidance repository
│   ├── {guidance-id}/
│   │   └── summary.json         # Guidance summary
│   └── metadata/
│       └── {guidance-id}.vec    # Metadata vector
├── data/
│   └── search.db                # Search database
├── package.json
├── tsconfig.json
└── README.md
```

## Technology Stack

- **TypeScript**: Type safety
- **@modelcontextprotocol/sdk**: MCP protocol implementation
- **better-sqlite3**: Vector and structural index storage
- **OpenAI API**: Embedding generation (future implementation)
- **Hierarchical RAG**: Codebase structure analysis
- **Hybrid Search**: Vector + structural search

## License

MIT License
