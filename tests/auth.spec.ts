import { test, expect } from "@playwright/test"

const DEMO_USERS = {
  owner: { email: "admin@buildtrack.com", password: "DEMO1234", role: "Builder" },
  engineer: { email: "site@buildtrack.com", password: "DEMO1234", role: "Site Engineer" },
  client: { email: "client@buildtrack.com", password: "DEMO1234", role: "Client" },
}

test.describe("Authentication", () => {
  test("sign-in page loads correctly", async ({ page }) => {
    await page.goto("/sign-in")
    await expect(page).toHaveTitle(/BuildTrack/)
    await expect(page.getByLabel("Email")).toBeVisible()
    await expect(page.getByLabel("Password")).toBeVisible()
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible()
  })

  test("sign-in with invalid credentials shows error", async ({ page }) => {
    await page.goto("/sign-in")
    await page.getByLabel("Email").fill("wrong@example.com")
    await page.getByLabel("Password").fill("wrongpassword")
    await page.getByRole("button", { name: /sign in/i }).click()
    await expect(page.getByText("Invalid login credentials", { exact: true })).toBeVisible({ timeout: 10000 })
  })

  test("owner can sign in and reaches dashboard", async ({ page }) => {
    await page.goto("/sign-in")
    await page.getByLabel("Email").fill(DEMO_USERS.owner.email)
    await page.getByLabel("Password").fill(DEMO_USERS.owner.password)
    await page.getByRole("button", { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })
    await expect(page.getByRole("main").getByRole("heading", { name: "Dashboard" })).toBeVisible()
  })

  test("engineer can sign in and reaches dashboard", async ({ page }) => {
    await page.goto("/sign-in")
    await page.getByLabel("Email").fill(DEMO_USERS.engineer.email)
    await page.getByLabel("Password").fill(DEMO_USERS.engineer.password)
    await page.getByRole("button", { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })
  })

  test("client can sign in and reaches dashboard", async ({ page }) => {
    await page.goto("/sign-in")
    await page.getByLabel("Email").fill(DEMO_USERS.client.email)
    await page.getByLabel("Password").fill(DEMO_USERS.client.password)
    await page.getByRole("button", { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })
  })

  test("sign-out redirects to sign-in", async ({ page }) => {
    await page.goto("/sign-in")
    await page.getByLabel("Email").fill(DEMO_USERS.owner.email)
    await page.getByLabel("Password").fill(DEMO_USERS.owner.password)
    await page.getByRole("button", { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })

    // Dismiss any Next.js dev overlay that may intercept clicks
    const devOverlay = page.locator("nextjs-portal")
    if (await devOverlay.isVisible({ timeout: 1000 }).catch(() => false)) {
      await page.evaluate(() => {
        const overlay = document.querySelector("nextjs-portal")
        if (overlay) overlay.remove()
      })
    }

    // Click the user avatar dropdown in the sidebar bottom
    const avatarBtn = page.locator("aside").getByRole("button").last()
    await avatarBtn.click({ force: true })
    await page.waitForTimeout(500)

    // Click Sign Out in dropdown
    await page.getByRole("menuitem", { name: /sign out/i }).click({ force: true })
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 10000 })
  })

  test("unauthenticated user is redirected to sign-in", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 10000 })
  })

  test("sign-up page loads correctly", async ({ page }) => {
    await page.goto("/sign-up")
    await expect(page.getByRole("button", { name: /sign up/i })).toBeVisible()
  })
})
