import pool from "../config/db.js"

function toIso(value) {
  if (!value) return null
  return new Date(value).toISOString()
}

function asBool(value) {
  return value === true || value === 1 || value === "1"
}

function startOfToday() {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now
}

function daysBetweenInclusive(endDate) {
  if (!endDate) return 0
  const start = startOfToday()
  const end = new Date(endDate)
  end.setHours(0, 0, 0, 0)
  const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
}

export async function createInitialTrialSubscription({ shopId, stripeCustomerId }) {
  await pool.query(
    `INSERT INTO subscriptions
      (shop_id, stripe_customer_id, stripe_subscription_id, plan, status, trial_start, trial_end, current_period_end)
     VALUES
      (?, ?, NULL, 'pro', 'trialing', NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), DATE_ADD(NOW(), INTERVAL 30 DAY))
     ON DUPLICATE KEY UPDATE
      stripe_customer_id = VALUES(stripe_customer_id),
      plan = VALUES(plan),
      status = VALUES(status),
      trial_start = VALUES(trial_start),
      trial_end = VALUES(trial_end),
      current_period_end = VALUES(current_period_end),
      updated_at = CURRENT_TIMESTAMP`,
    [shopId, stripeCustomerId]
  )
}

export async function getSubscriptionByShopId(shopId) {
  const [rows] = await pool.query(
    `SELECT *
     FROM subscriptions
     WHERE shop_id = ?
     LIMIT 1`,
    [shopId]
  )
  return rows[0] || null
}

export async function getSubscriptionByStripeCustomerId(stripeCustomerId) {
  const [rows] = await pool.query(
    `SELECT *
     FROM subscriptions
     WHERE stripe_customer_id = ?
     LIMIT 1`,
    [stripeCustomerId]
  )
  return rows[0] || null
}

export async function getShopById(shopId) {
  const [rows] = await pool.query(
    `SELECT id, shop_name, shop_email
     FROM shops
     WHERE id = ?
     LIMIT 1`,
    [shopId]
  )
  return rows[0] || null
}

export async function updateSubscriptionRow({
  stripeCustomerId,
  stripeSubscriptionId,
  plan,
  status,
  trialStart,
  trialEnd,
  currentPeriodEnd,
}) {
  await pool.query(
    `UPDATE subscriptions
     SET stripe_subscription_id = ?,
         plan = ?,
         status = ?,
         trial_start = ?,
         trial_end = ?,
         current_period_end = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE stripe_customer_id = ?`,
    [
      stripeSubscriptionId || null,
      plan,
      status,
      trialStart || null,
      trialEnd || null,
      currentPeriodEnd || null,
      stripeCustomerId,
    ]
  )
}

export function getEffectivePlan(subscription) {
  if (!subscription) return null
  if (asBool(subscription.is_overridden) && subscription.override_plan) return subscription.override_plan
  if (asBool(subscription.is_lifetime)) return subscription.override_plan || subscription.plan || "pro"
  return subscription.plan
}

export function buildSubscriptionAccess(subscription) {
  const base = {
    can_access_app: false,
    starter_access: false,
    pro_access: false,
    trial_days_left: 0,
    effective_plan: null,
    reason: "no_subscription",
  }

  if (!subscription) return base

  const effectivePlan = getEffectivePlan(subscription)
  const now = new Date()
  const trialEnd = subscription.trial_end ? new Date(subscription.trial_end) : null
  const currentPeriodEnd = subscription.current_period_end ? new Date(subscription.current_period_end) : null

  if (asBool(subscription.is_lifetime)) {
    return {
      can_access_app: true,
      starter_access: true,
      pro_access: true,
      trial_days_left: 0,
      effective_plan: effectivePlan || "pro",
      reason: null,
    }
  }

  if (asBool(subscription.is_overridden) && effectivePlan) {
    return {
      can_access_app: true,
      starter_access: true,
      pro_access: effectivePlan === "pro",
      trial_days_left: 0,
      effective_plan: effectivePlan,
      reason: null,
    }
  }

  if (subscription.status === "trialing") {
    if (trialEnd && trialEnd > now) {
      return {
        can_access_app: true,
        starter_access: true,
        pro_access: true,
        trial_days_left: daysBetweenInclusive(trialEnd),
        effective_plan: "pro",
        reason: null,
      }
    }

    return { ...base, effective_plan: effectivePlan, reason: "trial_expired" }
  }

  if (subscription.status === "active") {
    return {
      can_access_app: true,
      starter_access: true,
      pro_access: effectivePlan === "pro",
      trial_days_left: 0,
      effective_plan: effectivePlan,
      reason: null,
    }
  }

  if (subscription.status === "canceled" && currentPeriodEnd && currentPeriodEnd > now) {
    return {
      can_access_app: true,
      starter_access: true,
      pro_access: effectivePlan === "pro",
      trial_days_left: 0,
      effective_plan: effectivePlan,
      reason: null,
    }
  }

  if (subscription.status === "past_due") {
    return { ...base, effective_plan: effectivePlan, reason: "payment_required" }
  }

  return { ...base, effective_plan: effectivePlan, reason: subscription.status || "subscription_inactive" }
}

export function serializeSubscription(subscription) {
  if (!subscription) return null

  return {
    id: subscription.id,
    shop_id: subscription.shop_id,
    stripe_customer_id: subscription.stripe_customer_id,
    stripe_subscription_id: subscription.stripe_subscription_id,
    plan: subscription.plan,
    status: subscription.status,
    trial_start: toIso(subscription.trial_start),
    trial_end: toIso(subscription.trial_end),
    current_period_end: toIso(subscription.current_period_end),
    is_lifetime: asBool(subscription.is_lifetime),
    is_overridden: asBool(subscription.is_overridden),
    override_plan: subscription.override_plan || null,
    effective_plan: getEffectivePlan(subscription),
    created_at: toIso(subscription.created_at),
    updated_at: toIso(subscription.updated_at),
  }
}

export async function getSubscriptionSnapshot(shopId) {
  const subscription = await getSubscriptionByShopId(shopId)
  return {
    subscription: serializeSubscription(subscription),
    access: buildSubscriptionAccess(subscription),
  }
}
