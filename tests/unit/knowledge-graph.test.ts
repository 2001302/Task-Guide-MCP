import { existsSync } from 'fs';
import { join } from 'path';
import { setupTestDir, cleanupTestDir, runCLICommand, TEST_DIR } from '../setup';

describe('Knowledge Graph API', () => {
  beforeEach(() => {
    setupTestDir();
  });

  afterEach(() => {
    cleanupTestDir();
  });

  describe('create and delete knowledge graph for each directory', () => {
    test('setup command to create .knowledge-root in root directory', async () => {
      const result = await runCLICommand('setup', TEST_DIR);
      
      expect(result.success).toBe(true);
      expect(existsSync(join(TEST_DIR, '.knowledge-root'))).toBe(true);
    });

    test('setup command to create .knowledge-node in subdirectory', async () => {
      // Create test subdirectory
      const subDir = join(TEST_DIR, 'src', 'components');
      require('fs').mkdirSync(subDir, { recursive: true });
      
      const result = await runCLICommand('setup', TEST_DIR);
      expect(result.success).toBe(true);
      
      expect(existsSync(join(subDir, '.knowledge-node'))).toBe(true);
    });

    test('clear command to delete all knowledge graph files', async () => {
      // First run setup
      const setupResult = await runCLICommand('setup', TEST_DIR);
      expect(setupResult.success).toBe(true);
      
      // Create subdirectory
      const subDir = join(TEST_DIR, 'src', 'utils');
      require('fs').mkdirSync(subDir, { recursive: true });
      const setupResult2 = await runCLICommand('setup', TEST_DIR);
      expect(setupResult2.success).toBe(true);
      
      // Run clear
      const result = await runCLICommand('clear', TEST_DIR);
      expect(result.success).toBe(true);
      
      // Verify all knowledge graph files were deleted
      expect(existsSync(join(TEST_DIR, '.knowledge-root'))).toBe(false);
      expect(existsSync(join(subDir, '.knowledge-node'))).toBe(false);
    });

    test('node_modules directory should not be touched', async () => {
      // Create node_modules directory
      const nodeModulesDir = join(TEST_DIR, 'node_modules', 'some-package');
      require('fs').mkdirSync(nodeModulesDir, { recursive: true });
      
      const setupResult = await runCLICommand('setup', TEST_DIR);
      expect(setupResult.success).toBe(true);
      
      const clearResult = await runCLICommand('clear', TEST_DIR);
      expect(clearResult.success).toBe(true);
      
      // node_modules should remain untouched
      expect(existsSync(join(TEST_DIR, 'node_modules'))).toBe(true);
    });
  });
});