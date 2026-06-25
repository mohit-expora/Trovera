/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['next/core-web-vitals'],
  plugins: {
    '@trovera/ui': require('@trovera/ui/eslint-plugin'),
  },
  rules: {
    '@trovera/ui/no-undocumented-components': 'error',
  },
};
