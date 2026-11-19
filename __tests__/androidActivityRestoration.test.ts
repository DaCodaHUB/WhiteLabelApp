import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

test('MainActivity installs the screens fragment factory before restoring activity state', () => {
  const source = readFileSync(
    resolve(__dirname, '../android/app/src/main/java/com/whitelabelapp/MainActivity.kt'),
    'utf8',
  );
  const onCreate = source.match(/override\s+fun\s+onCreate\([^)]*\)\s*\{([^}]*)\}/)?.[1];

  expect(onCreate).toMatch(
    /^\s*supportFragmentManager\.fragmentFactory\s*=\s*RNScreensFragmentFactory\(\)\s+super\.onCreate\(savedInstanceState\)\s*$/,
  );
});
