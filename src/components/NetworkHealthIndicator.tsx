import React, { useState, useEffect, useRef } from "react";
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  RefreshCw, 
  Settings, 
  CheckCircle2, 
  Info, 
  Clock, 
  Database,
  Unplug,
  Key
} from "lucide-react";

interface PingHistoryItem {
  timestamp: string;
  latency: number;
  status: "success" | "warning" | "error" | "offline";
}

interface NetworkHealthIndicatorProps {
  onSystemLog?: (message: string) => void;
}

export const NetworkHealthIndicator: React.FC<NetworkHealthIndicatorProps> = ({ onSystemLog }) => {
  const [latency, setLatency] = useState<number | null>(null);
  const [status, setStatus] = useState<"success" | "warning" | "error" | "offline">("success");
  const [isPinging, setIsPinging] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [history, setHistory] = useState<PingHistoryItem[]>([]);
  const [serverMeta, setServerMeta] = useState<any>(null);
  const [lastChecked, setLastChecked] = useState<string>("");

  // Simulation flags (stored in local state but mirrors to window)
  const [simulateOffline, setSimulateOffline] = useState(() => {
    return (window as any).SIMULATE_OFFLINE || false;
  });
  const [simulateLatency, setSimulateLatency] = useState(() => {
    return (window as any).SIMULATE_LATENCY || false;
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isTestingApiKey, setIsTestingApiKey] = useState(false);
  const [apiKeyTestResult, setApiKeyTestResult] = useState<any>(null);

  const testApiKey = async () => {
    if (isTestingApiKey) return;
    setIsTestingApiKey(true);
    setApiKeyTestResult(null);
    try {
      const response = await fetch("/api/test-api-key");
      const data = await response.json();
      setApiKeyTestResult(data);
      if (onSystemLog) {
        onSystemLog(data.success 
          ? `🔑 تست سلامت API Key: ${data.message} (پاسخ مدل: ${data.response || ""})`
          : `⚠️ تست سلامت API Key شکست خورد: ${data.message} | خطای فنی: ${data.error || ""}`
        );
      }
    } catch (error: any) {
      console.error("API key test failed on client:", error);
      const errRes = {
        success: false,
        configured: false,
        message: "خطا در برقراری ارتباط با سرور جهت آزمایش کلید.",
        error: error.message
      };
      setApiKeyTestResult(errRes);
      if (onSystemLog) {
        onSystemLog(`❌ خطا در ارتباط برای آزمایش کلید API Key: ${error.message}`);
      }
    } finally {
      setIsTestingApiKey(false);
    }
  };

  // Synchronize state with window globals
  useEffect(() => {
    (window as any).SIMULATE_OFFLINE = simulateOffline;
    if (onSystemLog) {
      onSystemLog(simulateOffline 
        ? "⚠️ شبیه‌ساز قطعی کانال ارتباطی فعال شد. تمام فراخوان‌های API کلاینت با خطای ساختگی مواجه خواهند شد." 
        : "✅ شبکه شبیه‌ساز قطعی غیرفعال شد. ارتباط با سرور عادی است."
      );
    }
  }, [simulateOffline]);

  useEffect(() => {
    (window as any).SIMULATE_LATENCY = simulateLatency;
    if (onSystemLog) {
      onSystemLog(simulateLatency 
        ? "⏳ شبیه‌ساز تاخیر بالا (+۱.۵ ثانیه) فعال شد. پایشگر زمان بازگشت پینگ طولانی‌تری ثبت می‌کند." 
        : "✅ شبکه شبیه‌ساز سرعت بالا غیرفعال شد."
      );
    }
  }, [simulateLatency]);

  // Click outside listener for the dropdown container
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDetails(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const measurePing = async (isManual = false) => {
    if (isPinging) return;
    setIsPinging(true);

    const startTime = Date.now();
    const currentTimeStr = new Date().toLocaleTimeString("fa-IR");

    try {
      // If we are simulating an offline state, directly throw a network error
      if (simulateOffline) {
        throw new TypeError("Failed to fetch (Simulated Offline Force Exception)");
      }

      // We append a query param to avoid client caching of health endpoint response
      const response = await fetch(`/api/health?_t=${startTime}`);
      
      if (!response.ok) {
        throw new Error(`Server returned faulty status: ${response.status}`);
      }

      const data = await response.json();
      setServerMeta(data);

      let actualLatency = Date.now() - startTime;

      // Inject artificial latency if requested
      if (simulateLatency) {
        actualLatency += 1500;
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      setLatency(actualLatency);
      setLastChecked(currentTimeStr);

      let currentStatus: "success" | "warning" | "error" = "success";
      if (actualLatency > 500) {
        currentStatus = "error";
      } else if (actualLatency > 150) {
        currentStatus = "warning";
      }

      setStatus(currentStatus);

      // Cache historical metric
      const newItem: PingHistoryItem = {
        timestamp: currentTimeStr,
        latency: actualLatency,
        status: currentStatus,
      };
      setHistory(prev => [newItem, ...prev.slice(0, 8)]);

      if (isManual && onSystemLog) {
        onSystemLog(`⚙️ پینگ دستی سرور مرکزی برقرار شد. زمان برگشت: ${actualLatency}ms | وضعیت: ${currentStatus === 'success' ? 'ایده‌آل' : currentStatus === 'warning' ? 'تاخیر جزئی' : 'هشدار تاخیر'}`);
      }
    } catch (error: any) {
      console.warn("Periodic ping failed:", error);
      setStatus("offline");
      setLatency(null);
      setLastChecked(currentTimeStr);

      const newItem: PingHistoryItem = {
        timestamp: currentTimeStr,
        latency: 0,
        status: "offline",
      };
      setHistory(prev => [newItem, ...prev.slice(0, 8)]);

      if (onSystemLog) {
        onSystemLog(`❌ کانال ارتباطی کابل شبکه یا پورت سرور عمران آذرستان مسدود است. دلیل لایه‌بندی: ${error?.message || "XHR Error"}`);
      }
    } finally {
      setIsPinging(false);
    }
  };

  // Run ping on start and set intervals
  useEffect(() => {
    measurePing();
    const interval = setInterval(() => {
      measurePing();
    }, 12000); // Check every 12 seconds
    return () => clearInterval(interval);
  }, [simulateOffline, simulateLatency]);

  // Style helpers based on current status
  const getStatusColor = () => {
    switch (status) {
      case "success":
        return {
          bg: "bg-emerald-500",
          text: "text-emerald-400",
          border: "border-emerald-500/20",
          pings: "bg-emerald-400",
          badge: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
        };
      case "warning":
        return {
          bg: "bg-amber-500",
          text: "text-amber-400",
          border: "border-amber-500/20",
          pings: "bg-amber-400",
          badge: "bg-amber-500/10 text-amber-400 border border-amber-500/20"
        };
      case "error":
        return {
          bg: "bg-rose-500",
          text: "text-rose-400",
          border: "border-rose-500/20",
          pings: "bg-rose-400",
          badge: "bg-rose-500/10 text-rose-400 border border-rose-500/20"
        };
      case "offline":
      default:
        return {
          bg: "bg-slate-500",
          text: "text-slate-400",
          border: "border-slate-500/20",
          pings: "bg-slate-400",
          badge: "bg-slate-500/10 text-slate-400 border border-slate-500/20"
        };
    }
  };

  const currentStyles = getStatusColor();

  return (
    <div className="relative font-sans text-right" ref={dropdownRef}>
      {/* Small Inline Widget Trigger */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`flex items-center gap-2 px-2.5 py-1 rounded bg-[#0d1645] hover:bg-[#152063] transition-colors duration-200 border cursor-pointer select-none transition-all ${
          status === "offline" ? "border-rose-500/40 animate-pulse bg-rose-950/20" : "border-white/10"
        }`}
        title="نمایش جزئیات پالس شبکه و ترافیک عمران آذرستان"
      >
        <span className="relative flex h-2 w-2">
          {status !== "offline" && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${currentStyles.pings}`}></span>
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${currentStyles.bg}`}></span>
        </span>
        
        <div className="flex items-center gap-1.5 md:gap-2">
          <span className="text-white/80 font-mono text-[10px] hidden sm:inline">
            {status === "offline" ? "Offline" : `${latency !== null ? `${latency}ms` : "..."}`}
          </span>
          <span className={`text-[10px] font-bold ${currentStyles.text}`}>
            {status === "success" && "اتصال ایده‌آل"}
            {status === "warning" && "تاخیر بالا"}
            {status === "error" && "اختلال جزیی"}
            {status === "offline" && "قطع ارتباط عمران آذرستان"}
          </span>
          <Activity className={`h-3 w-3 text-white/50 ${isPinging ? "animate-spin text-cyan-400" : ""}`} />
        </div>
      </button>

      {/* Popover Details Panel */}
      {showDetails && (
        <div className="absolute left-0 mt-2 w-72 sm:w-80 bg-slate-900 border border-slate-700/60 rounded-lg shadow-xl z-50 overflow-hidden text-right transform origin-top-left transition-all text-xs">
          {/* Header */}
          <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw 
                className={`h-3.5 w-3.5 text-slate-400 cursor-pointer hover:text-white transition-all ${isPinging ? "animate-spin text-cyan-400" : ""}`}
                onClick={() => measurePing(true)}
              />
              <span className="text-[10px] text-slate-400 font-mono" dir="ltr">Check: {lastChecked || "---"}</span>
            </div>
            <h4 className="font-bold text-slate-100 flex items-center gap-1.5">
              <Wifi className="h-4 w-4 text-[#4facfe]" />
              پالس مانیتورینگ شبکه مرکزی
            </h4>
          </div>

          <div className="p-4 space-y-4">
            {/* Status overview */}
            <div className="flex items-center justify-between p-2 rounded bg-slate-950/40 border border-slate-800">
              <div className="flex flex-col text-left font-mono" dir="ltr">
                <span className="text-[10px] text-slate-500">RTT Latency</span>
                <span className="font-bold text-white text-sm">
                  {status === "offline" ? "ERR" : `${latency !== null ? `${latency} ms` : "---"}`}
                </span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[10px] text-slate-400 font-medium">پینگ سرور عمران آذرستان</span>
                <span className={`text-xs font-bold ${currentStyles.text}`}>
                  {status === "success" && "پاسخ رکوردر همزمان پویا"}
                  {status === "warning" && "تاخیر نسبتاً بالا"}
                  {status === "error" && "مسیردهی غیراستاندارد"}
                  {status === "offline" && "سرور در دسترس نمی باشد"}
                </span>
              </div>
            </div>

            {/* Simulated server counters */}
            <div className="space-y-1.5 text-slate-300">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-mono text-slate-400">{status === "offline" ? "Offline" : "Windows Server IIS"}</span>
                <span className="text-slate-400">شناور وب‌سرور مبدأ:</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-mono text-slate-400">{serverMeta?.active_connections || "0"}</span>
                <span className="text-slate-400">میزان اتصالات همزمان:</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-mono text-emerald-400">{serverMeta?.status || "disconnected"}</span>
                <span className="text-slate-400">وضعیت سلامت فریمورک:</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-mono text-slate-400">
                  {serverMeta?.gemini_ai_status === "connected" ? "فعال/کلید اختصاصی" : "شبیه‌ساز هوشمند محلی"}
                </span>
                <span className="text-slate-400">کانکشن پایپ‌لاین هوش مصنوعی:</span>
              </div>
            </div>

            {/* API Key Health Test Section */}
            <div className="space-y-2 border-t border-slate-800 pt-3">
              <div className="flex items-center justify-between">
                <button
                  onClick={testApiKey}
                  disabled={isTestingApiKey}
                  className="bg-indigo-600/80 hover:bg-indigo-600 disabled:bg-slate-800 text-white font-extrabold px-2.5 py-1.5 rounded-md text-[10px] flex items-center gap-1 transition-all cursor-pointer border border-indigo-500/20 shadow-sm active:scale-95"
                >
                  {isTestingApiKey ? (
                    <>
                      <RefreshCw className="h-3 w-3 animate-spin text-cyan-400" />
                      <span>در حال بررسی...</span>
                    </>
                  ) : (
                    <>
                      <Key className="h-3 w-3 text-indigo-200" />
                      <span>آزمایش کلید (Live Test)</span>
                    </>
                  )}
                </button>
                <span className="text-[10px] text-slate-400 font-medium">تست سلامت کلید Gemini:</span>
              </div>

              {apiKeyTestResult && (
                <div className={`p-2 rounded border text-[10px] leading-relaxed animate-fade-in ${
                  apiKeyTestResult.success 
                    ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300" 
                    : "bg-rose-950/20 border-rose-500/30 text-rose-300"
                }`}>
                  <div className="flex items-start gap-1.5 justify-start">
                    {apiKeyTestResult.success ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold">{apiKeyTestResult.message}</p>
                      {apiKeyTestResult.success && apiKeyTestResult.response && (
                        <p className="text-[9px] text-emerald-400/80 font-mono mt-0.5" dir="ltr">
                          Response: "{apiKeyTestResult.response}"
                        </p>
                      )}
                      {!apiKeyTestResult.success && apiKeyTestResult.error && (
                        <p className="text-[9px] text-rose-400/80 font-mono mt-0.5" dir="ltr">
                          Error: {apiKeyTestResult.error}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Diagnostic Spark History */}
            <div className="space-y-1.5 border-t border-slate-800 pt-3">
              <span className="text-[10px] text-slate-400 font-medium block">وقایع‌نگار پینگ‌های اخیر:</span>
              <div className="flex items-center justify-start gap-1 flex-row-reverse" dir="ltr">
                {history.length === 0 ? (
                  <span className="text-[10px] text-slate-500">تاریخچه مانیتورینگ تهی است...</span>
                ) : (
                  history.map((h, i) => (
                    <div 
                      key={i} 
                      className={`h-5 w-5 rounded flex items-center justify-center text-[8px] font-mono font-bold text-white relative group select-all ${
                        h.status === 'success' ? 'bg-emerald-600/80 hover:bg-emerald-500' :
                        h.status === 'warning' ? 'bg-amber-600/80 hover:bg-amber-500' :
                        h.status === 'error' ? 'bg-rose-600/80 hover:bg-rose-500' :
                        'bg-slate-700/80 hover:bg-slate-600'
                      }`}
                      title={`${h.timestamp} - ${h.latency}ms`}
                    >
                      {h.status === 'offline' ? 'X' : h.latency}
                      {/* Tooltip on hover */}
                      <span className="absolute bottom-6 left-1/2 transform -translate-x-1/2 scale-0 group-hover:scale-100 transition-all bg-black text-white text-[9px] px-1 py-0.5 rounded whitespace-nowrap z-50 pointer-events-none">
                        {h.latency > 0 ? `${h.latency} ms` : "قطعی"} ({h.timestamp})
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Diagnostic SIMULATION parameters */}
            <div className="space-y-2 border-t border-slate-800 pt-3 bg-slate-950/20 p-2.5 rounded border border-slate-800/40">
              <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                <Settings className="h-3 w-3" />
                آزمایشگاه تست پایداری و خودکاربردی
              </span>
              <p className="text-[9px] text-slate-400 leading-relaxed">
                جهت شبیه‌سازی رخ‌دادن خطای اتصال مجدد شبکه (CORS / XHR Error) و مشاهده رفتار مکانیسم خودکار اتصال مجدد برنامه، کنترل‌های زیر را فعال کنید:
              </p>

              <div className="space-y-2 pt-1 font-mono">
                {/* Simulated Disconnect */}
                <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white transition-colors">
                  <input 
                    type="checkbox" 
                    checked={simulateOffline}
                    onChange={(e) => setSimulateOffline(e.target.checked)}
                    className="rounded border-slate-700 text-rose-500 bg-slate-950 focus:ring-0 cursor-pointer h-3.5 w-3.5"
                  />
                  <span className="text-[10px] text-right flex items-center gap-1">
                    <Unplug className="h-3 w-3 text-rose-400" />
                    شبیه‌سازی قطعی سخت‌افزاری شبکه
                  </span>
                </label>

                {/* Simulated High Latency */}
                <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white transition-colors">
                  <input 
                    type="checkbox" 
                    checked={simulateLatency}
                    onChange={(e) => setSimulateLatency(e.target.checked)}
                    className="rounded border-slate-700 text-amber-500 bg-slate-950 focus:ring-0 cursor-pointer h-3.5 w-3.5"
                  />
                  <span className="text-[10px] text-right flex items-center gap-1">
                    <Clock className="h-3 w-3 text-amber-400" />
                    شبیه‌سازی تاخیر شدید شبکه (+۱.۵ثانیه)
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Footer of card */}
          <div className="bg-slate-950 px-4 py-2 border-t border-slate-800 text-[10px] text-center text-slate-400">
            طراحی شده با الگوهای خودکار پایداری شبکه عمران آذرستان
          </div>
        </div>
      )}
    </div>
  );
};
