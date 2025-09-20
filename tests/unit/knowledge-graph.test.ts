import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { setupTestDir, cleanupTestDir, runCLICommand, TEST_DIR } from '../setup';

describe('Knowledge Graph API', () => {
  beforeEach(() => {
    setupTestDir();
  });

  afterEach(() => {
    cleanupTestDir();
  });

  describe('setup API', () => {
    test('should create .knowledge-root directory with required files', async () => {
      const result = await runCLICommand('setup', TEST_DIR);
      
      expect(result.success).toBe(true);
      expect(existsSync(join(TEST_DIR, '.knowledge-root'))).toBe(true);
      expect(existsSync(join(TEST_DIR, '.knowledge-root', '.config.yaml'))).toBe(true);
      expect(existsSync(join(TEST_DIR, '.knowledge-root', '.knowledge-node.json'))).toBe(true);
      expect(existsSync(join(TEST_DIR, '.knowledge-root', '.knowledge-ignore.json'))).toBe(true);
    });

    test('should create .knowledge-node directories in subdirectories', async () => {
      // 테스트용 하위 디렉토리 생성
      const subDir = join(TEST_DIR, 'src', 'test');
      require('fs').mkdirSync(subDir, { recursive: true });
      
      const result = await runCLICommand('setup', TEST_DIR);
      expect(result.success).toBe(true);
      
      expect(existsSync(join(subDir, '.knowledge-node'))).toBe(true);
      expect(existsSync(join(subDir, '.knowledge-node', '.knowledge-node.json'))).toBe(true);
    });

    test('should create valid JSON files', async () => {
      const result = await runCLICommand('setup', TEST_DIR);
      expect(result.success).toBe(true);
      
      // .knowledge-node.json 파일 검증
      const knowledgeNodePath = join(TEST_DIR, '.knowledge-root', '.knowledge-node.json');
      const knowledgeNodeContent = JSON.parse(readFileSync(knowledgeNodePath, 'utf-8'));
      
      expect(knowledgeNodeContent).toHaveProperty('version');
      expect(knowledgeNodeContent).toHaveProperty('nodes');
      expect(knowledgeNodeContent).toHaveProperty('relationships');
      expect(knowledgeNodeContent).toHaveProperty('created');
      expect(Array.isArray(knowledgeNodeContent.nodes)).toBe(true);
      expect(Array.isArray(knowledgeNodeContent.relationships)).toBe(true);
    });

    test('should create .knowledge-ignore.json with default patterns', async () => {
      const result = await runCLICommand('setup', TEST_DIR);
      expect(result.success).toBe(true);
      
      const ignorePath = join(TEST_DIR, '.knowledge-root', '.knowledge-ignore.json');
      const ignoreContent = JSON.parse(readFileSync(ignorePath, 'utf-8'));
      
      expect(ignoreContent).toHaveProperty('patterns');
      expect(Array.isArray(ignoreContent.patterns)).toBe(true);
      expect(ignoreContent.patterns).toContain('node_modules/**');
      expect(ignoreContent.patterns).toContain('.git/**');
    });
  });

  describe('clear API', () => {
    test('should remove all knowledge files', async () => {
      // 먼저 setup 실행
      const setupResult = await runCLICommand('setup', TEST_DIR);
      expect(setupResult.success).toBe(true);
      
      // clear 실행
      const result = await runCLICommand('clear');
      
      expect(result.success).toBe(true);
      expect(existsSync(join(TEST_DIR, '.knowledge-root'))).toBe(false);
    });

    test('should remove .knowledge-node directories', async () => {
      // 하위 디렉토리 생성
      const subDir = join(TEST_DIR, 'src', 'test');
      require('fs').mkdirSync(subDir, { recursive: true });
      
      // setup 실행
      const setupResult = await runCLICommand('setup', TEST_DIR);
      expect(setupResult.success).toBe(true);
      
      expect(existsSync(join(subDir, '.knowledge-node'))).toBe(true);
      
      // clear 실행
      const clearResult = await runCLICommand('clear');
      expect(clearResult.success).toBe(true);
      
      expect(existsSync(join(subDir, '.knowledge-node'))).toBe(false);
    });

    test('should skip node_modules directories', async () => {
      // node_modules 디렉토리 생성
      const nodeModulesDir = join(TEST_DIR, 'node_modules', 'test-package');
      require('fs').mkdirSync(nodeModulesDir, { recursive: true });
      
      const setupResult = await runCLICommand('setup', TEST_DIR);
      expect(setupResult.success).toBe(true);
      
      const clearResult = await runCLICommand('clear');
      expect(clearResult.success).toBe(true);
      
      // node_modules는 건드리지 않았는지 확인
      expect(existsSync(join(TEST_DIR, 'node_modules'))).toBe(true);
    });
  });

  describe('error handling', () => {
    test('should handle invalid directory path', async () => {
      const invalidPath = '/invalid/path/that/does/not/exist';
      const result = await runCLICommand('setup', invalidPath);
      
      // 에러가 발생해야 함
      expect(result.success).toBe(false);
    });

    test('should handle missing rootDirectory parameter', async () => {
      const result = await runCLICommand('setup');
      
      expect(result.success).toBe(false);
    });
  });
});