/**
 * Billing Service — interface scaffold for future payment integration.
 * No provider implementation yet — just the contract.
 */

export type Plan = "free" | "starter" | "pro" | "enterprise"

export interface Subscription {
  id: string
  org_id: string
  plan: Plan
  status: "active" | "cancelled" | "past_due" | "trialing"
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
}

export interface Invoice {
  id: string
  org_id: string
  amount: number
  currency: string
  status: "paid" | "pending" | "failed"
  created_at: string
}

export interface WebhookEvent {
  type: string
  data: Record<string, any>
}

/**
 * Billing Service — define the contract for payment integration.
 * Implement with Stripe, Razorpay, or Paddle when ready.
 */
export interface IBillingService {
  /**
   * Create a checkout session for a plan upgrade.
   */
  createCheckout(orgId: string, plan: Plan): Promise<string>

  /**
   * Get the current subscription for an org.
   */
  getSubscription(orgId: string): Promise<Subscription | null>

  /**
   * Cancel a subscription.
   */
  cancelSubscription(orgId: string): Promise<void>

  /**
   * Handle a webhook event from the payment provider.
   */
  handleWebhook(event: WebhookEvent): Promise<void>
}

/**
 * Stub implementation — returns defaults for all operations.
 * Replace with real provider when billing is needed.
 */
export const BillingService: IBillingService = {
  async createCheckout(_orgId: string, _plan: Plan): Promise<string> {
    console.warn("[BillingService] Not implemented yet")
    return ""
  },

  async getSubscription(_orgId: string): Promise<Subscription | null> {
    return null
  },

  async cancelSubscription(_orgId: string): Promise<void> {
    console.warn("[BillingService] Not implemented yet")
  },

  async handleWebhook(_event: WebhookEvent): Promise<void> {
    console.warn("[BillingService] Not implemented yet")
  },
}
