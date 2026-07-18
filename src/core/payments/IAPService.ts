/**
 * IAP (In-App Purchase) service — abstract interface for payment providers.
 * Allows swapping RevenueCat ↔ RuStore ↔ any other provider without touching UI.
 */

export interface IAPProvider {
  name: string;
  /** Initialize the provider (set up API keys, etc.) */
  init(config: Record<string, string>): Promise<void>;
  /** Check if user has active subscription */
  isSubscribed(): Promise<boolean>;
  /** Start subscription purchase flow */
  purchaseSubscription(productId: string): Promise<boolean>;
  /** Restore previous purchases (after reinstall) */
  restorePurchases(): Promise<boolean>;
  /** Get current subscription details */
  getSubscriptionInfo(): Promise<{ active: boolean; productId?: string; expiresAt?: number }>;
}

/** Singleton provider instance */
let currentProvider: IAPProvider | null = null;

export function setIAPProvider(provider: IAPProvider): void {
  currentProvider = provider;
}

export function getIAPProvider(): IAPProvider | null {
  return currentProvider;
}

/** Quick check — no async, just reads from localStorage */
export function isSubscribedSync(): boolean {
  return localStorage.getItem("kot_ucheniy_sub_active") === "true";
}
