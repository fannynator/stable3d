/**
 * Subscription manager — trial + paid access to cat voice.
 *
 * Trial: 7 days free from first launch.
 * Paid: RevenueCat (web) / RuStore (Android) / localStorage (stub).
 *
 * localStorage keys:
 *   kot_ucheniy_trial_start — ISO date string of first launch
 *   kot_ucheniy_sub_active  — "true" when subscription is active
 *   kot_ucheniy_iap_config  — IAP provider configuration
 */

import { clearLocalCache } from "../core/cache/GlobalCache";

const TRIAL_START_KEY = "kot_ucheniy_trial_start";
const SUB_ACTIVE_KEY = "kot_ucheniy_sub_active";
const TRIAL_DAYS = 7;

export type SubscriptionStatus = "trial" | "active" | "expired";

export function getSubscriptionStatus(): SubscriptionStatus {
  if (localStorage.getItem(SUB_ACTIVE_KEY) === "true") return "active";

  const trialStart = localStorage.getItem(TRIAL_START_KEY);
  if (!trialStart) return "expired";

  const start = new Date(trialStart).getTime();
  const now = Date.now();
  const elapsedDays = (now - start) / (1000 * 60 * 60 * 24);

  if (elapsedDays < TRIAL_DAYS) return "trial";
  return "expired";
}

export function startTrial(): void {
  localStorage.setItem(TRIAL_START_KEY, new Date().toISOString());
  localStorage.setItem(SUB_ACTIVE_KEY, "true");
}

export async function activateSubscription(): Promise<void> {
  const { initIAP } = await import("../core/payments/IAPManager");
  await initIAP();
  const { getIAPProvider } = await import("../core/payments/IAPService");
  const provider = getIAPProvider();
  if (provider) {
    await provider.purchaseSubscription();
  } else {
    localStorage.setItem(SUB_ACTIVE_KEY, "true");
  }
}

export async function deactivateSubscription(): Promise<void> {
  localStorage.removeItem(SUB_ACTIVE_KEY);
  localStorage.removeItem(TRIAL_START_KEY);
  try { indexedDB.deleteDatabase("transformers-cache"); } catch {}
  clearLocalCache();
}

export function getAIEngine(): "deepseek" | "llama" | "local" {
  const status = getSubscriptionStatus();
  if (status === "active" && navigator.onLine) return "deepseek";
  if ((status === "trial" || status === "active") && !navigator.onLine) return "llama";
  if (status === "trial") return "llama";
  return "local";
}

export function canUseVoice(): boolean {
  const status = getSubscriptionStatus();
  return status === "trial" || status === "active";
}

export function canUsePremiumAI(): boolean {
  return getSubscriptionStatus() === "active" && navigator.onLine;
}

export function shouldDownloadLlama(): boolean {
  return getSubscriptionStatus() !== "expired";
}

export function getTrialDaysLeft(): number {
  const trialStart = localStorage.getItem(TRIAL_START_KEY);
  if (!trialStart) return 0;
  const start = new Date(trialStart).getTime();
  const now = Date.now();
  const elapsedDays = (now - start) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.ceil(TRIAL_DAYS - elapsedDays));
}
