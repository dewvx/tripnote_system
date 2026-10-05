import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js', 'src/**/*.test.js'],
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'mysql://test:test@localhost:3306/tripnote_test',
      JWT_ACCESS_SECRET: 'test-secret-that-is-at-least-32-characters-long',
    },
  },
});
