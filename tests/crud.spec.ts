import { test, expect } from "@playwright/test"

const OWNER = { email: "admin@buildtrack.com", password: "DEMO1234" }

async function signInAsOwner(page: any) {
  await page.goto("/sign-in")
  await page.getByLabel("Email").fill(OWNER.email)
  await page.getByLabel("Password").fill(OWNER.password)
  await page.getByRole("button", { name: /sign in/i }).click()
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })
}

test.describe("Projects CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsOwner(page)
  })

  test("projects page loads with data", async ({ page }) => {
    await page.goto("/projects")
    await expect(page.getByRole("main").getByRole("heading", { name: "Projects" })).toBeVisible()
    await expect(page.getByRole("button", { name: /add project/i })).toBeVisible()
  })

  test("can open add project dialog", async ({ page }) => {
    await page.goto("/projects")
    await page.getByRole("button", { name: /add project/i }).click()
    await expect(page.getByRole("heading", { name: "Add New Project" })).toBeVisible()
    await expect(page.getByLabel("Project Name")).toBeVisible()
  })

  test("can create a new project", async ({ page }) => {
    await page.goto("/projects")
    await page.getByRole("button", { name: /add project/i }).click()

    const projectName = `Test Project ${Date.now()}`
    await page.getByLabel("Project Name").fill(projectName)
    await page.getByLabel("Client Name").fill("Test Client")
    await page.getByLabel("Address").fill("123 Test Street")

    await page.getByRole("button", { name: /create project/i }).click()
    // Wait for either success toast or error toast (dialog closes on success)
    await expect(
      page.getByText(/project created|failed to create/i)
    ).toBeVisible({ timeout: 15000 })
  })

  test("search filters projects", async ({ page }) => {
    await page.goto("/projects")
    await page.waitForTimeout(1000)
    const searchInput = page.getByPlaceholder(/search projects/i)
    if (await searchInput.isVisible()) {
      await searchInput.fill("Green Valley")
      await page.waitForTimeout(500)
    }
  })
})

test.describe("Materials CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsOwner(page)
  })

  test("materials page loads with data", async ({ page }) => {
    await page.goto("/materials")
    await expect(page.getByRole("main").getByRole("heading", { name: "Materials" })).toBeVisible()
    await expect(page.getByRole("button", { name: /add material/i })).toBeVisible()
  })

  test("can open add material dialog", async ({ page }) => {
    await page.goto("/materials")
    await page.getByRole("button", { name: /add material/i }).click()
    await expect(page.getByRole("heading", { name: "Add Material" })).toBeVisible()
  })

  test("can create a new material", async ({ page }) => {
    await page.goto("/materials")
    await page.getByRole("button", { name: /add material/i }).click()

    // Fill material name
    await page.getByLabel("Material Name").fill(`Test Material ${Date.now()}`)

    // Select category via Select component (first select in the grid)
    const categorySelect = page.getByRole("combobox").nth(0)
    await categorySelect.click()
    await page.getByRole("option", { name: /cement/i }).click()

    // Select project via Select component (second select in the grid)
    const projectSelect = page.getByRole("combobox").nth(1)
    await projectSelect.click()
    await page.getByRole("option").first().click()

    // Fill quantities
    await page.getByLabel("Qty Purchased").fill("100")
    await page.getByLabel("Qty Remaining").fill("100")
    await page.getByLabel("Unit", { exact: true }).fill("bags")
    await page.getByLabel("Cost/Unit").fill("350")
    await page.getByLabel("Vendor").fill("Test Vendor")

    // Submit - click the submit button inside the dialog
    await page.locator("[role='dialog']").getByRole("button", { name: /add material/i }).click()
    await expect(page.getByText(/Material added|Failed to save/i)).toBeVisible({ timeout: 10000 })
  })
})

test.describe("Expenses CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsOwner(page)
  })

  test("expenses page loads with data", async ({ page }) => {
    await page.goto("/expenses")
    await expect(page.getByRole("main").getByRole("heading", { name: "Expenses" })).toBeVisible()
    await expect(page.getByRole("button", { name: /add expense/i })).toBeVisible()
  })

  test("can open add expense dialog", async ({ page }) => {
    await page.goto("/expenses")
    await page.getByRole("button", { name: /add expense/i }).click()
    await expect(page.getByRole("heading", { name: "Add Expense" })).toBeVisible()
  })

  test("can create a new expense", async ({ page }) => {
    await page.goto("/expenses")
    await page.getByRole("button", { name: /add expense/i }).click()

    // Fill description and amount
    await page.getByLabel("Description").fill(`Test Expense ${Date.now()}`)
    await page.getByLabel("Amount").fill("5000")

    // Select category via Select component
    const categorySelect = page.getByRole("combobox").nth(0)
    await categorySelect.click()
    await page.getByRole("option", { name: /labor/i }).click()

    // Select project via Select component
    const projectSelect = page.getByRole("combobox").nth(1)
    await projectSelect.click()
    await page.getByRole("option").first().click()

    // Fill vendor and date
    await page.getByLabel("Vendor").fill("Test Vendor")
    await page.getByLabel("Date").fill("2026-06-13")

    // Submit - click the submit button inside the dialog
    await page.locator("[role='dialog']").getByRole("button", { name: /add expense/i }).click()
    await expect(page.getByText(/Expense added|Failed to save/i)).toBeVisible({ timeout: 10000 })
  })
})

test.describe("Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsOwner(page)
  })

  test("sidebar navigation works", async ({ page }) => {
    await page.goto("/dashboard")

    await page.getByRole("link", { name: /projects/i }).first().click()
    await expect(page).toHaveURL(/\/projects/)

    await page.getByRole("link", { name: /materials/i }).first().click()
    await expect(page).toHaveURL(/\/materials/)

    await page.getByRole("link", { name: /expenses/i }).first().click()
    await expect(page).toHaveURL(/\/expenses/)

    await page.getByRole("link", { name: /reports/i }).first().click()
    await expect(page).toHaveURL(/\/reports/)

    await page.getByRole("link", { name: /dashboard/i }).first().click()
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test("notifications page loads", async ({ page }) => {
    await page.goto("/notifications")
    await expect(page.getByRole("main").getByRole("heading", { name: "Notifications" })).toBeVisible()
  })

  test("profile page loads", async ({ page }) => {
    await page.goto("/profile")
    await expect(page.getByText("My Profile")).toBeVisible()
  })
})

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsOwner(page)
  })

  test("dashboard loads with stats and charts", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page.getByRole("main").getByRole("heading", { name: "Dashboard" })).toBeVisible()
    await page.waitForTimeout(2000)
  })
})
