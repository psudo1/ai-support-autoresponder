# E2E Tests

End-to-end tests using Playwright for the AI Support Autoresponder.

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run tests in a specific browser
npx playwright test --project=chromium
```

## Test Structure

Tests are organized by feature area:
- **Dashboard**: Dashboard page tests (requires authentication)
- **Ticket Management**: Ticket CRUD operations (requires authentication)
- **Knowledge Base**: Knowledge base tests (requires authentication)
- **Authentication**: Login/logout flow tests

## Authentication

Most E2E tests require authentication. Currently, tests that require authentication are marked with `test.skip()`.

To enable authenticated tests:

1. **Option 1: Set up test authentication**
   - Create a test user in your test database
   - Add authentication helper functions
   - Use Playwright's `storageState` to persist auth

2. **Option 2: Use authenticated context**
   ```typescript
   test.use({ storageState: 'playwright/.auth/user.json' });
   ```

3. **Option 3: Mock authentication**
   - Bypass auth middleware in test environment
   - Use test-specific auth tokens

## Example: Setting Up Authentication

```typescript
// e2e/auth.setup.ts
import { test as setup } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  await page.goto('/auth/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'testpassword');
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});
```

Then in your tests:
```typescript
import { test } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/user.json' });
```

## Writing New Tests

1. Use descriptive test names
2. Handle authentication appropriately
3. Use proper selectors (prefer `getByRole`, `getByText`, `getByPlaceholder`)
4. Add appropriate waits and timeouts
5. Clean up test data after tests

## Debugging

- Use `npm run test:e2e:ui` for interactive debugging
- Use `page.pause()` to pause execution
- Check `test-results/` for screenshots and videos
- Use Playwright Inspector: `PWDEBUG=1 npm run test:e2e`

## CI/CD

E2E tests should run in CI/CD pipelines:
- Install browsers: `npx playwright install --with-deps`
- Run tests: `npm run test:e2e`
- Generate report: Tests automatically generate HTML reports

