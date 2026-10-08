import { getSubscriptionSnapshot } from "../services/subscriptionService.js"

export function checkSubscription(options = {}) {
  const { requiredPlan = "starter" } = options

  return async (req, res, next) => {
    try {
      const snapshot = await getSubscriptionSnapshot(req.shop.id)
      req.subscription = snapshot.subscription
      req.subscriptionAccess = snapshot.access

      if (!snapshot.access.can_access_app) {
        return res.status(402).json({
          message:
            snapshot.access.reason === "trial_expired"
              ? "Your 30-day free trial has ended. Choose a plan to continue using GarageFlow."
              : "An active subscription is required to access GarageFlow.",
          code: snapshot.access.reason || "subscription_required",
          subscription: snapshot.subscription,
          access: snapshot.access,
        })
      }

      if (requiredPlan === "pro" && !snapshot.access.pro_access) {
        return res.status(403).json({
          message: "This feature is available on the Pro plan.",
          code: "plan_upgrade_required",
          subscription: snapshot.subscription,
          access: snapshot.access,
        })
      }

      next()
    } catch (error) {
      console.error(error)
      res.status(500).json({ message: "Failed to validate subscription access" })
    }
  }
}
