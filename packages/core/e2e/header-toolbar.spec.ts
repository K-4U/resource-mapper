import { test, expect } from '@playwright/test';

// Helper to get the header toolbar buttons
const getToolbarButtons = async (page) => {
  const legendBtn = page.locator('[data-testid="toolbar-legend"]');
  const darkBtn = page.locator('[data-testid="toolbar-darkmode"]');
  const logBtn = page.locator('[data-testid="toolbar-log"]');
  return { legendBtn, darkBtn, logBtn };
};

test.describe('Header Toolbar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="toolbar-legend"]');
  });

  test('shows all three toolbar buttons', async ({ page }) => {
    const { legendBtn, darkBtn, logBtn } = await getToolbarButtons(page);
    await expect(legendBtn).toBeVisible();
    await expect(darkBtn).toBeVisible();
    await expect(logBtn).toBeVisible();
  });

  test('Show/Hide Legend toggles legend', async ({ page }) => {
    const { legendBtn } = await getToolbarButtons(page);
    // Legend should be visible by default
    await expect(page.locator('.pointer-events-none.absolute.bottom-4.right-4')).toBeVisible();
    await legendBtn.click();
    await expect(page.locator('.pointer-events-none.absolute.bottom-4.right-4')).toBeHidden();
    await legendBtn.click();
    await expect(page.locator('.pointer-events-none.absolute.bottom-4.right-4')).toBeVisible();
  });

  test('Light/Dark mode toggles color mode', async ({ page }) => {
    const { darkBtn } = await getToolbarButtons(page);
    // Default is light mode
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    await darkBtn.click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await darkBtn.click();
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  });

  test('Log button logs to console', async ({ page }) => {
    const { logBtn } = await getToolbarButtons(page);
    const [msg] = await Promise.all([
      page.waitForEvent('console', (m) => m.text().includes('[Header] Log button clicked')),
      logBtn.click()
    ]);
    expect(msg.text()).toContain('[Header] Log button clicked');
  });
});

