# Testing Guide

This document provides information about testing in the AI Support Autoresponder project.

## Test Structure

The project uses three types of tests:

1. **Unit Tests**: Test individual functions and services
2. **Integration Tests**: Test API routes and service interactions
3. **E2E Tests**: Test full user workflows with Playwright

## Running Tests

### Unit and Integration Tests (Jest)

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### E2E Tests (Playwright)

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

## Test Files Location

- **Unit Tests**: `src/lib/__tests__/`
- **Integration Tests**: `app/api/__tests__/`
- **E2E Tests**: `e2e/`

## Writing Tests

### Unit Tests

Unit tests should test individual functions in isolation:

```typescript
import { functionToTest } from '../module';

describe('module', () => {
  it('should do something', () => {
    const result = functionToTest(input);
    expect(result).toBe(expected);
  });
});
```

### Integration Tests

Integration tests test API routes:

```typescript
import { GET, POST } from '../route';
import { NextRequest } from 'next/server';

describe('/api/endpoint', () => {
  it('should handle GET request', async () => {
    const request = new NextRequest('http://localhost:3000/api/endpoint');
    const response = await GET(request);
    expect(response.status).toBe(200);
  });
});
```

### E2E Tests

E2E tests use Playwright to test full user workflows:

```typescript
import { test, expect } from '@playwright/test';

test('should create a ticket', async ({ page }) => {
  await page.goto('/dashboard/tickets/new');
  await page.fill('input[name="subject"]', 'Test');
  await page.click('button[type="submit"]');
  await expect(page.locator('.success')).toBeVisible();
});
```

## Test Coverage

Current coverage targets:
- Branches: 50%
- Functions: 50%
- Lines: 50%
- Statements: 50%

View coverage report:
```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory.

## Mocking

### Supabase Client

The Supabase client is mocked in `jest.setup.js`. Use the mocked client in tests:

```typescript
import { supabaseAdmin } from '@/lib/supabaseClient';

// Mock responses
(supabaseAdmin.from as jest.Mock).mockReturnValue({
  select: jest.fn().mockResolvedValue({ data: [], error: null }),
});
```

### OpenAI Client

The OpenAI client is mocked in `jest.setup.js`:

```typescript
import { openai } from '@/lib/openaiClient';

// Mock responses
(openai.chat.completions.create as jest.Mock).mockResolvedValue({
  choices: [{ message: { content: 'Response' } }],
});
```

## Best Practices

1. **Test Behavior, Not Implementation**: Focus on what the code does, not how it does it
2. **Use Descriptive Test Names**: Test names should clearly describe what is being tested
3. **Arrange-Act-Assert**: Structure tests with clear sections
4. **Mock External Dependencies**: Mock API calls, database queries, etc.
5. **Test Edge Cases**: Include tests for error conditions and edge cases
6. **Keep Tests Fast**: Unit tests should run quickly
7. **Isolate Tests**: Tests should not depend on each other

## Continuous Integration

Tests should run automatically in CI/CD pipelines. Example GitHub Actions workflow:

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run test:e2e
```

## Troubleshooting

### Tests Failing

1. Check that all dependencies are installed: `npm install`
2. Verify environment variables are set
3. Check test output for specific error messages
4. Ensure mocks are properly configured

### E2E Tests Failing

1. Ensure the dev server is running: `npm run dev`
2. Check Playwright browsers are installed: `npx playwright install`
3. Verify test selectors match current UI
4. Check for timing issues (add appropriate waits)

### Coverage Issues

1. Ensure all code paths are tested
2. Add tests for missing branches
3. Check that test files are in the correct location
4. Verify coverage thresholds in `jest.config.js`

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/docs/intro)

