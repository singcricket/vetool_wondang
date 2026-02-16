import { FlatCompat } from '@eslint/eslintrc'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      'react-hooks/incompatible-library': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
      'prefer-const': 'off',
      'react-hooks/exhaustive-deps': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
]

export default eslintConfig
