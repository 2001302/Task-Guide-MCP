import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { setupTestDir, cleanupTestDir, runCLICommand, TEST_DIR } from '../setup';

describe('Knowledge Graph Integration Tests', () => {
  beforeEach(() => {
    setupTestDir();
  });

  afterEach(() => {
    cleanupTestDir();
  });

  test('complete workflow: setup -> verify -> clear -> verify', async () => {
    // 1. Setup
    const setupResult = await runCLICommand('setup', TEST_DIR);
    expect(setupResult.success).toBe(true);
    
    // 2. Verify setup
    expect(existsSync(join(TEST_DIR, '.knowledge-root'))).toBe(true);
    expect(existsSync(join(TEST_DIR, '.knowledge-root', '.config.yaml'))).toBe(true);
    expect(existsSync(join(TEST_DIR, '.knowledge-root', '.knowledge-node.json'))).toBe(true);
    expect(existsSync(join(TEST_DIR, '.knowledge-root', '.knowledge-ignore.json'))).toBe(true);
    
    // 3. Clear
    const clearResult = await runCLICommand('clear');
    expect(clearResult.success).toBe(true);
    
    // 4. Verify clear
    expect(existsSync(join(TEST_DIR, '.knowledge-root'))).toBe(false);
  });

  test('multiple setup and clear cycles', async () => {
    // 첫 번째 사이클
    const setup1Result = await runCLICommand('setup', TEST_DIR);
    expect(setup1Result.success).toBe(true);
    expect(existsSync(join(TEST_DIR, '.knowledge-root'))).toBe(true);
    
    const clear1Result = await runCLICommand('clear');
    expect(clear1Result.success).toBe(true);
    expect(existsSync(join(TEST_DIR, '.knowledge-root'))).toBe(false);
    
    // 두 번째 사이클
    const setup2Result = await runCLICommand('setup', TEST_DIR);
    expect(setup2Result.success).toBe(true);
    expect(existsSync(join(TEST_DIR, '.knowledge-root'))).toBe(true);
    
    const clear2Result = await runCLICommand('clear');
    expect(clear2Result.success).toBe(true);
    expect(existsSync(join(TEST_DIR, '.knowledge-root'))).toBe(false);
  });

  test('setup with complex directory structure', async () => {
    // 복잡한 디렉토리 구조 생성
    const complexDirs = [
      'src/components/ui',
      'src/utils/helpers',
      'src/api/endpoints',
      'docs/examples',
      'tests/unit',
      'tests/integration'
    ];
    
    for (const dir of complexDirs) {
      require('fs').mkdirSync(join(TEST_DIR, dir), { recursive: true });
    }
    
    const result = await runCLICommand('setup', TEST_DIR);
    expect(result.success).toBe(true);
    
    // 모든 디렉토리에 .knowledge-node가 생성되었는지 확인
    for (const dir of complexDirs) {
      expect(existsSync(join(TEST_DIR, dir, '.knowledge-node'))).toBe(true);
      expect(existsSync(join(TEST_DIR, dir, '.knowledge-node', '.knowledge-node.json'))).toBe(true);
    }
  });

  test('file content validation', async () => {
    const result = await runCLICommand('setup', TEST_DIR);
    expect(result.success).toBe(true);
    
    // .config.yaml 내용 검증
    const configPath = join(TEST_DIR, '.knowledge-root', '.config.yaml');
    const configContent = readFileSync(configPath, 'utf-8');
    expect(configContent).toContain('version: 1.0.0');
    expect(configContent).toContain('created:');
    
    // .knowledge-node.json 내용 검증
    const nodePath = join(TEST_DIR, '.knowledge-root', '.knowledge-node.json');
    const nodeContent = JSON.parse(readFileSync(nodePath, 'utf-8'));
    expect(nodeContent.version).toBe('1.0.0');
    expect(nodeContent.nodes).toEqual([]);
    expect(nodeContent.relationships).toEqual([]);
    expect(nodeContent.created).toBeDefined();
    
    // .knowledge-ignore.json 내용 검증
    const ignorePath = join(TEST_DIR, '.knowledge-root', '.knowledge-ignore.json');
    const ignoreContent = JSON.parse(readFileSync(ignorePath, 'utf-8'));
    expect(ignoreContent.patterns).toContain('node_modules/**');
    expect(ignoreContent.patterns).toContain('.git/**');
    expect(ignoreContent.patterns).toContain('dist/**');
  });
});