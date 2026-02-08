import { expect, test } from '@playwright/test';

const logBrowserConsole = (page) => {
	page.on('console', (msg) => {
		console.log(`[browser:${msg.type()}] ${msg.text()}`);
	});
};

const gotoHomeAndWaitForDiagram = async (page) => {
	logBrowserConsole(page);
	await page.goto('/');
	await page.waitForSelector('[data-testid="flow-canvas"]', { timeout: 20000 });
	await expect(page.locator('[data-testid="flow-canvas"]')).toBeVisible();
};

test('home page renders diagram with data', async ({ page }) => {
	await gotoHomeAndWaitForDiagram(page);
	const flowCanvas = page.locator('[data-testid="flow-canvas"]');
	await expect(flowCanvas.locator('svg')).toBeVisible();
	await expect(flowCanvas.getByText('No diagram available.')).toHaveCount(0);
});

test('clicking a group node updates the sidebar selection', async ({ page }) => {
	await gotoHomeAndWaitForDiagram(page);
	const groupNode = page.locator('svg g.node').filter({ hasText: 'API Services' });
	await groupNode.waitFor({ state: 'visible' });
	await groupNode.click();
	const sidebar = page.locator('aside').filter({ hasText: 'API Services' });
	await expect(sidebar).toBeVisible();
});

test('double clicking a node navigates to the group detail page', async ({ page }) => {
	await gotoHomeAndWaitForDiagram(page);
	const groupNode = page.locator('svg g.node').filter({ hasText: 'API Services' });
	await groupNode.waitFor({ state: 'visible' });
	await groupNode.dblclick();
	await page.waitForURL('**/group/api', { timeout: 20000 });
	await page.waitForSelector('[data-testid="flow-canvas"]', { timeout: 20000 });
	await expect(page.locator('h2').filter({ hasText: 'API Services' })).toBeVisible();
});
