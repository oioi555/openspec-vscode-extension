import * as assert from 'assert';
import { buildOpenSpecChangeCommandSnippet, copyOpenSpecChangeCommandSnippet } from '../../src/utils/changeCommandSnippet';

suite('Change Command Snippet Test Suite', () => {
  test('Should build command snippets for change actions', () => {
    assert.strictEqual(
      buildOpenSpecChangeCommandSnippet({ changeId: 'alpha-change', command: 'propose' }),
      '/opsx:propose alpha-change'
    );

    assert.strictEqual(
      buildOpenSpecChangeCommandSnippet({ changeId: 'alpha-change', command: 'apply' }),
      '/opsx:apply alpha-change'
    );

    assert.strictEqual(
      buildOpenSpecChangeCommandSnippet({ changeId: 'alpha-change', command: 'ff' }),
      '/opsx:ff alpha-change'
    );
  });

  test('Should reject empty change ids', () => {
    assert.throws(
      () => buildOpenSpecChangeCommandSnippet({ changeId: '   ', command: 'verify' }),
      /Change ID is required/
    );
  });

  test('Should write snippets to the clipboard helper', async () => {
    let copied = '';
    const snippet = await copyOpenSpecChangeCommandSnippet(
      { changeId: 'alpha-change', command: 'sync' },
      async (value: string) => {
        copied = value;
      }
    );

    assert.strictEqual(snippet, '/opsx:sync alpha-change');
    assert.strictEqual(copied, '/opsx:sync alpha-change');
  });

  test('Should surface clipboard write failures', async () => {
    await assert.rejects(
      copyOpenSpecChangeCommandSnippet(
        { changeId: 'alpha-change', command: 'archive' },
        async () => {
          throw new Error('clipboard unavailable');
        }
      ),
      /clipboard unavailable/
    );
  });
});
