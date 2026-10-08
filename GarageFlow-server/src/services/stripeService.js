import Stripe from "stripe"

let stripeClient = null

export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured")
  }

  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY)
  }

  return stripeClient
}

export function validatePlan(plan) {
  return plan === "starter" || plan === "pro"
}

export function getPriceIdForPlan(plan) {
  if (plan === "starter") return process.env.STRIPE_PRICE_STARTER
  if (plan === "pro") return process.env.STRIPE_PRICE_PRO
  return null
}

export function getPlanFromPriceId(priceId) {
  if (!priceId) return null
  if (priceId === process.env.STRIPE_PRICE_STARTER) return "starter"
  if (priceId === process.env.STRIPE_PRICE_PRO) return "pro"
  return null
}
