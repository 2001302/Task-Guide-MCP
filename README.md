# Knowledge Graph Driven Project Management MCP

A Model Context Protocol (MCP) server that generates knowledge graphs from source code files to enable AI-driven project management and code understanding.

## Features

- **Setup**: Initialize knowledge graph project structure
- **Generate**: Create knowledge graphs from source code files
- **Update**: Update knowledge graphs based on Git changes
- **Clear**: Remove all knowledge graph files
- **Private Knowledge**: Generate private knowledge graphs

## Installation

```bash
npm install
npm run build
```

## Usage

### CLI Commands

```bash
# Setup knowledge graph project
node dist/index.js setup <rootDirectory>

# Generate knowledge graph from source files
node dist/index.js generate <targetFolder>

# Update knowledge graph based on Git diff
node dist/index.js update <gitDiff>

# Clear all knowledge graphs
node dist/index.js clear [rootDirectory]

# Generate private knowledge graph
node dist/index.js private-knowledge <rootDirectory> <purpose>
```

### NPM Scripts

#### Testing Commands

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only

# Run specific functionality tests
npm run test:setup         # Test setup functionality
npm run test:generate      # Test generate functionality
npm run test:clear         # Test clear functionality
```

#### Demo Commands

```bash
# Create test project
npm run test:create

# Clean up test project
npm run test:cleanup

# Setup test project
npm run test:setup

# Generate knowledge graph for test project
npm run test:generate

# Clear test project knowledge graphs
npm run test:clear

# Run complete test workflow
npm run test:full
```

## test Project

The test project includes:
- TypeScript source files with classes, functions, and interfaces
- Import/export relationships
- Test files
- Documentation

Run `npm run test:full` to see the complete workflow in action.

## Knowledge Graph Structure

The generated knowledge graphs include:

### Entities
- **source_file**: Source code files
- **function**: Functions, classes, and methods
- **import**: Import statements and dependencies

### Relationships
- **imports**: File-to-file import relationships
- **contains**: File-to-function containment relationships

### Data Structure
```typescript
interface KnowledgeNode {
  name: string;           // Unique identifier
  entityType: string;     // Type of entity
  observations: string[]; // Array of observations
  createdAt: string;      // Creation timestamp
  version: number;        // Version number
  metadata?: Record<string, any>;
}

interface KnowledgeRelationship {
  from: string;           // Source entity name
  to: string;             // Target entity name
  relationType: string;   // Type of relationship
  createdAt: string;      // Creation timestamp
  version: number;        // Version number
  metadata?: Record<string, any>;
}
```

## Supported File Types

- TypeScript (.ts, .tsx)
- JavaScript (.js, .jsx)
- Python (.py)
- Java (.java)
- C/C++ (.c, .cpp, .h, .hpp)
- C# (.cs)
- PHP (.php)
- Ruby (.rb)
- Go (.go)
- Rust (.rs)
- Swift (.swift)
- Kotlin (.kt)
- Scala (.scala)
- Vue (.vue)
- Svelte (.svelte)
- Dart (.dart)
- R (.r)
- Julia (.jl)
- Shell scripts (.sh, .bash, .zsh, .fish)
- SQL (.sql)
- HTML (.html)
- CSS (.css, .scss, .sass, .less)
- XML (.xml)
- JSON (.json)
- YAML (.yaml, .yml)

## Development

```bash
# Build the project
npm run build

# Run in development mode
npm run dev

# Watch for changes
npm run watch

# Clean build directory
npm run clean
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test suites
npm run test:unit
npm run test:integration
```

## License

MIT
