import { expect, test } from '@playwright/test'

const gotoHomeAndWaitForDiagram = async (page: any) => {
  await page.goto('/')
  await page.waitForSelector('[data-testid="flow-canvas"]')
}

test.describe('layout fills viewport', () => {
  test('overview canvas height tracks viewport', async ({ page }) => {
    await gotoHomeAndWaitForDiagram(page)
    const metrics = await page.evaluate(() => {
      const canvas = document.querySelector('[data-testid="flow-canvas"]')
      const sidebar = document.querySelector('[data-testid="group-sidebar"]')
      const header = document.querySelector('header')
      const main = document.querySelector('main')
      const headerHeight = header?.getBoundingClientRect().height ?? 0
      const mainStyles = main ? getComputedStyle(main) : null
      const mainPadding = mainStyles
        ? parseFloat(mainStyles.paddingTop) + parseFloat(mainStyles.paddingBottom)
        : 0
      const availableHeight = window.innerHeight - headerHeight - mainPadding
      const canvasHeight = canvas?.getBoundingClientRect().height ?? 0
      const sidebarHeight = sidebar?.getBoundingClientRect().height ?? 0
      return { canvasHeight, sidebarHeight, availableHeight }
    })

    expect(metrics.canvasHeight).toBeGreaterThanOrEqual(metrics.availableHeight - 8)
    expect(Math.abs(metrics.canvasHeight - metrics.sidebarHeight)).toBeLessThanOrEqual(4)
  })
})
