import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const logBrowserConsole = (page: Page) => {
	page.on('console', (msg) => {
		console.log(`[browser:${msg.type()}] ${msg.text()}`);
	});
};

const waitForOverlayToDisappear = async (page: Page) => {
	const overlay = page.locator('[data-testid="flow-loading-overlay"]');
	try {
		await overlay.waitFor({ state: 'detached', timeout: 20000 });
	} catch {
		await expect(overlay).toHaveCount(0);
	}
};

const gotoHomeAndWaitForDiagram = async (page: Page) => {
	logBrowserConsole(page);
	await page.goto('/');
	await page.waitForSelector('[data-testid="flow-canvas"]', { timeout: 20000 });
	await expect(page.locator('[data-testid="flow-canvas"]')).toBeVisible();
	await waitForOverlayToDisappear(page);
	const anyNode = page.locator('[data-testid="flow-canvas"] .svelte-flow__node').first();
	await anyNode.waitFor({ state: 'visible', timeout: 20000 });
};

test('home page renders diagram with data', async ({ page }) => {
	await gotoHomeAndWaitForDiagram(page);
	const flowCanvas = page.locator('[data-testid="flow-canvas"]');
	await expect(flowCanvas.locator('.svelte-flow__node').first()).toBeVisible();
	await expect(flowCanvas.getByText('No diagram available.')).toHaveCount(0);
});

test('clicking a group node updates the sidebar selection', async ({ page }) => {
	await gotoHomeAndWaitForDiagram(page);
	const groupNode = page.locator('.svelte-flow__node').filter({ hasText: 'API Services' });
	await groupNode.first().waitFor({ state: 'visible' });
	await groupNode.first().click();
	const sidebar = page.locator('[data-testid="group-sidebar"], aside').filter({ hasText: 'API Services' });
	await expect(sidebar.first()).toBeVisible();
});

test('double clicking a node navigates to the group detail page', async ({ page }) => {
	await gotoHomeAndWaitForDiagram(page);
	const groupNode = page.locator('.svelte-flow__node').filter({ hasText: 'API Services' });
	await groupNode.first().waitFor({ state: 'visible' });
	await groupNode.first().dblclick();
	await page.waitForURL('**/group/api', { timeout: 20000 });
	await page.waitForSelector('[data-testid="flow-canvas"]', { timeout: 20000 });
	await waitForOverlayToDisappear(page);
	await expect(page.locator('h2').filter({ hasText: 'API Services' }).first()).toBeVisible();
});
