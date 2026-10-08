import api from "../api"

const subscriptionApi = {
  getStatus: () => api.get("/subscriptions/me"),
  createCheckoutSession: (plan) => api.post("/subscriptions/create-checkout-session", { plan }),
  createPortalSession: () => api.post("/subscriptions/create-portal-session"),
}

export default subscriptionApi
