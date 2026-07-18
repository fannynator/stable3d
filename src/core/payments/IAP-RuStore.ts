/**
 * RuStore IAP provider — native Capacitor plugin.
 *
 * RuStore uses its own billing API (not Google Play).
 * This provider is a STUB until native integration is complete.
 *
 * For integration, you need:
 *   1. RuStore Developer account + app registered
 *       https://www.rustore.ru/help/sdk/payments/developer-guide/
 *   2. Capacitor plugin (custom native bridge) or @nicepapa/rustore-client
 *   3. Add to android/app/build.gradle:
 *       implementation 'ru.rustore.sdk:billing:8.2.0'
 *   4. Add to AndroidManifest.xml:
 *       <uses-permission android:name="com.android.vending.BILLING" /> (already added)
 *
 * Status: STUB — falls back to localStorage. Currently using RevenueCat
 * instead via IAPManager. Switch `useRuStore` flag in IAPManager when ready.
 */

import type { IAPProvider } from "./IAPService";

const SUB_KEY = "kot_ucheniy_sub_active";

export const rustoreProvider: IAPProvider = {
  name: "RuStore (native)",

  async init(_config: Record<string, string>): Promise<void> {
    console.log("[IAP] RuStore provider stub — using localStorage fallback");
    // When native plugin is ready:
    // const { RustorePlugin } = await import("@nicepapa/rustore-client");
    // await RustorePlugin.initialize({ appId: config.rustore_app_id });
  },

  async isSubscribed(): Promise<boolean> {
    // When native plugin is ready:
    // const status = await RustorePlugin.getSubscriptionStatus();
    // return status.active;
    return localStorage.getItem(SUB_KEY) === "true";
  },

  async purchaseSubscription(_productId: string): Promise<boolean> {
    // When native plugin is ready:
    // const result = await RustorePlugin.purchaseSubscription({
    //   sku: _productId,
    //   orderId: crypto.randomUUID(),
    // });
    // return result.success;
    console.warn("[IAP] RuStore purchase not yet implemented — simulate");
    localStorage.setItem(SUB_KEY, "true");
    return true;
  },

  async restorePurchases(): Promise<boolean> {
    // When native plugin is ready:
    // const purchases = await RustorePlugin.getOwnedPurchases();
    // return purchases.some(p => p.type === "subscription" && p.active);
    return localStorage.getItem(SUB_KEY) === "true";
  },

  async getSubscriptionInfo() {
    return { active: localStorage.getItem(SUB_KEY) === "true" };
  },
};
