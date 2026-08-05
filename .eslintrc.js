module.exports = {
  root: true,
  extends: '@react-native',

  overrides: [
    {
      files: [
        'jest.setup.js',
        '**/*.test.js',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.js',
        '**/*.spec.ts',
        '**/*.spec.tsx',
      ],
      env: {
        jest: true,
      },
    },
  ],
};