/**
 * RevenueCat IAP provider — web/Google Play billing.
 * Uses @revenuecat/purchases-js (web SDK).
 * Works in Capacitor webview — Google Play handles the actual payment.
 */

import type { IAPProvider } from "./IAPService";

const SUB_KEY = "kot_ucheniy_sub_active";
const ENTITLEMENT_ID = "premium_cat";
const SUBSCRIPTION_ID = "com.kotucheniy.premium.monthly";

export const revenueCatProvider: IAPProvider = {
  name: "RevenueCat (Google Play)",

  async init(config: Record<string, string>): Promise<void> {
    try {
      const { Purchases } = await import("@revenuecat/purchases-js");
      await Purchases.configure({
        apiKey: config.revenuecat_api_key || "",
        appUserID: null, // anonymous
      });
      console.log("[IAP] RevenueCat initialized");
    } catch (err) {
      console.warn("[IAP] RevenueCat init failed:", err);
    }
  },

  async isSubscribed(): Promise<boolean> {
    try {
      const { Purchases } = await import("@revenuecat/purchases-js");
      const info = await Purchases.getCustomerInfo();
      return info.customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    } catch {
      return false;
    }
  },

  async purchaseSubscription(productId: string = SUBSCRIPTION_ID): Promise<boolean> {
    try {
      const { Purchases } = await import("@revenuecat/purchases-js");
      const offerings = await Purchases.getOfferings();
      const currentOffering = offerings.current;
      if (!currentOffering) throw new Error("No offerings available");

      const packageToBuy = currentOffering.availablePackages.find(
        (p) => p.identifier === productId || p.product.identifier === productId
      ) || currentOffering.availablePackages[0];

      if (!packageToBuy) throw new Error("Package not found");

      const result = await Purchases.purchasePackage(packageToBuy);
      const isActive = result.customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;

      if (isActive) {
        localStorage.setItem(SUB_KEY, "true");
      }

      return isActive;
    } catch (err) {
      console.warn("[IAP] Purchase failed:", err);
      return false;
    }
  },

  async restorePurchases(): Promise<boolean> {
    try {
      const { Purchases } = await import("@revenuecat/purchases-js");
      const info = await Purchases.restorePurchases();
      const isActive = info.entitlements.active[ENTITLEMENT_ID] !== undefined;
      if (isActive) {
        localStorage.setItem(SUB_KEY, "true");
      } else {
        localStorage.removeItem(SUB_KEY);
      }
      return isActive;
    } catch {
      return false;
    }
  },

  async getSubscriptionInfo() {
    try {
      const { Purchases } = await import("@revenuecat/purchases-js");
      const info = await Purchases.getCustomerInfo();
      const active = info.customerInfo.entitlements.active[ENTITLEMENT_ID];
      if (active) {
        return {
          active: true,
          productId: active.productIdentifier,
          expiresAt: active.expirationDate
            ? new Date(active.expirationDate).getTime()
            : undefined,
        };
      }
      return { active: false };
    } catch {
      return { active: false };
    }
  },
};
