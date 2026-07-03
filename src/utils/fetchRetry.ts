export interface FetchRetryOptions extends RequestInit {
  retries?: number;
  backoffMs?: number;
  onLog?: (message: string) => void;
  endpointLabel?: string;
}

/**
 * Enhanced fetch wrapper that provides intelligent automatic retrying,
 * exponential backoff, granular console logs, and UI logger notifications.
 * It detects connection issues and potential CORS failures to help diagnostics.
 */
export async function fetchWithRetry(
  url: string,
  options: FetchRetryOptions = {}
): Promise<Response> {
  const {
    retries = 3,
    backoffMs = 600,
    onLog = console.log,
    endpointLabel = url,
    ...fetchOptions
  } = options;

  let lastError: any = null;

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      if (attempt > 1) {
        onLog(`[RETRY] [تلاش مجدد ${attempt - 1} از ${retries}] درخواست مجدد به ${endpointLabel} ...`);
      }

      // Intercept if offline simulation is toggled in the Network Health custom component
      if ((window as any).SIMULATE_OFFLINE) {
        throw new TypeError("Failed to fetch (شبکه‌ساز آزمایشی کایسون: وضعیت شبیه‌سازی قطعی فعال است)");
      }

      // Intercept if high latency simulation is toggled
      if ((window as any).SIMULATE_LATENCY) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      // Execute actual fetch request
      const response = await fetch(url, fetchOptions);

      // Handle successful status
      if (response.ok) {
        // Log minor success quietly on sub-routines, or verbose for primary endpoints
        onLog(`[성공/OK] ارتباط موفق با ${endpointLabel} در تلاش شماره ${attempt} و وضعیت ${response.status}`);
        return response;
      }

      // Handle 5xx errors (server-side timeouts/server restarts are transient and retriable)
      if (response.status >= 500 && response.status <= 599) {
        const errorText = await response.clone().text().catch(() => "No response body");
        throw new Error(`خطای سرور ۵xx (وضعیت: ${response.status}) - ${errorText || "جزییات تهی"}`);
      }

      // Handle 4xx client errors (do not retry, since they are structured bad requests, validation or auth)
      onLog(`[کلاینت] وضعیت ${response.status} برای هدر ${endpointLabel} (عدم تکرار به علت ماهیت خطای کلاینت)`);
      return response;

    } catch (err: any) {
      lastError = err;
      
      // Look for indicators of CORS blocks, network dropouts, or domain resolution failures
      const errString = String(err?.message || err || "").toLowerCase();
      const isNetworkError = 
        err instanceof TypeError || 
        errString.includes("failed to fetch") || 
        errString.includes("networkerror") || 
        errString.includes("xhr") || 
        errString.includes("cors");

      let details = `خطای عمومی: ${err.message || err}`;
      if (isNetworkError) {
        details = `[اختلال شبکه/CORS/اتصال مبدا] ارتباط مسدود شد یا سرور در دسترس نیست. دلایل احتمالی: عدم وجود هدرهای مجاز CORS در سرور، مسدودی فایروال یا قطعی اتصال.`;
      }

      const logMsg = `[خطا در تلاش ${attempt}/${retries + 1}] برای "${endpointLabel}": ${details}`;
      onLog(logMsg);
      console.warn(logMsg, err);

      if (attempt <= retries) {
        // Jittered exponential backoff
        const delay = backoffMs * Math.pow(2, attempt - 1) * (0.85 + Math.random() * 0.3);
        onLog(`⏳ انتظار به مدت ${Math.round(delay)} میلی‌ثانیه برای تلاش مجدد...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // All opportunities exhausted
  const finalMsg = `❌ [شکست نهایی پس از ${retries} تکرار] برای "${endpointLabel}": آخرین خطا -> ${lastError?.message || lastError}`;
  onLog(finalMsg);
  
  // Re-throw last encountered error so calling functions know about physical failure
  throw lastError || new Error(finalMsg);
}
