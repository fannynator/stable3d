/**
 * IAP Manager — auto-detects the payment provider based on platform.
 * Capacitor Android → RuStore (native) or RevenueCat (Google Play)
 * Web browser → RevenueCat (web)
 * Default → localStorage stub
 */

import type { IAPProvider } from "./IAPService";
import { setIAPProvider, getIAPProvider } from "./IAPService";
import { revenueCatProvider } from "./IAP-RevenueCat";
import { rustoreProvider } from "./IAP-RuStore";

const CONFIG_KEY = "kot_ucheniy_iap_config";

interface IAPConfig {
  platform: "web" | "capacitor";
  revenuecat_api_key?: string;
  rustore_app_id?: string;
  subscription_id: string;
}

const DEFAULT_CONFIG: IAPConfig = {
  platform: "web",
  subscription_id: "com.kotucheniy.premium.monthly",
};

export async function initIAP(): Promise<void> {
  if (getIAPProvider()) return; // already initialized

  let config: IAPConfig = DEFAULT_CONFIG;
  try {
    const saved = localStorage.getItem(CONFIG_KEY);
    if (saved) config = { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
  } catch {}

  // Auto-detect platform
  const isCapacitor = typeof (window as any).Capacitor !== "undefined";
  config.platform = isCapacitor ? "capacitor" : "web";

  // Choose provider
  let provider: IAPProvider;

  if (config.platform === "capacitor") {
    // Capacitor Android: RuStore (native billing) or RevenueCat (web fallback)
    // TODO: When RuStore Billing SDK is integrated, switch back to rustoreProvider
    const useRuStore = false; // Set true after integrating ru.rustore.sdk:billing
    provider = useRuStore ? rustoreProvider : revenueCatProvider;
    console.log("[IAP] Using", provider.name, "for Capacitor");
  } else {
    // Web: use RevenueCat
    provider = revenueCatProvider;
    console.log("[IAP] Using", provider.name);
  }

  setIAPProvider(provider);

  try {
    await provider.init(config);
  } catch (err) {
    console.warn("[IAP] Provider init failed, using localStorage fallback:", err);
  }
}

export function saveIAPConfig(config: Partial<IAPConfig>): void {
  const current = localStorage.getItem(CONFIG_KEY);
  const merged = { ...DEFAULT_CONFIG, ...(current ? JSON.parse(current) : {}), ...config };
  localStorage.setItem(CONFIG_KEY, JSON.stringify(merged));
}
