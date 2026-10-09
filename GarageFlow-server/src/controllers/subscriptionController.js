import pool from "../config/db.js"
import {
  getShopById,
  getSubscriptionByShopId,
  getSubscriptionByStripeCustomerId,
  getSubscriptionSnapshot,
  ensureStripeCustomer,
  updateSubscriptionRow,
} from "../services/subscriptionService.js"
import { getPlanFromPriceId, getPriceIdForPlan, getStripe, validatePlan } from "../services/stripeService.js"

function getBaseUrl() {
  return process.env.FRONTEND_URL || "http://localhost:5173"
}

function unixToDate(value) {
  if (!value) return null
  return new Date(value * 1000)
}

export const getMySubscription = async (req, res) => {
  try {
    const snapshot = await getSubscriptionSnapshot(req.shop.id)
    res.json(snapshot)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Failed to load subscription status" })
  }
}

export const createCheckoutSession = async (req, res) => {
  const { plan } = req.body

  if (!validatePlan(plan)) {
    return res.status(400).json({ message: "Invalid subscription plan" })
  }

  try {
    const shop = await getShopById(req.shop.id)
    if (!shop) return res.status(404).json({ message: "Shop not found" })

    const subscription = await ensureStripeCustomer(req.shop.id)
    if (!subscription) return res.status(404).json({ message: "Shop not found" })

    if (!subscription?.stripe_customer_id) {
      return res.status(500).json({ message: "Stripe customer could not be configured for this shop" })
    }

    if (subscription?.is_lifetime) {
      return res.status(400).json({ message: "This shop already has lifetime access and does not need a Stripe checkout session." })
    }

    if (subscription?.stripe_subscription_id) {
      return res.status(400).json({ message: "This shop already has a Stripe subscription. Use the billing portal to manage it." })
    }

    const priceId = getPriceIdForPlan(plan)
    if (!priceId) {
      return res.status(500).json({ message: "Stripe price is not configured for this plan" })
    }

    const stripe = getStripe()
    const subscriptionData = {}

    if (subscription.status === "trialing" && subscription.trial_end && new Date(subscription.trial_end) > new Date()) {
      subscriptionData.trial_end = Math.floor(new Date(subscription.trial_end).getTime() / 1000)
    } else if (!subscription.trial_start && !subscription.trial_end) {
      subscriptionData.trial_period_days = 30
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: subscription.stripe_customer_id,
      payment_method_collection: "if_required",
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: subscriptionData,
      success_url: `${getBaseUrl()}/pricing?checkout=success`,
      cancel_url: `${getBaseUrl()}/pricing?checkout=canceled`,
      metadata: {
        shop_id: String(shop.id),
        selected_plan: plan,
      },
    })

    res.json({ url: session.url })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Failed to create checkout session" })
  }
}

export const createCustomerPortalSession = async (req, res) => {
  try {
    const subscription = await ensureStripeCustomer(req.shop.id)
    if (!subscription) return res.status(404).json({ message: "Shop not found" })

    if (!subscription?.stripe_customer_id) {
      return res.status(500).json({ message: "Stripe customer could not be configured for this shop" })
    }

    const stripe = getStripe()
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${getBaseUrl()}/profile`,
    })

    res.json({ url: session.url })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Failed to create billing portal session" })
  }
}

export const handleStripeWebhook = async (req, res) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return res.status(500).json({ message: "Stripe webhook secret is not configured" })
  }

  let event
  try {
    const stripe = getStripe()
    const signature = req.headers["stripe-signature"]
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret)
  } catch (error) {
    console.error(error)
    return res.status(400).send(`Webhook Error: ${error.message}`)
  }

  try {
    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const stripeSubscription = event.data.object
      const priceId = stripeSubscription.items?.data?.[0]?.price?.id || null
      const plan = getPlanFromPriceId(priceId) || "starter"
      const localSubscription = await getSubscriptionByStripeCustomerId(stripeSubscription.customer)

      if (localSubscription?.is_lifetime) {
        return res.json({ received: true, ignored: "lifetime_access" })
      }

      await updateSubscriptionRow({
        stripeCustomerId: stripeSubscription.customer,
        stripeSubscriptionId: stripeSubscription.id,
        plan: localSubscription?.is_overridden ? localSubscription.plan : plan,
        status: stripeSubscription.status,
        trialStart: unixToDate(stripeSubscription.trial_start),
        trialEnd: unixToDate(stripeSubscription.trial_end),
        currentPeriodEnd: unixToDate(stripeSubscription.current_period_end),
      })
    }

    if (event.type === "invoice.payment_succeeded" || event.type === "invoice.payment_failed") {
      const invoice = event.data.object
      const subscription = await getSubscriptionByStripeCustomerId(invoice.customer)

      if (subscription) {
        if (subscription.is_lifetime) {
          return res.json({ received: true, ignored: "lifetime_access" })
        }

        await updateSubscriptionRow({
          stripeCustomerId: invoice.customer,
          stripeSubscriptionId: invoice.subscription || subscription.stripe_subscription_id,
          plan: subscription.plan,
          status: event.type === "invoice.payment_succeeded" ? "active" : "past_due",
          trialStart: subscription.trial_start,
          trialEnd: subscription.trial_end,
          currentPeriodEnd: subscription.current_period_end,
        })
      }
    }

    res.json({ received: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Failed to process webhook" })
  }
}
