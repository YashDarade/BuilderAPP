import { test, expect } from "@playwright/test"

const DEMO_USERS = {
  owner: { email: "admin@buildtrack.com", password: "DEMO1234" },
  engineer: { email: "site@buildtrack.com", password: "DEMO1234" },
  client: { email: "client@buildtrack.com", password: "DEMO1234" },
}

async function signIn(page: any, email: string, password: string) {
  await page.goto("/sign-in")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password").fill(password)
  await page.getByRole("button", { name: /sign in/i }).click()
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })
  // Wait for the store to load currentUser so RoleGuard works
  await page.waitForTimeout(1000)
}

test.describe("RBAC - Owner access", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, DEMO_USERS.owner.email, DEMO_USERS.owner.password)
  })

  test("owner can access budget page", async ({ page }) => {
    await page.goto("/budget")
    await expect(page.getByText("Access Denied")).not.toBeVisible({ timeout: 5000 })
  })

  test("owner can access AI tools page", async ({ page }) => {
    await page.goto("/ai-tools")
    await expect(page.getByText("Access Denied")).not.toBeVisible({ timeout: 5000 })
  })

  test("owner can access activity log page", async ({ page }) => {
    await page.goto("/activity")
    await expect(page.getByText("Access Denied")).not.toBeVisible({ timeout: 5000 })
  })

  test("owner can access client portal page", async ({ page }) => {
    await page.goto("/client-portal")
    await expect(page.getByText("Access Denied")).not.toBeVisible({ timeout: 5000 })
  })
})

test.describe("RBAC - Engineer blocked from owner-only pages", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, DEMO_USERS.engineer.email, DEMO_USERS.engineer.password)
  })

  test("engineer is blocked from budget page", async ({ page }) => {
    await page.goto("/budget")
    await expect(page.getByText("Access Denied")).toBeVisible({ timeout: 10000 })
    await expect(page.getByText("Back to Dashboard")).toBeVisible()
  })

  test("engineer is blocked from AI tools page", async ({ page }) => {
    await page.goto("/ai-tools")
    await expect(page.getByText("Access Denied")).toBeVisible({ timeout: 10000 })
  })

  test("engineer can access projects page", async ({ page }) => {
    await page.goto("/projects")
    await expect(page.getByText("Access Denied")).not.toBeVisible({ timeout: 5000 })
  })

  test("engineer can access materials page", async ({ page }) => {
    await page.goto("/materials")
    await expect(page.getByText("Access Denied")).not.toBeVisible({ timeout: 5000 })
  })

  test("engineer can access expenses page", async ({ page }) => {
    await page.goto("/expenses")
    await expect(page.getByText("Access Denied")).not.toBeVisible({ timeout: 5000 })
  })

  test("engineer can access reports page", async ({ page }) => {
    await page.goto("/reports")
    await expect(page.getByText("Access Denied")).not.toBeVisible({ timeout: 5000 })
  })

  test("engineer can access activity log page", async ({ page }) => {
    await page.goto("/activity")
    await expect(page.getByText("Access Denied")).not.toBeVisible({ timeout: 5000 })
  })
})

test.describe("RBAC - Client blocked from owner/engineer pages", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, DEMO_USERS.client.email, DEMO_USERS.client.password)
  })

  test("client is blocked from budget page", async ({ page }) => {
    await page.goto("/budget")
    await expect(page.getByText("Access Denied")).toBeVisible({ timeout: 10000 })
  })

  test("client is blocked from AI tools page", async ({ page }) => {
    await page.goto("/ai-tools")
    await expect(page.getByText("Access Denied")).toBeVisible({ timeout: 10000 })
  })

  test("client is blocked from materials page", async ({ page }) => {
    await page.goto("/materials")
    await expect(page.getByText("Access Denied")).toBeVisible({ timeout: 10000 })
  })

  test("client can access projects page", async ({ page }) => {
    await page.goto("/projects")
    await expect(page.getByText("Access Denied")).not.toBeVisible({ timeout: 5000 })
  })

  test("client can access client portal", async ({ page }) => {
    await page.goto("/client-portal")
    await expect(page.getByText("Access Denied")).not.toBeVisible({ timeout: 5000 })
  })

  test("client can access reports page", async ({ page }) => {
    await page.goto("/reports")
    await expect(page.getByText("Access Denied")).not.toBeVisible({ timeout: 5000 })
  })
})
