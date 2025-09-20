// Jest setup file
import { existsSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';

// 테스트용 임시 디렉토리 경로
export const TEST_DIR = join(__dirname, 'fixtures', 'test-project');

// 테스트 전후 정리 함수들
export const setupTestDir = () => {
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true, force: true });
  }
  mkdirSync(TEST_DIR, { recursive: true });
};

export const cleanupTestDir = () => {
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true, force: true });
  }
};

// CLI 명령 실행 헬퍼
export const runCLICommand = (command: string, ...args: string[]): Promise<{ success: boolean; output: string; error?: string }> => {
  return new Promise((resolve) => {
    const { spawn } = require('child_process');
    
    const child = spawn('node', ['dist/index.js', command, ...args], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd()
    });

    let output = '';
    let error = '';

    child.stdout.on('data', (data: Buffer) => {
      output += data.toString();
    });

    child.stderr.on('data', (data: Buffer) => {
      error += data.toString();
    });

    child.on('close', (code: number) => {
      const result: { success: boolean; output: string; error?: string } = {
        success: code === 0,
        output
      };
      
      if (error) {
        result.error = error;
      }
      
      resolve(result);
    });

    child.on('error', (err: Error) => {
      resolve({
        success: false,
        output,
        error: err.message
      });
    });
  });
};