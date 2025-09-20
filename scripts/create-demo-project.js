#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const testProjectPath = './test-project';

// Create test project structure
const createTestProject = () => {
  console.log('Creating test project structure...');
  
  // Create directories
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
      console.log(`Created directory: ${dir}`);
    }
  });
  
  // Create source files
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
    console.log(`Created file: ${file.path}`);
  });
  
  console.log('\\nTest project created successfully!');
  console.log('\\nYou can now run:');
  console.log('  npm run test:setup    - Initialize knowledge graph');
  console.log('  npm run test:generate - Generate knowledge graph from source files');
  console.log('  npm run test:clear    - Clear knowledge graph files');
  console.log('  npm run test:full     - Run complete test workflow');
};

// Clean up existing test project
const cleanupTestProject = () => {
  if (fs.existsSync(testProjectPath)) {
    fs.rmSync(testProjectPath, { recursive: true, force: true });
    console.log('Cleaned up existing test project');
  }
};

// Main execution
const command = process.argv[2];

if (command === 'cleanup') {
  cleanupTestProject();
} else {
  cleanupTestProject();
  createTestProject();
}
