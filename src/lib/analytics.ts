export type AnalyticsEvent = "vehicle_view" | "whatsapp_click" | "phone_click" | "favorite" | "filter_used" | "search" | "share";

// Intentionally inert until the owner selects a consent-aware analytics vendor.
export function track(event: AnalyticsEvent, data?: Record<string, string | number | boolean>) { void event; void data; }
