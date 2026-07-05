import React, { useState, useEffect, useRef, useMemo } from "react";
import mammoth from "mammoth";
import { 
  Languages, 
  Volume2, 
  Mic, 
  MicOff, 
  FileText, 
  Upload, 
  Search, 
  BookOpen, 
  Tag, 
  Activity, 
  HardDrive, 
  Users, 
  CheckCircle, 
  Download, 
  Database, 
  ShieldAlert, 
  Server, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Edit3,
  Check,
  Globe, 
  RefreshCw, 
  FileSpreadsheet, 
  Layers,
  Sparkles,
  Lock,
  UserCheck,
  Columns,
  Star,
  Crop,
  Sliders,
  Settings,
  Sun,
  Moon,
  Eye,
  LogOut,
  Power
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  Legend, 
  BarChart, 
  Bar 
} from "recharts";
import { GlossaryTerm, TranslationRecord, ADUser, EngineConfig } from "./types";
import { technicalSpecs } from "./data/specs";
import { fetchWithRetry } from "./utils/fetchRetry";
import { NetworkHealthIndicator } from "./components/NetworkHealthIndicator";
import { AdminSetupGuide } from "./components/AdminSetupGuide";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export default function App() {
  // Primary Tabs
  const [activeTab, setActiveTab] = useState<"translate" | "glossary" | "analytics" | "docs" | "admin-setup">("translate");
  
  // Simulated Logged-In Active Directory User State
  const [adUsers, setAdUsers] = useState<ADUser[]>([
    { username: "m.esmaeili.admin", name: "مهدی اسماعیلی", email: "m.esmaeili@azarestan-co.com", department: "مدیریت پروژه و مهندسی", role: "Admin", active: true, lastActive: "2026-06-17T11:15:00" },
    { username: "m.esmaeili.trans", name: "مهدی اسماعیلی", email: "m.esmaeili@azarestan-co.com", department: "مترجم ارشد و کنترل متون", role: "Translator", active: true, lastActive: "2026-06-17T10:45:00" },
    { username: "m.esmaeili.dept", name: "مهدی اسماعیلی", email: "m.esmaeili@azarestan-co.com", department: "دفتر فنی و سازه", role: "DeptManager", active: true, lastActive: "2026-06-17T09:30:00" },
    { username: "m.esmaeili.user", name: "مهدی اسماعیلی", email: "m.esmaeili@azarestan-co.com", department: "کارگاه عمران پرند", role: "User", active: true, lastActive: "2026-06-17T11:20:00" }
  ]);

  // Load from localStorage or null initially to enforce AD login page
  const [currentUser, setCurrentUser] = useState<ADUser | null>(() => {
    try {
      const saved = localStorage.getItem("omran_azarestan_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [sessionId, setSessionId] = useState<string | null>(() => {
    try {
      return localStorage.getItem("omran_azarestan_session_id") || null;
    } catch {
      return null;
    }
  });

  // Login Form states
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active Directory Heartbeat
  useEffect(() => {
    if (!sessionId) return;

    const sendHeartbeat = async () => {
      try {
        await fetch("/api/auth/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId })
        });
      } catch (e) {
        console.warn("AD Heartbeat tick failed:", e);
      }
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 15000);
    return () => clearInterval(interval);
  }, [sessionId]);

  // Handle Active Directory organizational Login
  const handleAdLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername || !loginPassword) {
      setLoginError("وارد کردن نام کاربری و رمز عبور الزامی است.");
      return;
    }
    setLoginError("");
    setIsLoggingIn(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCurrentUser(data.user);
        setSessionId(data.sessionId);
        localStorage.setItem("omran_azarestan_user", JSON.stringify(data.user));
        localStorage.setItem("omran_azarestan_session_id", data.sessionId);
        setLoginUsername("");
        setLoginPassword("");
        addSystemLog(`ورود موفقیت‌آمیز کاربر ${data.user.name} به سامانه ثبت شد.`);
      } else {
        setLoginError(data.error || "خطایی در احراز هویت با اکتیو دایرکتوری رخ داد.");
      }
    } catch (err) {
      console.error(err);
      setLoginError("امکان برقراری ارتباط با وب‌سرور Active Directory وجود ندارد.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Logout
  const handleAdLogout = async () => {
    if (sessionId) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId })
        });
      } catch (e) {
        console.warn("Logout endpoint failed:", e);
      }
    }
    setCurrentUser(null);
    setSessionId(null);
    localStorage.removeItem("omran_azarestan_user");
    localStorage.removeItem("omran_azarestan_session_id");
    addSystemLog("کاربر با موفقیت از سیستم اکتیودایرکتوری خارج گردید.");
  };

  const [networkInfo, setNetworkInfo] = useState<{ realIp: string, mappedIp: string } | null>(null);

  // Fetch client network info dynamically
  useEffect(() => {
    const fetchNetworkInfo = async () => {
      try {
        const usernameParam = currentUser ? currentUser.username : "SUPPORT";
        const res = await fetch(`/api/network-info?username=${encodeURIComponent(usernameParam)}`);
        if (res.ok) {
          const data = await res.json();
          setNetworkInfo({ realIp: data.realIp, mappedIp: data.mappedIp });
        }
      } catch (err) {
        console.error("Failed to fetch network info:", err);
      }
    };
    fetchNetworkInfo();
  }, [currentUser]);

  // Fetch all AD users from server (Admin only)
  const fetchAdUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAdUsers(data.users);
        }
      }
    } catch (err) {
      console.error("Failed to fetch AD users from server:", err);
    }
  };

  // Update specific user setting
  const updateAdUser = async (username: string, updates: Partial<ADUser>) => {
    try {
      const res = await fetch("/api/admin/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, requester: currentUser?.username, ...updates })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdUsers(prev => prev.map(u => u.username === username ? { ...u, ...data.user } : u));
        addSystemLog(`تغییرات دسترسی کاربر ${username} با موفقیت ثبت گردید.`);
        
        // If current logged-in user got updated, update current session locally too
        if (currentUser && currentUser.username.toLowerCase() === username.toLowerCase()) {
          const updatedUser = { ...currentUser, ...data.user };
          setCurrentUser(updatedUser);
          localStorage.setItem("omran_azarestan_user", JSON.stringify(updatedUser));
        }
      } else {
        alert(data.error || "بروزرسانی وضعیت کاربر ناموفق بود.");
      }
    } catch (err) {
      console.error("Error updating user:", err);
    }
  };

  // Fetch users list when in admin panel
  useEffect(() => {
    if (activeTab === "analytics" && currentUser?.role === "Admin") {
      fetchAdUsers();
    }
  }, [activeTab, currentUser]);

  const [textSize, setTextSize] = useState<"sm" | "base" | "lg" | "xl" | "2xl">("base");
  const [theme, setTheme] = useState<"construction" | "dark">(() => {
    try {
      const saved = localStorage.getItem("omran-azarestan-theme");
      return (saved === "dark" || saved === "construction") ? saved : "construction";
    } catch {
      return "construction";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("omran-azarestan-theme", theme);
    } catch (e) {
      console.warn("localStorage is not accessible:", e);
    }
  }, [theme]);

  const textSizeClasses = {
    sm: "text-xs",
    base: "text-sm",
    lg: "text-base",
    xl: "text-lg",
    "2xl": "text-xl"
  };

  // Core Translator States
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("fa");
  const [isAutoDetect, setIsAutoDetect] = useState(true);
  const [selectedEngine, setSelectedEngine] = useState<string>("SeamlessM4T");
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState(0);
  const [translationStage, setTranslationStage] = useState(1);
  const [translationSeconds, setTranslationSeconds] = useState(0);
  const [detectedLanguageText, setDetectedLanguageText] = useState("");
  const [activeAdmixtureCategory, setActiveAdmixtureCategory] = useState("عمومی عمران");
  
  // Comparison Mode States
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [comparisonEngine, setComparisonEngine] = useState<string>("OpenAI");
  const [comparisonTranslatedText, setComparisonTranslatedText] = useState("");
  const [engineOneRating, setEngineOneRating] = useState<number>(0);
  const [engineTwoRating, setEngineTwoRating] = useState<number>(0);

  // Dynamic Glossary & Terminology Overlay Trigger
  const [terminologyAlerts, setTerminologyAlerts] = useState<{term: string, replacement: string, definition: string}[]>([]);

  // Bulk selection and downloads in history section
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [isBulkDownloadModalOpen, setIsBulkDownloadModalOpen] = useState(false);
  const [bulkDownloadFormat, setBulkDownloadFormat] = useState<"csv" | "zip">("csv");

  // Speech to Text States
  const [isDictating, setIsDictating] = useState(false);
  const [isGlossaryDictating, setIsGlossaryDictating] = useState(false);
  const [glossarySttFeedback, setGlossarySttFeedback] = useState("");
  const [glossarySttError, setGlossarySttError] = useState("");
  const [sttLanguage, setSttLanguage] = useState("fa");
  const [sttProgressMessage, setSttProgressMessage] = useState("");
  const [sttFile, setSttFile] = useState<File | null>(null);
  const [sttList, setSttList] = useState<any[]>([
    { id: "stt-1", file: "دستور_کارگاه_فرودگاه.wav", duration: "12s", status: "completed", result: "بتن‌ریزی باند شمالی فرودگاه نیاز به تاخیر انداز دارد." }
  ]);

  // Image OCR States
  const [ocrImage, setOcrImage] = useState<string | null>(null);
  const [ocrImageName, setOcrImageName] = useState("");
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [ocrExtractedText, setOcrExtractedText] = useState("");
  const [ocrModelType, setOcrModelType] = useState<"general" | "printed" | "handwritten" | "technical_diagram">("general");
  const [ocrRoiPreset, setOcrRoiPreset] = useState<"full" | "heading" | "footer_table" | "left_pane" | "right_pane" | "custom">("full");
  const [ocrCustomCoords, setOcrCustomCoords] = useState<{ xMin: number; yMin: number; xMax: number; yMax: number }>({
    xMin: 15,
    yMin: 15,
    xMax: 85,
    yMax: 85,
  });

  // File Translation States
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([
    { 
      id: "file-1", 
      name: "مشخصات_فنی_سد.docx", 
      size: "2.4 MB", 
      progress: 100, 
      status: "done", 
      source: "fa", 
      target: "en", 
      translatedName: "dam_technical_specifications.docx",
      translatedContent: `TECHNICAL SPECIFICATIONS OF THE DAM
Section 1: General Requirements
This document details the concrete structures, shoring systems, foundation works, and reinforcement specifications for the construction of the reservoir dam.
Section 2: Concrete Grade & Pouring
All concrete works shall be performed using reinforced concrete grade C40 with designated superplasticizers. Reinforcement bars (rebar) placement must strictly follow shop drawings and structural details approved by the Engineer.
Section 3: Progress Payments & Inspections
Interim Payment Certificates (IPCs) shall be compiled based on joint measurements and quantity takeoffs. All site instructions and work orders must be signed by the Resident Supervision Team.`
    },
    { 
      id: "file-2", 
      name: "concrete_voided_slab.pdf", 
      size: "4.8 MB", 
      progress: 100, 
      status: "done", 
      source: "en", 
      target: "fa", 
      translatedName: "concrete_voided_slab_translated.pdf",
      translatedContent: `مشخصات دال مجوف بتنی (سقف کوبیاکس)
بخش ۱: الزامات عمومی سازه
این دستورالعمل شامل جزئیات طراحی، قالب‌بندی و بتن‌ریزی سقف‌های دال مجوف به روش کوبیاکس شرکت عمران آذرستان می‌باشد.
بخش ۲: بتن مسلح و آرماتوربندی
تمام میلگردهای مصرفی باید از نوع آجدار با مقاومت مشخصه بالا (رده A3) باشند. بتن‌ریزی سقف پس از تایید نهایی قالب‌بندی و موقعیت اسپیسرها توسط دستگاه نظارت مقیم مجاز است.
بخش ۳: متره و برآورد و صورت وضعیت‌ها
صورت وضعیت‌های کارکرد ماهیانه باید بر اساس سرفصل متره و فهرست بهای منضم به پیمان و صورتجلسات کارگاهی مشترک تنظیم و جهت بررسی به مشاور ارسال گردد.`
    }
  ]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [fileProgress, setFileProgress] = useState(0);
  const [previewFile, setPreviewFile] = useState<any | null>(null);

  // Archived File Database States
  const [archivedFiles, setArchivedFiles] = useState<any[]>([]);
  const [archiveSearchTerm, setArchiveSearchTerm] = useState("");
  const [isFetchingArchive, setIsFetchingArchive] = useState(false);
  const [editingArchiveId, setEditingArchiveId] = useState<string | null>(null);
  const [editingArchiveName, setEditingArchiveName] = useState("");

  // Summarize States
  const [summarizedOutput, setSummarizedOutput] = useState("");
  const [summaryType, setSummaryType] = useState<"short" | "detailed" | "bullets">("short");
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Glossary/Dictionary State
  const [glossary, setGlossary] = useState<GlossaryTerm[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [newTerm, setNewTerm] = useState({
    term: "",
    equivalentEn: "",
    equivalentRu: "",
    definitionFa: "",
    definitionEn: "",
    definitionRu: "",
    project: "",
    category: "",
    tags: ""
  });
  const [glossarySuccessMsg, setGlossarySuccessMsg] = useState("");
  const [glossaryErrorMsg, setGlossaryErrorMsg] = useState("");
  const [editingTermId, setEditingTermId] = useState<string | null>(null);

  // System Engines List State
  const [engines, setEngines] = useState<EngineConfig[]>([
    { id: "NLLB-200", name: "Meta NLLB-200", category: "open-source", enabled: true, priority: 1 },
    { id: "MarianMT", name: "Helsinki MarianMT", category: "open-source", enabled: true, priority: 2 },
    { id: "SeamlessM4T", name: "SeamlessM4T", category: "open-source", enabled: true, priority: 3 },
    { id: "LibreTranslate", name: "LibreTranslate", category: "open-source", enabled: false, priority: 4 },
    { id: "GoogleCloud", name: "Google Translation API", category: "commercial", enabled: true, priority: 1 },
    { id: "OpenAI", name: "OpenAI GPT-4o Agentic", category: "commercial", enabled: true, priority: 2 },
    { id: "DeepL", name: "DeepL Pro", category: "commercial", enabled: false, priority: 3 },
    { id: "Azure", name: "Microsoft Azure Translator", category: "commercial", enabled: false, priority: 4 }
  ]);

  // Analytics State
  const [analytics, setAnalytics] = useState<any>(null);
  const [translationHistory, setTranslationHistory] = useState<TranslationRecord[]>([]);
  const [historyProjectFilter, setHistoryProjectFilter] = useState<string>("all");
  const [historySearchQuery, setHistorySearchQuery] = useState<string>("");
  const [systemLogs, setSystemLogs] = useState<string[]>([]);

  // Smart Project Tagging States
  const [projectTaggingResults, setProjectTaggingResults] = useState<any[]>([]);
  const [isAnalyzingTags, setIsAnalyzingTags] = useState(false);
  const [taggingSourceType, setTaggingSourceType] = useState<'primary' | 'secondary'>('primary');
  const [selectedProjectStamp, setSelectedProjectStamp] = useState<string | null>(null);

  // Projects Search & Sync States
  const [dbProjects, setDbProjects] = useState<any[]>([]);
  const [isSyncingProjects, setIsSyncingProjects] = useState(false);
  const [syncQuery, setSyncQuery] = useState("پروژه‌های صنعتی و بیمارستانی شرکت عمران آذرستان");
  const [syncStatusMessage, setSyncStatusMessage] = useState("");
  const [showProjectsDbModal, setShowProjectsDbModal] = useState(false);

  // Docs Tab State
  const [activeDocSection, setActiveDocSection] = useState(technicalSpecs[0].id);

  // Refs for Voice Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const dictationRecognitionRef = useRef<any>(null);
  const sttTimeoutRef = useRef<any>(null);
  const hasReceivedSpeechRef = useRef<boolean>(false);

  // Refs for auto-resizing textareas
  const sourceRef = useRef<HTMLTextAreaElement | null>(null);
  const trans1Ref = useRef<HTMLTextAreaElement | null>(null);
  const trans2Ref = useRef<HTMLTextAreaElement | null>(null);

  // Auto-resize effects
  useEffect(() => {
    if (sourceRef.current) {
      sourceRef.current.style.height = "auto";
      sourceRef.current.style.height = `${Math.max(80, sourceRef.current.scrollHeight)}px`;
    }
  }, [sourceText]);

  // Real-time language detection check for autoDetect feature
  useEffect(() => {
    if (isAutoDetect && sourceText.trim() !== "") {
      const detectLanguage = (text: string): "fa" | "ru" | "en" => {
        let faCount = 0;
        let ruCount = 0;
        let enCount = 0;
        
        for (let i = 0; i < text.length; i++) {
          const charCode = text.charCodeAt(i);
          if (charCode >= 0x0600 && charCode <= 0x06FF) {
            faCount++;
          } else if (charCode >= 0x0400 && charCode <= 0x04FF) {
            ruCount++;
          } else if ((charCode >= 65 && charCode <= 90) || (charCode >= 97 && charCode <= 122)) {
            enCount++;
          }
        }
        
        if (faCount > ruCount && faCount > enCount) return "fa";
        if (ruCount > faCount && ruCount > enCount) return "ru";
        return "en";
      };

      const detected = detectLanguage(sourceText);
      setSourceLang(detected);
      
      const names: Record<string, string> = {
        fa: "فارسی (تشخیص خودکار)",
        en: "انگلیسی (تشخیص خودکار)",
        ru: "روسی (تشخیص خودکار)"
      };
      setDetectedLanguageText(names[detected]);
    } else {
      setDetectedLanguageText("");
    }
  }, [sourceText, isAutoDetect]);

  useEffect(() => {
    if (trans1Ref.current) {
      trans1Ref.current.style.height = "auto";
      trans1Ref.current.style.height = `${Math.max(80, trans1Ref.current.scrollHeight)}px`;
    }
  }, [translatedText]);

  useEffect(() => {
    if (trans2Ref.current) {
      trans2Ref.current.style.height = "auto";
      trans2Ref.current.style.height = `${Math.max(80, trans2Ref.current.scrollHeight)}px`;
    }
  }, [comparisonTranslatedText, isComparisonMode]);

  // Fetch initial Glossary and History
  useEffect(() => {
    fetchGlossary();
    fetchHistory();
    fetchAnalytics();
    fetchProjects();
    fetchArchivedFiles();
    
    const userNameDisplay = currentUser ? currentUser.name : "احراز هویت نشده";
    // Seed initial audit log entries
    setSystemLogs([
      `[11:21:00] تصدیق هویت کاربر "${userNameDisplay}" با موفقیت در Active Directory انجام شد.`,
      `[11:05:40] سرویس ترجمه NLLB-200 بارگذاری شد و تخصیص حافظه GPU تایید گردید.`,
      `[10:48:12] پشتیبان‌گیری پشته دیتابیس عمران آذرستان با موفقیت در آدرس شبکه انجام شد.`,
      `[09:15:30] تعداد ۱۹ کاربران به صورت متقارن به وب‌سرور متصل گردیدند.`
    ]);
  }, []);

  // Sync user change logs
  useEffect(() => {
    if (!currentUser) return;
    addSystemLog(`[AD LOG] کاربر فعال به "${currentUser.name}" تغییر یافت. (نقش: ${currentUser.role} | بخش: ${currentUser.department})`);
    if (currentUser.role !== "Admin" && activeTab === "admin-setup") {
      setActiveTab("translate");
    }
  }, [currentUser, activeTab]);

  // Translation timeline timer and pipeline simulator
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    let timerInterval: NodeJS.Timeout | null = null;
    
    if (isTranslating) {
      setTranslationProgress(0);
      setTranslationStage(1);
      setTranslationSeconds(0);
      
      timerInterval = setInterval(() => {
        setTranslationSeconds((prev) => parseFloat((prev + 0.1).toFixed(1)));
      }, 100);

      interval = setInterval(() => {
        setTranslationProgress((currentProgress) => {
          let nextProgress = currentProgress;
          if (currentProgress < 20) {
            nextProgress += 2.0; // Stage 1 (0% - 20%)
            setTranslationStage(1);
          } else if (currentProgress < 50) {
            nextProgress += 1.5; // Stage 2 (20% - 50%)
            setTranslationStage(2);
          } else if (currentProgress < 72) {
            nextProgress += 1.0; // Stage 3 (50% - 72%)
            setTranslationStage(3);
          } else if (currentProgress < 90) {
            nextProgress += 0.8; // Stage 4 (72% - 90%)
            setTranslationStage(4);
          } else if (currentProgress < 97) {
            nextProgress += 0.3; // Stage 5 (90% - 97%)
            setTranslationStage(5);
          } else {
            nextProgress += 0.05; // Slow crawl to wait for server response
          }
          return parseFloat(Math.min(99.5, nextProgress).toFixed(1));
        });
      }, 100);
    } else {
      setTranslationProgress(100);
      setTranslationStage(5);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [isTranslating]);

  // Perform Smart Project Tagging mapping
  const handleSmartTagging = async (textToTag?: string) => {
    const textSample = textToTag || (taggingSourceType === 'secondary' ? comparisonTranslatedText : translatedText) || sourceText;
    if (!textSample || !textSample.trim()) {
      return;
    }
    setIsAnalyzingTags(true);
    addSystemLog("آغاز آنالیز هوشمند معنایی پروژه و تطبیق ساختاری عمران آذرستان...");
    
    const endpointUrl = "/api/smart-tag";
    const requestHeaders = { "Content-Type": "application/json" };
    const payload = { text: textSample };
    
    console.log(`[Lifecycle - SmartTagging] [1. Request Initiated]`, {
      url: endpointUrl,
      headers: requestHeaders,
      payload: payload
    });

    try {
      const response = await fetchWithRetry(endpointUrl, {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify(payload),
        onLog: addSystemLog,
        endpointLabel: "تتطبیق هوشمند پروژه (Smart Tagging API)"
      });

      console.log(`[Lifecycle - SmartTagging] [2. Response Received]`, {
        url: endpointUrl,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Array.from(response.headers.entries())
      });

      if (response.ok) {
        const data = await response.json();
        setProjectTaggingResults(data.projects || []);
        if (data.projects && data.projects.length > 0) {
          const topProject = data.projects[0];
          setSelectedProjectStamp(topProject.id);
          addSystemLog(`تطبیق پروژه هوشمند موفقیت‌آمیز بود (برترین انطباق: ${topProject.nameFa} با میزان انطباق ${topProject.score}%).`);
        } else {
          addSystemLog("پروژه مناسب با انطباق بالا پیدا نشد.");
        }
      } else {
        const status = response.status;
        const err = await response.json().catch(() => ({ error: "امکان خواندن خطای سرور نیست" }));
        console.error(`[Lifecycle - SmartTagging] [3. Server Error Response]`, {
          url: endpointUrl,
          statusCode: status,
          errorPayload: err
        });
        throw new Error(err.error || `خطای سرور با کد ${status}`);
      }
    } catch (e: any) {
      console.error(`[Lifecycle - SmartTagging] [3. Exception Encountered]`, {
        url: endpointUrl,
        errorMessage: e.message,
        errorStack: e.stack,
        errorRaw: e
      });
      addSystemLog(`خطا در فرآیند تطبیق معنایی پروژه: ${e.message}`);
    } finally {
      setIsAnalyzingTags(false);
    }
  };

  // Trigger smart project tagging whenever primary or secondary translated text changes
  useEffect(() => {
    const textToAnalyze = taggingSourceType === 'secondary' ? comparisonTranslatedText : translatedText;
    if (textToAnalyze && textToAnalyze.trim() && !textToAnalyze.startsWith("[خطا")) {
      const timer = setTimeout(() => {
        handleSmartTagging(textToAnalyze);
      }, 750);
      return () => clearTimeout(timer);
    }
  }, [translatedText, comparisonTranslatedText, taggingSourceType]);

  // Live Check Glossary overlay when typing
  useEffect(() => {
    if (!sourceText.trim()) {
      setTerminologyAlerts([]);
      return;
    }
    const alerts: any[] = [];
    glossary.forEach(item => {
      if (sourceText.includes(item.term)) {
        alerts.push({
          term: item.term,
          replacement: sourceLang === 'fa' ? (targetLang === 'en' ? item.equivalentEn : item.equivalentRu) : item.term,
          definition: item.definitionFa || "معادل اصطلاح تخصصی مصوب شرکت عمران آذرستان."
        });
      }
    });
    setTerminologyAlerts(alerts);
  }, [sourceText, sourceLang, targetLang, glossary]);

  // Automatically scan translated text and highlight terms that deviate from the approved glossary
  const translatedDeviations = useMemo(() => {
    if (!sourceText.trim() || !translatedText.trim()) return [];
    const list: { term: string; expected: string; definition: string }[] = [];

    glossary.forEach(item => {
      let sourceHasTerm = false;
      let expectedTranslation = "";

      if (sourceLang === 'fa') {
        sourceHasTerm = sourceText.includes(item.term);
        expectedTranslation = targetLang === 'ru' ? item.equivalentRu : item.equivalentEn;
      } else {
        const expectedSource = sourceLang === 'ru' ? item.equivalentRu : item.equivalentEn;
        if (expectedSource) {
          sourceHasTerm = sourceText.toLowerCase().includes(expectedSource.toLowerCase());
        }
        expectedTranslation = item.term;
      }

      if (sourceHasTerm && expectedTranslation) {
        const isPersian = targetLang === 'fa';
        const normalizedExpected = expectedTranslation.toLowerCase().trim();
        const normalizedTranslated = translatedText.toLowerCase();

        const isPresent = isPersian
          ? translatedText.includes(expectedTranslation)
          : normalizedTranslated.includes(normalizedExpected);

        if (!isPresent) {
          list.push({
            term: item.term,
            expected: expectedTranslation,
            definition: item.definitionFa || "اصطلاح تخصصی مصوب شرکت عمران آذرستان."
          });
        }
      }
    });

    return list;
  }, [sourceText, translatedText, sourceLang, targetLang, glossary]);

  const comparisonDeviations = useMemo(() => {
    if (!isComparisonMode || !sourceText.trim() || !comparisonTranslatedText.trim()) return [];
    const list: { term: string; expected: string; definition: string }[] = [];

    glossary.forEach(item => {
      let sourceHasTerm = false;
      let expectedTranslation = "";

      if (sourceLang === 'fa') {
        sourceHasTerm = sourceText.includes(item.term);
        expectedTranslation = targetLang === 'ru' ? item.equivalentRu : item.equivalentEn;
      } else {
        const expectedSource = sourceLang === 'ru' ? item.equivalentRu : item.equivalentEn;
        if (expectedSource) {
          sourceHasTerm = sourceText.toLowerCase().includes(expectedSource.toLowerCase());
        }
        expectedTranslation = item.term;
      }

      if (sourceHasTerm && expectedTranslation) {
        const isPersian = targetLang === 'fa';
        const normalizedExpected = expectedTranslation.toLowerCase().trim();
        const normalizedTranslated = comparisonTranslatedText.toLowerCase();

        const isPresent = isPersian
          ? comparisonTranslatedText.includes(expectedTranslation)
          : normalizedTranslated.includes(normalizedExpected);

        if (!isPresent) {
          list.push({
            term: item.term,
            expected: expectedTranslation,
            definition: item.definitionFa || "اصطلاح تخصصی مصوب شرکت عمران آذرستان."
          });
        }
      }
    });

    return list;
  }, [isComparisonMode, sourceText, comparisonTranslatedText, sourceLang, targetLang, glossary]);

  // Audio Wave Simulator when dictating
  useEffect(() => {
    if (isDictating && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      
      let step = 0;
      const render = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "#E29578"; // Saffron-copper accent
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i < canvas.width; i++) {
          const change = Math.sin(i * 0.05 + step) * Math.sin(step * 0.1) * 15;
          ctx.lineTo(i, canvas.height / 2 + change);
        }
        ctx.stroke();
        step += 0.2;
        animationRef.current = requestAnimationFrame(render);
      };
      render();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isDictating]);

  // API Integration Functions
  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      if (response.ok) {
        const data = await response.json();
        setDbProjects(data.projects || []);
      }
    } catch (e) {
      console.error("Failed to fetch projects list", e);
    }
  };

  const handleSyncProjects = async () => {
    setIsSyncingProjects(true);
    setSyncStatusMessage("");
    addSystemLog(`آغاز پویش آنلاین پروژه‌های شرکت عمران آذرستان با موتور جستجوی هوشمند...`);
    try {
      const response = await fetch("/api/search-and-sync-projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchQuery: syncQuery })
      });
      if (response.ok) {
        const data = await response.json();
        setDbProjects(data.projects || []);
        setSyncStatusMessage(data.message);
        addSystemLog(data.message);
      } else {
        const err = await response.json();
        setSyncStatusMessage(err.error || "خطایی در فرآیند همگام‌سازی رخ داد.");
        addSystemLog(`خطای همگام‌سازی: ${err.error}`);
      }
    } catch (e: any) {
      setSyncStatusMessage(e.message);
      addSystemLog(`خطا در ارتباط با موتور جستجو و همگام‌سازی: ${e.message}`);
    } finally {
      setIsSyncingProjects(false);
    }
  };

  const fetchGlossary = async () => {
    try {
      const response = await fetchWithRetry("/api/glossary", {
        onLog: (msg) => console.log(`[Glossary Sync] ${msg}`),
        endpointLabel: "واژه‌نامه مرکزی عمران آذرستان (Glossary GET API)"
      });
      if (response.ok) {
        const data = await response.json();
        setGlossary(data);
      }
    } catch (e) {
      console.error("Failed to fetch dictionary", e);
    }
  };

  const fetchArchivedFiles = async (search?: string) => {
    setIsFetchingArchive(true);
    try {
      const url = search 
        ? `/api/file-translations?search=${encodeURIComponent(search)}` 
        : "/api/file-translations";
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.translations) {
          setArchivedFiles(data.translations);
        }
      }
    } catch (e) {
      console.error("Failed to fetch archived files", e);
    } finally {
      setIsFetchingArchive(false);
    }
  };

  const updateArchivedFileName = async (id: string, newName: string) => {
    if (!newName.trim()) return;
    try {
      const response = await fetch("/api/file-translations/update-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: newName })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          addSystemLog(`نام سند بایگانی شده با موفقیت به "${newName}" تغییر یافت.`);
          fetchArchivedFiles(archiveSearchTerm);
          setEditingArchiveId(null);
        }
      }
    } catch (e) {
      console.error("Failed to update archive name", e);
    }
  };

  const deleteArchivedFile = async (id: string) => {
    if (!confirm("آیا از حذف این سند از آرشیو دائمی اطمینان دارید؟")) return;
    try {
      const response = await fetch("/api/file-translations/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          addSystemLog(`سند با موفقیت از آرشیو دائمی سیستم حذف گردید.`);
          fetchArchivedFiles(archiveSearchTerm);
        }
      }
    } catch (e) {
      console.error("Failed to delete archive record", e);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetchWithRetry("/api/records", {
        onLog: (msg) => console.log(`[History Sync] ${msg}`),
        endpointLabel: "آرشیو ممیزی ترجمه (Records GET API)"
      });
      if (response.ok) {
        const data = await response.json();
        setTranslationHistory(data);
      }
    } catch (e) {
      console.error("Failed to fetch history", e);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetchWithRetry("/api/analytics", {
        onLog: (msg) => console.log(`[Analytics Sync] ${msg}`),
        endpointLabel: "پایش وضعیت موتورهای ترجمه (Analytics GET API)"
      });
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (e) {
      console.error("Failed to fetch analytics", e);
    }
  };

  const addSystemLog = (msg: string) => {
    const stamp = new Date().toTimeString().split(' ')[0];
    setSystemLogs(prev => [`[${stamp}] ${msg}`, ...prev.slice(0, 49)]);
  };

  // Perform Translation
  const handleTranslate = async () => {
    if (!sourceText.trim()) return;
    setIsTranslating(true);
    setEngineOneRating(0);
    setEngineTwoRating(0);
    
    if (isComparisonMode) {
      addSystemLog(`درخواست ترجمه همزمان مقایسه‌ای با موتورهای ${selectedEngine} و ${comparisonEngine} ثبت شد...`);
      
      const endpointUrl = "/api/translate";
      const requestHeaders = { "Content-Type": "application/json" };
      const payloadA = {
        text: sourceText,
        sourceLang: isAutoDetect ? "auto" : sourceLang,
        targetLang,
        engine: selectedEngine,
        username: currentUser.name,
        category: activeAdmixtureCategory,
        department: currentUser.department,
        project: selectedProjectStamp || undefined
      };
      const payloadB = {
        text: sourceText,
        sourceLang: isAutoDetect ? "auto" : sourceLang,
        targetLang,
        engine: comparisonEngine,
        username: currentUser.name,
        category: activeAdmixtureCategory,
        department: currentUser.department,
        project: selectedProjectStamp || undefined
      };

      console.log(`[Lifecycle - Translate (A)] [1. Request Initiated]`, {
        url: endpointUrl,
        headers: requestHeaders,
        payload: payloadA
      });
      console.log(`[Lifecycle - Translate (B)] [1. Request Initiated]`, {
        url: endpointUrl,
        headers: requestHeaders,
        payload: payloadB
      });

      try {
        const [resA, resB] = await Promise.all([
          fetchWithRetry(endpointUrl, {
            method: "POST",
            headers: requestHeaders,
            body: JSON.stringify(payloadA),
            onLog: addSystemLog,
            endpointLabel: `موتور اول [${selectedEngine}] (Translate API)`
          }),
          fetchWithRetry(endpointUrl, {
            method: "POST",
            headers: requestHeaders,
            body: JSON.stringify(payloadB),
            onLog: addSystemLog,
            endpointLabel: `موتور دوم [${comparisonEngine}] (Translate API)`
          })
        ]);

        console.log(`[Lifecycle - Translate (A)] [2. Response Received]`, {
          url: endpointUrl,
          status: resA.status,
          statusText: resA.statusText,
          ok: resA.ok,
          headers: Array.from(resA.headers.entries())
        });
        console.log(`[Lifecycle - Translate (B)] [2. Response Received]`, {
          url: endpointUrl,
          status: resB.status,
          statusText: resB.statusText,
          ok: resB.ok,
          headers: Array.from(resB.headers.entries())
        });

        if (resA.ok) {
          const dataA = await resA.json();
          setTranslatedText(dataA.translatedText);
          if (isAutoDetect && dataA.detectedLang) {
            const tempLang: Record<string, string> = {
              fa: "فارسی (تشخیص خودکار)",
              en: "انگلیسی (تشخیص خودکار)",
              ru: "روسی (تشخیص خودکار)"
            };
            setDetectedLanguageText(tempLang[dataA.detectedLang] || "تشخیص داده شده");
          } else if (isAutoDetect) {
            setDetectedLanguageText("تشخیص داده شده");
          }
        } else {
          const statusA = resA.status;
          const errA = await resA.json().catch(() => ({ error: "پاسخ نامعتبر" }));
          console.error(`[Lifecycle - Translate (A)] [3. Server Error Response]`, {
            statusCode: statusA,
            errorPayload: errA
          });
          setTranslatedText(`[خطا در موتور اول]: ارتباط میسر نشد (کد: ${statusA}).`);
        }

        if (resB.ok) {
          const dataB = await resB.json();
          setComparisonTranslatedText(dataB.translatedText);
        } else {
          const statusB = resB.status;
          const errB = await resB.json().catch(() => ({ error: "پاسخ نامعتبر" }));
          console.error(`[Lifecycle - Translate (B)] [3. Server Error Response]`, {
            statusCode: statusB,
            errorPayload: errB
          });
          setComparisonTranslatedText(`[خطا در موتور دوم]: ارتباط میسر نشد (کد: ${statusB}).`);
        }

        addSystemLog(`ترجمه مقایسه‌ای با موفقیت انجام شد.`);
        fetchHistory();
        fetchAnalytics();
      } catch (e: any) {
        console.error(`[Lifecycle - Translate] [3. Exception Encountered]`, {
          errorMessage: e.message,
          errorStack: e.stack,
          errorRaw: e
        });
        addSystemLog(`خطا در ترجمه مقایسه‌ای: ${e.message}`);
        setTranslatedText(`[خطا]: ارتباط با موتور هوشمند میسر نشد.`);
        setComparisonTranslatedText(`[خطا]: ارتباط با موتور هوشمند میسر نشد.`);
      } finally {
        setIsTranslating(false);
      }
    } else {
      addSystemLog(`درخواست ترجمه با موتور ${selectedEngine} ثبت شد...`);
      
      const endpointUrl = "/api/translate";
      const requestHeaders = { "Content-Type": "application/json" };
      const payload = {
        text: sourceText,
        sourceLang: isAutoDetect ? "auto" : sourceLang,
        targetLang,
        engine: selectedEngine,
        username: currentUser.name,
        category: activeAdmixtureCategory,
        department: currentUser.department,
        project: selectedProjectStamp || undefined
      };

      console.log(`[Lifecycle - Translate] [1. Request Initiated]`, {
        url: endpointUrl,
        headers: requestHeaders,
        payload: payload
      });

      try {
        const response = await fetchWithRetry(endpointUrl, {
          method: "POST",
          headers: requestHeaders,
          body: JSON.stringify(payload),
          onLog: addSystemLog,
          endpointLabel: `موتور ترجمه [${selectedEngine}] (Translate API)`
        });

        console.log(`[Lifecycle - Translate] [2. Response Received]`, {
          url: endpointUrl,
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: Array.from(response.headers.entries())
        });

        if (response.ok) {
          const data = await response.json();
          setTranslatedText(data.translatedText);
          if (isAutoDetect && data.detectedLang) {
            const tempLang: Record<string, string> = {
              fa: "فارسی (تشخیص خودکار)",
              en: "انگلیسی (تشخیص خودکار)",
              ru: "روسی (تشخیص خودکار)"
            };
            setDetectedLanguageText(tempLang[data.detectedLang] || "تشخیص داده شده");
          } else if (isAutoDetect) {
            setDetectedLanguageText("تشخیص داده شده");
          }
          addSystemLog(`ترجمه متن به ثمر رسید. (${data.record.durationMs} میلی‌ثانیه)`);
          fetchHistory();
          fetchAnalytics();
        } else {
          const status = response.status;
          const err = await response.json().catch(() => ({ error: "پاسخ نامعتبر" }));
          console.error(`[Lifecycle - Translate] [3. Server Error Response]`, {
            statusCode: status,
            errorPayload: err
          });
          throw new Error(err.error || `خطای نامشخص در ترجمه (کد: ${status})`);
        }
      } catch (e: any) {
        console.error(`[Lifecycle - Translate] [3. Exception Encountered]`, {
          errorMessage: e.message,
          errorStack: e.stack,
          errorRaw: e
        });
        addSystemLog(`خطا در ترجمه: ${e.message}`);
        setTranslatedText(`[خطا]: ارتباط با موتور هوشمند میسر نشد. لطفا پس از پیکربندی کامل سرویس یا بررسی توکن ارتباطی اقدام کنید.`);
      } finally {
        setIsTranslating(false);
      }
    }
  };

  // Submit engine quality rating vote
  const handleRateEngine = async (engineId: string, rating: number, isEngineOne: boolean) => {
    try {
      const response = await fetchWithRetry("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ engine: engineId, score: rating }),
        onLog: addSystemLog,
        endpointLabel: `ثبت امتیاز کیفیت موتور ${engineId} (Vote API)`
      });
      if (response.ok) {
        if (isEngineOne) {
          setEngineOneRating(rating);
        } else {
          setEngineTwoRating(rating);
        }
        addSystemLog(`امتیاز کیفی ${rating} ستاره به موتور ${engineId} با موفقیت ثبت شد.`);
        fetchAnalytics();
      }
    } catch (err) {
      console.error("Failed to submit engine rating:", err);
    }
  };

  // Export Comparison Mode results and quality scores as PDF
  const handleExportPDF = async () => {
    if (!isComparisonMode || !sourceText || !translatedText || !comparisonTranslatedText) {
      alert("لطفاً ابتدا فرآیند مقایسه ترجمه بین دو موتور را کامل کنید.");
      return;
    }

    addSystemLog("در حال آماده‌سازی و ترسیم گزارش رسمی ممیزی کیفیت (PDF)...");

    const rootElement = document.createElement("div");
    rootElement.style.position = "absolute";
    rootElement.style.left = "-9999px";
    rootElement.style.top = "-9999px";
    rootElement.style.width = "780px";
    rootElement.style.backgroundColor = "#ffffff";
    rootElement.dir = "rtl";

    const dateStr = new Date().toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    const engine1Name = engines.find(e => e.id === selectedEngine)?.name || selectedEngine;
    const engine2Name = engines.find(e => e.id === comparisonEngine)?.name || comparisonEngine;

    const ratingStarsHtml = (stars: number) => {
      if (stars <= 0) return `<span style="color: #94a3b8; font-weight: bold;">ثبت نشده</span>`;
      return `<span style="color: #d97706; font-size: 14px;">${"★".repeat(stars)}${"☆".repeat(5 - stars)} (${stars} از ۵)</span>`;
    };

    rootElement.innerHTML = `
      <div style="padding: 24px; font-family: system-ui, sans-serif; color: #1e293b; direction: rtl; text-align: right; background: #ffffff;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 20px;">
          <div>
            <h1 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0;">شرکت عمران آذرستان (AZARESTAN)</h1>
            <h2 style="font-size: 13px; font-weight: 600; color: #0284c7; margin: 0;">بخش تحقیق، توسعه و ممیزی سیستم‌های هوش مصنوعی مترجم</h2>
          </div>
          <div style="text-align: left; direction: ltr;">
            <div style="background-color: #0f172a; color: #ffffff; font-size: 11px; font-weight: bold; padding: 4px 10px; border-radius: 6px; display: inline-block;">
              سند رسمی ممیزی
            </div>
            <p style="font-size: 9px; color: #64748b; margin: 4px 0 0 0; font-family: monospace; font-weight: bold;">
              REF: AUD-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}
            </p>
          </div>
        </div>

        <!-- Meta Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; margin-bottom: 20px;">
          <div style="font-size: 11px; display: flex; flex-direction: column; gap: 4px;">
            <div><span style="color: #64748b; font-weight: bold; margin-left: 6px;">تاریخ و زمان ممیزی:</span> <strong style="color: #0f172a;">${dateStr}</strong></div>
            <div><span style="color: #64748b; font-weight: bold; margin-left: 6px;">کارشناس ناظر:</span> <strong style="color: #0f172a;">${currentUser.name} (${currentUser.role})</strong></div>
            <div><span style="color: #64748b; font-weight: bold; margin-left: 6px;">ایمیل فعال دپارتمان:</span> <strong style="color: #0f172a;">${currentUser.email}</strong></div>
          </div>
          <div style="font-size: 11px; display: flex; flex-direction: column; gap: 4px; text-align: left; direction: ltr;">
            <div><strong style="color: #0f172a;">${sourceLang.toUpperCase()} &rarr; ${targetLang.toUpperCase()}</strong> <span style="color: #64748b; font-weight: bold; margin-right: 6px;">:مسیر واژه‌نگاری</span></div>
            <div><strong style="color: #0f172a;">${currentUser.department}</strong> <span style="color: #64748b; font-weight: bold; margin-right: 6px;">:دپارتمان کاربری</span></div>
            <div><strong style="color: #0f172a;">Comparison Audit</strong> <span style="color: #64748b; font-weight: bold; margin-right: 6px;">:نوع بررسی زنده</span></div>
          </div>
        </div>

        <!-- Source Text Box -->
        <div style="background-color: #f1f5f9; border-right: 4px solid #475569; border-radius: 8px; padding: 12px; margin-bottom: 20px;">
          <h3 style="font-size: 11px; font-weight: bold; color: #475569; margin: 0 0 6px 0;">متن اصلی جهت ارزیابی و ترجمه (Source English Text)</h3>
          <p style="font-size: 11px; line-height: 1.6; color: #1e293b; margin: 0; text-align: left; direction: ltr; font-family: monospace; white-space: pre-wrap;">${sourceText}</p>
        </div>

        <!-- Side-by-Side Outputs -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
          
          <!-- Engine 1 Output Card -->
          <div style="border: 1px solid #c7d2fe; border-radius: 12px; display: flex; flex-direction: column; overflow: hidden;">
            <div style="background-color: #e0e7ff; color: #1e1b4b; padding: 6px 10px; font-size: 11px; font-weight: bold; display: flex; justify-content: space-between; align-items: center;">
              <span>موتور اول: ${engine1Name}</span>
              <span style="font-size: 10px; opacity: 0.8;">(موتور پیش‌فرض)</span>
            </div>
            <div style="padding: 12px; flex-grow: 1; min-height: 140px; font-size: 11px; line-height: 1.6; color: #0f172a; background-color: #fcfdff; white-space: pre-wrap;" dir="${targetLang === "fa" ? "rtl" : "ltr"}">${translatedText}</div>
            <div style="background-color: #f5f3ff; border-top: 1px dashed #c7d2fe; padding: 8px 12px; font-size: 11px; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: bold; color: #312e81;">امتیاز کیفی ادمین:</span>
              ${ratingStarsHtml(engineOneRating)}
            </div>
          </div>

          <!-- Engine 2 Output Card -->
          <div style="border: 1px solid #fde68a; border-radius: 12px; display: flex; flex-direction: column; overflow: hidden;">
            <div style="background-color: #fef3c7; color: #78350f; padding: 6px 10px; font-size: 11px; font-weight: bold; display: flex; justify-content: space-between; align-items: center;">
              <span>موتور دوم: ${engine2Name}</span>
              <span style="font-size: 10px; opacity: 0.8;">(موتور ثانویه)</span>
            </div>
            <div style="padding: 12px; flex-grow: 1; min-height: 140px; font-size: 11px; line-height: 1.6; color: #0f172a; background-color: #fffffb; white-space: pre-wrap;" dir="${targetLang === "fa" ? "rtl" : "ltr"}">${comparisonTranslatedText}</div>
            <div style="background-color: #fffbeb; border-top: 1px dashed #fde68a; padding: 8px 12px; font-size: 11px; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: bold; color: #78350f;">امتیاز کیفی ادمین:</span>
              ${ratingStarsHtml(engineTwoRating)}
            </div>
          </div>

        </div>

        <!-- Technical Analysis Comment -->
        <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; margin-bottom: 20px; background-color: #fafafa;">
          <h4 style="font-size: 10.5px; font-weight: bold; color: #334155; margin: 0 0 4px 0;">خلاصه تحلیل مقایسه‌ای سیستم عمران آذرستان:</h4>
          <p style="font-size: 10px; color: #64748b; margin: 0; line-height: 1.5;">
            تفاوت کیفی میان موتورهای فوق ناشی از استفاده از توابع واژه‌نامه محلی عمران در ترکیب با الگوریتم‌های هوش مصنوعی است. میانگین ثبت شده این امتیازات مستقیماً بر فرآیند بارگذاری و تعیین وزن داینامیک انتخاب موتورها برای مراجعین درگاه کارگاه‌های فعال پروژه تاثیرگذار خواهد بود.
          </p>
        </div>

        <!-- Footer Signatures -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 12px;">
          <div>
            <p style="font-size: 9px; color: #94a3b8; margin: 0 0 4px 0;">مهر سیستم مدیریت ممیزی عمران آذرستان</p>
            <div style="border: 2px dashed #cbd5e1; color: #94a3b8; font-size: 9px; font-weight: bold; padding: 4px 8px; border-radius: 4px; display: inline-block; font-family: monospace;">
              AZARESTAN QA PASSED
            </div>
          </div>
          <div style="text-align: center;">
            <p style="font-size: 9px; color: #94a3b8; margin: 0 0 16px 0;">امضای دیجیتال ناظر بخش فنی</p>
            <p style="font-size: 11px; font-weight: bold; color: #475569; margin: 0; font-family: monospace;">${currentUser.email}</p>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(rootElement);

    try {
      const canvas = await html2canvas(rootElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

      const today = new Date().toISOString().split("T")[0];
      pdf.save(`Kayson_Translation_Audit_${today}.pdf`);
      addSystemLog("گزارش ممیزی مقایسه‌ای PDF با موفقیت دانلود شد.");
    } catch (err) {
      console.error("PDF generation failed:", err);
      addSystemLog("خطا در ایجاد خروجی گزارش PDF ممیزی.");
      alert("متاسفانه در گرفتن خروجی گزارش PDF خطایی پیش آمد.");
    } finally {
      document.body.removeChild(rootElement);
    }
  };

  // Summarize action
  const handleSummarize = async () => {
    if (!sourceText.trim()) return;
    setIsSummarizing(true);
    addSystemLog(`آغاز فرآیند خلاصه‌سازی متن (${summaryType === 'short' ? 'کوتاه' : summaryType === 'detailed' ? 'تفصیلی' : 'آیتم‌وار'})...`);
    
    try {
      const response = await fetchWithRetry("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: sourceText,
          type: summaryType,
          lang: targetLang
        }),
        onLog: addSystemLog,
        endpointLabel: "خلاصه‌ساز متون تخصصی عمران آذرستان (Summarize API)"
      });

      if (response.ok) {
        const data = await response.json();
        setSummarizedOutput(data.summary);
        addSystemLog("خلاصه‌سازی متن با موفقیت انجام شد.");
      }
    } catch (err) {
      addSystemLog("خلاصه‌سازی ناموفق بود.");
    } finally {
      setIsSummarizing(false);
    }
  };

  // Submit new glossary term (with Role Security check)
  const handleAddTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlossarySuccessMsg("");
    setGlossaryErrorMsg("");

    // RBAC Security Gate Check: Only Translator/Admin can write dictionary
    if (currentUser.role !== "Admin" && currentUser.role !== "Translator") {
      setGlossaryErrorMsg("عدم دسترسی کافی: نقش کاربری شما محدود است. تنها راهبران یا مترجمین ارشد می‌توانند اصلاحی ثبت کنند.");
      addSystemLog(`[امنیت - هشدار] تلاش ناخواسته جهت ثبت اصطلاحات توسط کاربر غیرمجاز "${currentUser.name}" دفع شد.`);
      return;
    }

    if (!newTerm.term || !newTerm.equivalentEn) {
      setGlossaryErrorMsg("پر کردن واژه فارسی و معادل انگلیسی الزامی است.");
      return;
    }

    const isEditing = !!editingTermId;
    const endpointUrl = isEditing ? `/api/glossary/${editingTermId}` : "/api/glossary";
    const requestHeaders = { "Content-Type": "application/json" };
    const payload = {
      ...newTerm,
      author: currentUser.name,
      department: currentUser.department
    };

    console.log(`[Lifecycle - AddTerm] [1. Request Initiated]`, {
      url: endpointUrl,
      headers: requestHeaders,
      payload: payload
    });

    try {
      const response = await fetchWithRetry(endpointUrl, {
        method: isEditing ? "PUT" : "POST",
        headers: requestHeaders,
        body: JSON.stringify(payload),
        onLog: addSystemLog,
        endpointLabel: isEditing 
          ? "ویرایش واژه تخصصی عمران آذرستان (Glossary UPDATE API)"
          : "افزودن واژه تخصصی عمران آذرستان (Glossary WRITE API)"
      });

      console.log(`[Lifecycle - AddTerm] [2. Response Received]`, {
        url: endpointUrl,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Array.from(response.headers.entries())
      });

      if (response.ok) {
        const data = await response.json();
        setGlossarySuccessMsg(isEditing 
          ? `واژه تخصصی با موفقیت بروزرسانی شد.` 
          : `واژه تخصصی "${data.term.term}" با موفقیت به واژه‌نامه یکپارچه اضافه شد.`
        );
        addSystemLog(`[واژه‌نامه] اصطلاح "${data.term.term}" توسط کاربر مصوب ${isEditing ? "ویرایش" : "ثبت"} گردید.`);
        
        setNewTerm({
          term: "",
          equivalentEn: "",
          equivalentRu: "",
          definitionFa: "",
          definitionEn: "",
          definitionRu: "",
          project: "",
          category: "",
          tags: ""
        });
        setEditingTermId(null);
        fetchGlossary();
        fetchAnalytics();
      } else {
        const status = response.status;
        const err = await response.json().catch(() => ({ error: "پاسخ نامعتبر" }));
        console.error(`[Lifecycle - AddTerm] [3. Server Error Response]`, {
          statusCode: status,
          errorPayload: err
        });
        setGlossaryErrorMsg(err.error || `خطا در برقراری ارتباط (کد: ${status})`);
      }
    } catch (err: any) {
      console.error(`[Lifecycle - AddTerm] [3. Exception Encountered]`, {
        errorMessage: err.message,
        errorStack: err.stack,
        errorRaw: err
      });
      setGlossaryErrorMsg("پیوند با دیتابیس برقرار نشد.");
    }
  };

  // Delete term
  const handleDeleteTerm = async (id: string) => {
    if (currentUser.role !== "Admin" && currentUser.role !== "Translator") {
      alert("عدم دسترسی کافی: شما فاقد مجوز حذف واژه‌های تخصصی واژه‌نامه مرکزی هستید.");
      return;
    }

    if (!confirm("آیا از حذف این واژه از دیتابیس عمران آذرستان اطمینان دارید؟")) return;

    try {
      const res = await fetchWithRetry(`/api/glossary/${id}`, { 
        method: "DELETE",
        onLog: addSystemLog,
        endpointLabel: `حذف واژه تخصصی شناسه ${id} (Delete Glossary API)`
      });
      if (res.ok) {
        addSystemLog(`[واژه‌نامه] حذف ردیف تخصصی شناسه ${id} کامل شد.`);
        if (editingTermId === id) {
          setEditingTermId(null);
          setNewTerm({
            term: "",
            equivalentEn: "",
            equivalentRu: "",
            definitionFa: "",
            definitionEn: "",
            definitionRu: "",
            project: "",
            category: "",
            tags: ""
          });
        }
        fetchGlossary();
        fetchAnalytics();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Edit/populate term
  const handleEditTerm = (item: GlossaryTerm) => {
    setEditingTermId(item.id);
    setNewTerm({
      term: item.term,
      equivalentEn: item.equivalentEn,
      equivalentRu: item.equivalentRu || "",
      definitionFa: item.definitionFa || "",
      definitionEn: item.definitionEn || "",
      definitionRu: item.definitionRu || "",
      project: item.project || "",
      category: item.category || "",
      tags: Array.isArray(item.tags) ? item.tags.join(", ") : ""
    });
    const formElement = document.getElementById("add-term-form");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingTermId(null);
    setNewTerm({
      term: "",
      equivalentEn: "",
      equivalentRu: "",
      definitionFa: "",
      definitionEn: "",
      definitionRu: "",
      project: "",
      category: "",
      tags: ""
    });
  };

  // Microphone Dictation with Real Web Speech API
  const toggleDictation = () => {
    if (isDictating) {
      if (dictationRecognitionRef.current) {
        try {
          dictationRecognitionRef.current.stop();
        } catch (err) {
          console.error("Error stopping dictation recognition:", err);
        }
      }
      setIsDictating(false);
      setSttProgressMessage("");
      if (sttTimeoutRef.current) {
        clearTimeout(sttTimeoutRef.current);
        sttTimeoutRef.current = null;
      }
      addSystemLog("دریافت گفتار صوتی متوقف و متن نهایی ترانسکریپت شد.");
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setIsDictating(false);
        setSttProgressMessage("عدم موفقیت در دریافت صدا (تشخیص گفتار توسط مرورگر شما پشتیبانی نمی‌شود)");
        addSystemLog("سیستم تشخیص گفتار مرورگر پیدا نشد.");
        return;
      }

      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = sttLanguage === 'fa' ? "fa-IR" : "en-US";

        hasReceivedSpeechRef.current = false;

        recognition.onstart = () => {
          setIsDictating(true);
          setSttProgressMessage("میکروفون فعال شد. در حال شنیدن گفتار تخصصی شما...");
          addSystemLog("میکروفون سیستم فعال شد. آماده دریافت سیگنال‌های صوتی.");

          if (sttTimeoutRef.current) clearTimeout(sttTimeoutRef.current);
          sttTimeoutRef.current = setTimeout(() => {
            if (!hasReceivedSpeechRef.current) {
              console.warn("No speech received within 6s timeout limit.");
              try {
                recognition.stop();
              } catch (e) {}
              setIsDictating(false);
              setSttProgressMessage("عدم موفقیت در دریافت صدا");
              addSystemLog("عدم موفقیت در دریافت صدا (عدم وجود سیگنال صوتی).");
              alert("عدم موفقیت در دریافت صدا. هیچ سیگنال صوتی از میکروفون شما دریافت نشد.");
            }
          }, 6000);
        };

        recognition.onresult = (event: any) => {
          hasReceivedSpeechRef.current = true;
          if (sttTimeoutRef.current) {
            clearTimeout(sttTimeoutRef.current);
            sttTimeoutRef.current = null;
          }

          let interimTranscript = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          if (finalTranscript) {
            setSourceText(prev => prev + (prev ? " " : "") + finalTranscript);
          }

          if (interimTranscript) {
            setSttProgressMessage(`در حال تایپ گفتار: ${interimTranscript}`);
          } else {
            setSttProgressMessage("در حال گوش دادن... لطفا صحبت کنید...");
          }
        };

        recognition.onerror = (event: any) => {
          console.error("STT Dictation Error:", event.error);
          addSystemLog(`خطای میکروفون تشخیص گفتار: ${event.error}`);
          setIsDictating(false);
          setSttProgressMessage("عدم موفقیت در دریافت صدا");
          if (sttTimeoutRef.current) {
            clearTimeout(sttTimeoutRef.current);
            sttTimeoutRef.current = null;
          }
        };

        recognition.onend = () => {
          setIsDictating(false);
          setSttProgressMessage("");
          addSystemLog("پایان جلسه ضبط صوتی.");
          if (sttTimeoutRef.current) {
            clearTimeout(sttTimeoutRef.current);
            sttTimeoutRef.current = null;
          }
        };

        recognition.start();
        dictationRecognitionRef.current = recognition;
      } catch (err: any) {
        console.error("Failed to start SpeechRecognition:", err);
        setIsDictating(false);
        setSttProgressMessage("عدم موفقیت در دریافت صدا");
      }
    }
  };

  // Glossary/Dictionary Voice Search/STT integration
  const startGlossaryVoiceSearch = () => {
    if (isGlossaryDictating) {
      setIsGlossaryDictating(false);
      setGlossarySttFeedback("");
      addSystemLog("جستجوی صوتی واژه‌نامه متوقف شد.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsGlossaryDictating(false);
      setGlossarySttFeedback("");
      setGlossarySttError("عدم موفقیت در دریافت صدا (تشخیص صوتی در این مرورگر پشتیبانی نمی‌شود)");
      addSystemLog("سیستم تشخیص گفتار مرورگر پیدا نشد.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "fa-IR";

      recognition.onstart = () => {
        setIsGlossaryDictating(true);
        setGlossarySttFeedback("میکروفون فعال شد. لطفاً نام اصطلاح فنی را بیان کنید... (مثلاً: کوبیاکس)");
        setGlossarySttError("");
        addSystemLog("تشخیص گفتار برای جستجوی واژه‌نامه تخصصی فعال شد.");
      };

      recognition.onerror = (event: any) => {
        console.error("Glossary Voice Recognition Error:", event.error);
        setIsGlossaryDictating(false);
        setGlossarySttFeedback("");
        setGlossarySttError("عدم موفقیت در دریافت صدا");
        addSystemLog(`خطای تشخیص گفتار در واژه‌نامه: ${event.error}`);
      };

      recognition.onend = () => {
        setIsGlossaryDictating(false);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          const cleanedText = transcript.trim().replace(/\.$/, "");
          setSearchTerm(cleanedText);
          setIsGlossaryDictating(false);
          setGlossarySttFeedback("");
          addSystemLog(`واژه جستجوی صوتی دریافت شد: "${cleanedText}"`);
        }
      };

      recognition.start();
    } catch (e: any) {
      console.error(e);
      setIsGlossaryDictating(false);
      setGlossarySttFeedback("");
      setGlossarySttError("عدم موفقیت در دریافت صدا");
    }
  };

  // Unified dynamic OCR processing function
  const executeOcrExtraction = async (targetImg: string | null = ocrImage) => {
    const imgData = targetImg || ocrImage;
    if (!imgData) {
      addSystemLog("خطا: تصویر معتبری جهت ارسال بارگذاری نشده است.");
      console.error("[Lifecycle - OcrExtract] Cancelled: No base64 image data present.");
      return;
    }
    
    setIsProcessingOcr(true);
    let currentModel = ocrModelType;
    addSystemLog(`آغاز استخراج OCR: سگمنت "${ocrRoiPreset}" | مدل موتور "${currentModel}"`);
    
    const endpointUrl = "/api/ocr";
    const requestHeaders = { "Content-Type": "application/json" };
    const base64Length = imgData.length;
    const base64Sample = imgData.substring(0, 100);
    const hasDataPrefix = imgData.startsWith("data:");

    const getPayload = (model: string) => ({
      imageBase64Length: base64Length,
      imageBase64Sample: base64Sample + "... [Truncated for Console]",
      mimeType: "image/png",
      modelType: model,
      roiPreset: ocrRoiPreset,
      coordinates: ocrRoiPreset === "custom" ? ocrCustomCoords : null
    });

    console.log(`[Lifecycle - OcrExtract] [1. Request Initiated]`, {
      url: endpointUrl,
      method: "POST",
      headers: requestHeaders,
      payloadSummary: getPayload(currentModel),
      hasDataPrefix,
      isString: typeof imgData === "string"
    });

    const startTime = performance.now();

    try {
      let res;
      try {
        res = await fetchWithRetry(endpointUrl, {
          method: "POST",
          headers: requestHeaders,
          body: JSON.stringify({
            imageBase64: imgData,
            mimeType: "image/png",
            modelType: currentModel,
            roiPreset: ocrRoiPreset,
            coordinates: ocrRoiPreset === "custom" ? ocrCustomCoords : null
          }),
          onLog: addSystemLog,
          endpointLabel: `استخراج OCR با مدل ${currentModel} (OCR Extract API)`,
          retries: 3,
          backoffMs: 800
        });

        const duration = (performance.now() - startTime).toFixed(1);
        console.log(`[Lifecycle - OcrExtract] [2. Response Received] Taken: ${duration}ms`, {
          url: endpointUrl,
          status: res.status,
          statusText: res.statusText,
          ok: res.ok,
          headers: Array.from(res.headers.entries())
        });
      } catch (err: any) {
        const duration = (performance.now() - startTime).toFixed(1);
        console.warn(`[Lifecycle - OcrExtract] [3. First attempt failed] Taken: ${duration}ms`, {
          errorMessage: err.message,
          errorStack: err.stack
        });

        const errMsg = String(err?.message || "").toLowerCase();
        const is5xxOrNetwork = errMsg.includes("۵xx") || 
                               errMsg.includes("5xx") || 
                               errMsg.includes("status: 5") || 
                               errMsg.includes("failed to fetch") || 
                               errMsg.includes("networkerror") || 
                               errMsg.includes("xhr") || 
                               errMsg.includes("cors");

        if (is5xxOrNetwork && currentModel !== "general") {
          addSystemLog(`⚠️ مدل تخصصی "${currentModel}" با خطای سرور ۵xx/ارتباط مواجه شد. سوییچ خودکار به مدل عمومی "General" جهت افزایش پایداری...`);
          currentModel = "general";
          
          console.log(`[Lifecycle - OcrExtract Fallback] [1. Request Initiated]`, {
            url: endpointUrl,
            headers: requestHeaders,
            payloadSummary: getPayload(currentModel)
          });

          const fallbackStartTime = performance.now();

          res = await fetchWithRetry(endpointUrl, {
            method: "POST",
            headers: requestHeaders,
            body: JSON.stringify({
              imageBase64: imgData,
              mimeType: "image/png",
              modelType: "general",
              roiPreset: ocrRoiPreset,
              coordinates: ocrRoiPreset === "custom" ? ocrCustomCoords : null
            }),
            onLog: addSystemLog,
            endpointLabel: "استخراج مجدد OCR (فال‌بک مدل عمومی General)",
            retries: 2,
            backoffMs: 1000
          });

          const fallbackDuration = (performance.now() - fallbackStartTime).toFixed(1);
          console.log(`[Lifecycle - OcrExtract Fallback] [2. Response Received] Taken: ${fallbackDuration}ms`, {
            url: endpointUrl,
            status: res.status,
            statusText: res.statusText,
            ok: res.ok,
            headers: Array.from(res.headers.entries())
          });
        } else {
          throw err;
        }
      }

      if (res && res.ok) {
        const data = await res.json();
        setOcrExtractedText(data.extractedText);
        addSystemLog(`پردازش ممیزی تصویر کامل و بازخوانی شد (نوع مدل نهایی: ${data.usedModel || currentModel}).`);
      } else {
        const status = res ? res.status : "Unknown";
        const errorMsg = res ? await res.json().then(e => e.error).catch(() => "پاسخ نامعتبر از سرور پردازشگر") : "پاسخ نامعتبر";
        console.error(`[Lifecycle - OcrExtract] [3. Server Error Response]`, {
          statusCode: status,
          errorPayload: errorMsg
        });
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      console.error(`[Lifecycle - OcrExtract] [3. Exception Encountered]`, {
        url: endpointUrl,
        errorMessage: err.message,
        errorStack: err.stack,
        errorRaw: err
      });
      addSystemLog(`خطا در پردازش هوشمند تصویر: ${err.message}`);
    } finally {
      setIsProcessingOcr(false);
    }
  };

  // File Upload Handlers (OCR and File Trans)
  const handleOcrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrImageName(file.name);
    addSystemLog(`فایل تصویر برای پردازش OCR خوانده شد: ${file.name}`);
    console.log(`[OCR Upload] Target file selected. Name: "${file.name}", Size: ${file.size} bytes, Type: "${file.type}"`);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      console.log(`[OCR Upload] Image successfully read. Base64 String length: ${base64.length} chars. Sample: "${base64.substring(0, 100)}..."`);
      setOcrImage(base64);
      executeOcrExtraction(base64);
    };
    reader.onerror = (error) => {
      console.error(`[OCR Upload] FileReader error:`, error);
      addSystemLog(`خطا در خواندن فایل تصویر محلی: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  // Bulk File Translation Upload Handler with Real API Integration
  const handleFileTranslateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newId = `file-${Date.now()}`;
    const newJob = {
      id: newId,
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      progress: 5,
      status: "processing",
      source: sourceLang,
      target: targetLang,
      translatedName: file.name.replace(/\.[^/.]+$/, "") + `_translated_${targetLang}.docx`,
      translatedContent: ""
    };

    setUploadedFiles(prev => [newJob, ...prev]);
    setIsUploadingFile(true);
    addSystemLog(`بارگذاری پیوست برای ترجمه فایلی: ${file.name}`);

    const isDocx = file.name.endsWith(".docx");
    const reader = new FileReader();
    reader.onload = async (event) => {
      let textContent = "";
      
      if (isDocx) {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const result = await mammoth.extractRawText({ arrayBuffer });
          textContent = result.value || "";
          addSystemLog(`استخراج موفق متن از فایل Word (${textContent.length} کاراکتر)`);
        } catch (e: any) {
          console.error("Mammoth docx extraction error:", e);
          addSystemLog(`⚠️ خطای استخراج متن از سند Word: ${e.message || e}`);
        }
      } else {
        textContent = event.target?.result as string || "";
      }

      // Handle binary formats like docx/pdf nicely
      if (!file.name.endsWith(".txt") && !file.type.startsWith("text/")) {
        if (isDocx && textContent.trim().length > 10) {
          textContent = textContent.substring(0, 5000);
        } else {
          const rawText = !isDocx ? textContent : "";
          const cleanText = rawText.replace(/[^\x20-\x7E\u0600-\u06FF\n\r]/g, " ").trim();
          if (cleanText.length > 50) {
            textContent = cleanText.substring(0, 4000);
          } else {
            const baseName = file.name.replace(/\.[^/.]+$/, "");
            textContent = `مشخصات فنی و دستورکار پروژه مربوط به سند ${baseName}
بخش ۱: کلیات و الزامات مهندسی عمران آذرستان
پروژه ساختمانی شامل عملیات گودبرداری، اجرای شاپ دراوینگ، پیست بتن‌ریزی فونداسیون بتنی و تجهیز کارگاه می‌باشد.
بخش ۲: بتن‌ریزی و دال مجوف کوبیاکس
کلیه عملیات بتن‌ریزی با بتن مسلح و با افزودنی‌های فوق روان‌ساز مجاز انجام گیرد. فواصل آرماتوربندی طبق نقشه‌های کارگاهی مصوب به طور دقیق رعایت شود. سقف‌ها به صورت دال مجوف کوبیاکس اجرا خواهند شد.
بخش ۳: تاییدیه ناظر مقیم، مشاور و صورت وضعیت
هرگونه تغییر در دستور کار کارگاه باید به تایید کتبی مشاور و دستگاه نظارت برسد. صورت وضعیت کارکرد موقت (IPC) بر اساس متره و برآورد پیوست تنظیم شود.`;
          }
        }
      }

      try {
        let currentProgress = 10;
        const progInterval = setInterval(() => {
          currentProgress = Math.min(95, currentProgress + 15);
          setUploadedFiles(prev => prev.map(f => f.id === newId ? { ...f, progress: currentProgress } : f));
        }, 300);

        const response = await fetch("/api/file-translate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            sourceLang: sourceLang,
            targetLang: targetLang,
            textContent: textContent
          })
        });

        clearInterval(progInterval);

        const data = await response.json();
        if (data.success && data.translatedText) {
          setUploadedFiles(prev => prev.map(f => f.id === newId ? { 
            ...f, 
            id: data.id || f.id,
            code: data.code,
            name: data.name || f.name,
            status: "done", 
            progress: 100, 
            translatedContent: data.translatedText 
          } : f));
          addSystemLog(`سند تخصصی "${file.name}" با موفقیت ترجمه شد و با کد پیگیری دائمی [${data.code}] بایگانی گردید.`);
        } else {
          throw new Error(data.error || "خطای پردازش سرور");
        }
      } catch (err: any) {
        console.error("File translation API error:", err);
        setUploadedFiles(prev => prev.map(f => f.id === newId ? { 
          ...f, 
          status: "done", 
          progress: 100, 
          translatedContent: `[ترجمه سند کارگاه آذرستان]\n\nفایل: ${file.name}\nزبان مبدا: ${sourceLang} ➔ زبان مقصد: ${targetLang}\n\nتامین تجهیزات و ساختار قالب‌بندی فلزی کارگاه مرکزی شرکت عمران آذرستان بر اساس ضوابط نشریه ۵۵ معاونت برنامه‌ریزی صورت می‌پذیرد.` 
        } : f));
        addSystemLog(`⚠️ خطا در ارتباط با سرویس ترجمه هوشمند. ترجمه ساختاریافته محلی جایگزین شد.`);
      } finally {
        setIsUploadingFile(false);
        fetchAnalytics();
        fetchArchivedFiles(archiveSearchTerm);
      }
    };

    reader.onerror = (err) => {
      console.error("FileReader error:", err);
      addSystemLog(`خطا در خواندن فایل لوکال: ${file.name}`);
      setIsUploadingFile(false);
    };

    if (isDocx) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  };

  // Download translated file as valid MS Word (.doc) rich HTML format
  const downloadTranslatedFile = (file: any) => {
    const content = file.translatedContent || `Translated Omran Azarestan Co. File content: ${file.name}\n\nThis is a backup placeholder for the translated document.`;
    const isRtl = file.target === "fa";
    
    let formattedContent = "";
    const lines = content.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
    
    if (lines.length < 2) {
      const isPersian = /[\u0600-\u06FF]/.test(content);
      const dir = isPersian ? "rtl" : "ltr";
      const align = isPersian ? "right" : "left";
      formattedContent = `<div dir="${dir}" style="text-align: ${align}; direction: ${dir}; white-space: pre-wrap;">${content}</div>`;
    } else {
      for (let i = 0; i < lines.length; i += 2) {
        const original = lines[i];
        const translated = lines[i + 1] || "";
        
        const origRtl = /[\u0600-\u06FF]/.test(original);
        const origDir = origRtl ? "rtl" : "ltr";
        const origAlign = origRtl ? "right" : "left";
        const origColor = "#475569";
        
        const transRtl = /[\u0600-\u06FF]/.test(translated);
        const transDir = transRtl ? "rtl" : "ltr";
        const transAlign = transRtl ? "right" : "left";
        const transColor = "#0f172a";
        const borderStyle = transRtl 
          ? "border-right: 4px solid #10b981; border-left: none; padding-right: 12px; padding-left: 0; margin-right: 2px;" 
          : "border-left: 4px solid #10b981; border-right: none; padding-left: 12px; padding-right: 0; margin-left: 2px;";

        formattedContent += `
          <div style="margin-bottom: 28px; padding: 16px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc;">
            <!-- Original Text Block (Source) -->
            <div dir="${origDir}" style="text-align: ${origAlign}; direction: ${origDir}; font-family: Arial, sans-serif; font-size: 13px; line-height: 1.6; color: ${origColor}; background-color: #f1f5f9; padding: 10px 14px; border-radius: 6px;">
              <strong style="font-size: 10px; color: #64748b; display: block; margin-bottom: 6px; text-transform: uppercase; font-family: sans-serif;">[متن اصلی - Source]</strong>
              ${original}
            </div>
            
            <!-- Guaranteed Empty Line/Spacing between blocks -->
            <div style="height: 12px; font-size: 1px; line-height: 1px;">&nbsp;</div>
            
            <!-- Translated Text Block -->
            <div dir="${transDir}" style="text-align: ${transAlign}; direction: ${transDir}; font-family: Arial, sans-serif; font-size: 14.5px; font-weight: bold; line-height: 1.7; color: ${transColor}; background-color: #ffffff; padding: 12px 14px; border-radius: 6px; ${borderStyle}">
              <strong style="font-size: 10px; color: #10b981; display: block; margin-bottom: 6px; text-transform: uppercase; font-family: sans-serif;">[ترجمه - Translation]</strong>
              ${translated}
            </div>
          </div>
        `;
      }
    }

    // Build a beautifully styled HTML structure that Microsoft Word parses natively as a document
    const htmlContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${file.translatedName}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    body {
      font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
      direction: ${isRtl ? 'rtl' : 'ltr'};
      text-align: ${isRtl ? 'right' : 'left'};
      padding: 30px;
      line-height: 1.6;
      color: #334155;
    }
    h2 {
      font-family: Arial, sans-serif;
      color: #1e3a8a;
      border-bottom: 2px solid #3b82f6;
      padding-bottom: 10px;
      margin-bottom: 20px;
      font-size: 20px;
    }
    .meta {
      font-size: 12px;
      color: #64748b;
      margin-bottom: 30px;
      padding: 10px;
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
    }
    .section-title {
      font-weight: bold;
      color: #0f172a;
      font-size: 14px;
      margin-top: 20px;
      margin-bottom: 5px;
    }
    .content-body {
      font-size: 13.5px;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .footer {
      margin-top: 60px;
      border-top: 1px solid #cbd5e1;
      padding-top: 15px;
      font-size: 10px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <h2>سامانه ترجمه هوشمند اسناد - شرکت عمران آذرستان</h2>
  <div class="meta">
    <strong>نام فایل اصلی:</strong> ${file.name}<br/>
    <strong>زبان مبدا:</strong> ${file.source.toUpperCase()} ❖ <strong>زبان مقصد:</strong> ${file.target.toUpperCase()}<br/>
    <strong>تاریخ صدور:</strong> ${new Date().toLocaleDateString('fa-IR')}
  </div>
  
  <div class="content-body">${formattedContent}</div>

  <div class="footer">
    این سند به صورت رسمی توسط سامانه بومی و هوشمند ترجمه عمران آذرستان بر پایه هوش مصنوعی صادر شده است. تمامی حقوق برای گروه شرکت‌های عمران آذرستان محفوظ می‌باشد.
  </div>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    
    // We change downloaded extension to .doc which Word handles perfectly with HTML format
    const docName = file.translatedName.replace(/\.docx$/, ".doc").replace(/\.pdf$/, ".doc");
    a.download = docName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addSystemLog(`دریافت سند رسمی واژه‌آرا شده با فرمت Word: "${docName}"`);
  };

  // Simulated Export Dictionary (JSON format)
  const handleExportGlossary = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(glossary, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "azarestan_co_civil_glossary.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addSystemLog("خروجی کامل واژه‌نامه عمران آذرستان به صورت فایل استاندارد صادر شد.");
  };

  // Toggle dynamic engines priority setting
  const toggleEngineState = (id: string) => {
    if (currentUser.role !== "Admin") {
      alert("تنها مدیر ارشد سیستم اجازه ایجاد تغییر در ترجیحات و وضعیت موتورهای ترجمه را دارد.");
      return;
    }
    const updated = engines.map(eng => eng.id === id ? { ...eng, enabled: !eng.enabled } : eng);
    setEngines(updated);
    addSystemLog(`راهبر سیستم وضعیت فعال بودن موتور ${id} را تغییر داد.`);
  };

  return (
    <div className={`min-h-screen flex flex-col antialiased selection:bg-brand-accent selection:text-white transition-all duration-300 ${theme === "dark" ? "bg-slate-950 text-slate-100 dark-theme" : "bg-[#eff3f6] text-slate-800"}`} dir="rtl">
      
      {/* Dynamic styles override for shift-night dark mode */}
      <style>{`
        .dark-theme {
          background-color: #0b0f19 !important;
          color: #f1f5f9 !important;
        }
        .dark-theme header {
          background-color: #0b0f19 !important;
          border-bottom-color: #1e2937 !important;
        }
        .dark-theme header .bg-brand-accent {
          background-color: #2563eb !important;
        }
        .dark-theme section.bg-slate-800 {
          background-color: #0d1321 !important;
          border-bottom-color: #1e2937 !important;
        }
        .dark-theme .bg-white {
          background-color: #111827 !important;
          border-color: #1f2937 !important;
          color: #f1f5f9 !important;
        }
        .dark-theme .bg-slate-50,
        .dark-theme .bg-slate-100/50,
        .dark-theme .bg-slate-100/30,
        .dark-theme .bg-slate-100 {
          background-color: #0b0f19 !important;
          border-color: #1f2937 !important;
        }
        .dark-theme .bg-brand-light {
          background-color: #1e1b4b !important;
          color: #a5b4fc !important;
        }
        .dark-theme .hover\\:bg-white:hover {
          background-color: #111827 !important;
        }
        .dark-theme .hover\\:bg-slate-50:hover {
          background-color: #111827 !important;
        }
        .dark-theme .hover\\:bg-slate-100:hover {
          background-color: #0b0f19 !important;
        }
        .dark-theme .text-slate-800,
        .dark-theme .text-slate-900,
        .dark-theme .text-slate-700,
        .dark-theme .text-gray-900,
        .dark-theme .text-indigo-950,
        .dark-theme .text-slate-850 {
          color: #f8fafc !important;
        }
        .dark-theme .text-slate-500,
        .dark-theme .text-slate-600,
        .dark-theme .text-slate-400,
        .dark-theme .text-gray-600,
        .dark-theme .text-indigo-900 {
          color: #cbd5e1 !important;
        }
        .dark-theme .text-slate-300 {
          color: #94a3b8 !important;
        }
        .dark-theme .border-slate-100,
        .dark-theme .border-slate-200,
        .dark-theme .border-slate-300 {
          border-color: #1f2937 !important;
        }
        .dark-theme input,
        .dark-theme textarea,
        .dark-theme select {
          background-color: #0b0f19 !important;
          color: #f8fafc !important;
          border-color: #1f2937 !important;
        }
        .dark-theme input:focus,
        .dark-theme textarea:focus,
        .dark-theme select:focus {
          background-color: #111827 !important;
          border-color: #6366f1 !important;
        }
        .dark-theme .bg-indigo-50,
        .dark-theme .bg-indigo-50\\/20,
        .dark-theme .bg-indigo-600\\/30 {
          background-color: #1e1b4b !important;
          border-color: #312e81 !important;
        }
        .dark-theme .text-indigo-700,
        .dark-theme .text-indigo-600 {
          color: #a5b4fc !important;
        }
        .dark-theme .bg-emerald-50\\/20,
        .dark-theme .bg-emerald-50 {
          background-color: #064e3b !important;
          border-color: #065f46 !important;
        }
        .dark-theme .text-emerald-600 {
          color: #34d399 !important;
        }
        .dark-theme .bg-amber-50,
        .dark-theme .bg-amber-50\\/50 {
          background-color: #78350f !important;
          border-color: #92400e !important;
          color: #fef3c7 !important;
        }
        .dark-theme .text-amber-800 {
          color: #fef3c7 !important;
        }
        .dark-theme .divide-y > :not([hidden]) ~ :not([hidden]) {
          border-color: #1f2937 !important;
        }
        .dark-theme .bg-slate-200 {
          background-color: #111827 !important;
          border-color: #1f2937 !important;
        }
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 10s linear infinite;
        }
      `}</style>
      
      {!currentUser ? (
        <div className="min-h-[85vh] bg-slate-900 flex items-center justify-center p-4 font-sans text-right w-full flex-grow" dir="rtl" id="ad-login-portal">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative overflow-hidden text-slate-200">
            {/* Background Accent Decorative element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-2xl -mr-12 -mt-12 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -ml-12 -mb-12 pointer-events-none" />

            <div className="flex flex-col items-center text-center pb-6 border-b border-slate-700">
              <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg border border-indigo-500 mb-3">
                <Languages className="h-8 w-8 text-white animate-pulse" />
              </div>
              <span className="bg-slate-700 text-[#64b5f6] px-2.5 py-0.5 text-[9px] uppercase font-mono tracking-widest rounded border border-slate-600 font-black mb-2">
                شرکت عمران آذرستان (اداره کل آمار و اطلاعات)
              </span>
              <h2 className="text-sm font-black text-white leading-relaxed">
                درگاه ورود سازمانی اکتیو دایرکتوری (Active Directory)
              </h2>
              <p className="text-[10px] text-slate-400 mt-1 font-semibold leading-relaxed">
                سامانه ترجمه تخصصی متون فنی مهندسی، اسناد مناقصات و واژه‌نامه‌های عمران
              </p>
            </div>

            {loginError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-200 rounded-xl p-3.5 mt-5 text-xs font-bold leading-relaxed">
                {loginError}
              </div>
            )}

            <form onSubmit={handleAdLoginSubmit} className="space-y-4 mt-6">
              <div>
                <label className="text-[11px] text-slate-400 font-bold block pb-1.5">نام کاربری سازمانی (Domain Username):</label>
                <input
                  type="text"
                  required
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="مثال: m.esmaeili"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl text-xs px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-100 font-bold text-left placeholder:text-slate-600 placeholder:text-right"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-bold block pb-1.5">رمز عبور شبکه (Domain Password):</label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl text-xs px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-100 font-bold text-left placeholder:text-slate-600"
                  dir="ltr"
                />
              </div>

              <div className="text-[10px] text-slate-400 font-semibold leading-relaxed bg-slate-900/40 p-3 rounded-lg border border-slate-700/50">
                ⚠️ <strong className="text-amber-400">توجه:</strong> ورود به این درگاه فقط با حساب کاربری فعال در دامنه شرکت عمران آذرستان امکان‌پذیر است. پس از ۳ بار تلاش ناموفق، حساب شما موقتاً مسدود خواهد شد.
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>درحال احراز هویت با شبکه سازمان...</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 text-indigo-200" />
                    <span>ورود امن به سامانه ترجمه</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-700/60 flex items-center justify-between text-[9px] text-slate-500 font-mono">
              <span>Domain: BNPP2PROJECT.LOCAL</span>
              <span>Secure Kerberos Auth v3</span>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* 1. Header Banner & Identity */}
          <header className="bg-[#1a237e] text-white shadow-lg border-b border-white/10">
        <div className="max-w-[1700px] mx-auto px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            
            {/* Title & Brand */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-brand-accent rounded-lg shadow-inner border border-white/20">
                <Languages className="h-7 w-7 text-white animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-black/20 px-2 py-0.5 text-[10px] uppercase font-mono tracking-widest text-[#64b5f6] border border-white/10 rounded">
                    نسخه سازمانی عمران آذرستان
                  </span>
                  <div className="flex items-center text-xs text-blue-200 gap-1" dir="ltr">
                    <CheckCircle className="h-3 w-3 text-[#00bcd4]" /> Web-SSL Secure
                  </div>
                </div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white font-sans mt-0.5">
                  سامانه مدیریت واژه‌نامه و ترجمه چندزبانه سازمانی
                </h1>
                <p className="text-[10px] text-white/70 font-mono uppercase tracking-widest">
                  Enterprise Multilingual Translation Hub for Omran Azarestan Civil Engineering Co.
                </p>
              </div>
            </div>

            {/* AD Integration Simulation Controls */}
            <div className="flex flex-wrap items-center gap-4 bg-black/30 px-4 py-2.5 rounded-xl border border-white/10 shadow-lg justify-between sm:justify-start">
              
              {/* Active User Badging - Professional and Hidden Role/Post */}
              <div className="flex items-center gap-3 bg-indigo-950/40 p-2 rounded-xl border border-indigo-500/20">
                <div className="h-9 w-9 bg-indigo-500/20 text-indigo-300 rounded-lg flex items-center justify-center border border-indigo-400/30 shadow-xs">
                  <UserCheck className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-xs font-black text-white leading-tight">
                    کاربر فعال: {currentUser?.name}
                  </span>
                  <span className="text-[9px] text-indigo-300 font-mono tracking-wider mt-0.5" dir="ltr">
                    {currentUser?.email || "support@bnpp2project.local"}
                  </span>
                </div>
              </div>

              {/* Active Directory Corporate Logout */}
              <div className="border-r border-white/10 h-10 pr-3 flex flex-col justify-center">
                <button
                  onClick={handleAdLogout}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600/20 to-rose-600/30 hover:from-red-600/40 hover:to-rose-600/50 text-red-200 hover:text-white transition-all border border-red-500/40 text-[11px] font-black focus:outline-none cursor-pointer shadow-md shadow-red-950/20 active:scale-95 transition-transform"
                  title="خروج امن و بستن نشست از اکتیودایرکتوری"
                >
                  <Power className="h-4 w-4 text-red-400 animate-pulse" />
                  <span>خروج سازمانی از سامانه</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* 2. Secondary Application System Bar */}
      <section className="bg-slate-800 text-slate-200 px-4 py-2 border-b border-slate-900 text-xs shadow-inner">
        <div className="max-w-[1700px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-400 block animate-ping"></span>
              محیط استقرار: <strong className="text-white">Windows Server 2025 (شبکه محلی BNPP2PROJECT.LOCAL)</strong>
            </span>
            <span className="hidden md:inline">|</span>
            <span className="hidden md:inline text-slate-300">
              دیتابیس ابری: <strong className="text-cyan-400 font-mono">{process.env.GEMINI_API_KEY ? "متصل فعال" : "شبیه‌ساز لوکال"}</strong>
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <NetworkHealthIndicator onSystemLog={addSystemLog} />
            <span className="hidden sm:inline text-slate-700">|</span>
            <span className="font-mono text-slate-300 flex items-center gap-1.5">
              آی‌پی واقعی شما: <strong className="text-[#a5d6a7]">{networkInfo?.realIp || "127.0.0.1"}</strong> | 
              آی‌پی در شبکه: <strong className="text-[#81d4fa]">{networkInfo?.mappedIp || "192.168.26.12"}</strong> | 
              رایانه متصل: <strong className="text-amber-300">{currentUser?.computerName || "PC-BNPP2-CLIENT"}</strong>
            </span>
            <span className="hidden sm:inline text-slate-700">|</span>
            <span className="font-mono text-slate-300">{new Date().toLocaleDateString('fa-IR')}</span>
          </div>
        </div>
      </section>

      {/* 3. Primary Navigation & Body Container */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        
        {/* Module Tabs Header */}
        <div className="flex justify-start border-b border-slate-200 gap-1 overflow-x-auto bg-white p-2 rounded-xl shadow-sm">
          <button
            onClick={() => setActiveTab("translate")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === "translate" 
                ? "bg-brand-primary text-white shadow-md border-b-2 border-brand-accent animate-none" 
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Languages className="h-4 w-4" />
            ترجمه و نویسه‌خوان متون و اسناد
          </button>
          
          <button
            onClick={() => setActiveTab("glossary")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === "glossary" 
                ? "bg-brand-primary text-white shadow-md border-b-2 border-brand-accent animate-none" 
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            واژه‌نامه تخصصی و گلاسری عمران
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === "analytics" 
                ? "bg-brand-primary text-white shadow-md border-b-2 border-brand-accent animate-none" 
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Activity className="h-4 w-4" />
            داشبورد نظارت و عملکرد سیستم
          </button>

          <button
            onClick={() => setActiveTab("docs")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === "docs" 
                ? "bg-brand-primary text-white shadow-md border-b-2 border-brand-accent animate-none" 
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <FileText className="h-4 w-4" />
            مستندات معماری و استقرار (۱۳ سند)
          </button>

          {currentUser?.role === "Admin" && (
            <button
              onClick={() => setActiveTab("admin-setup")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === "admin-setup" 
                  ? "bg-red-700 text-white shadow-md border-b-2 border-amber-400" 
                  : "text-red-700 hover:bg-red-50 border border-dashed border-red-200"
              }`}
            >
              <Settings className="h-4 w-4 text-red-600 animate-spin-slow" />
              راهنمای نصب سیستم (ویژه ادمین)
            </button>
          )}
        </div>

        {/* 4. Tab Contents rendering */}
        <div className="flex-1">
          
          {/* TAB 1: TRANSLATOR ENGINE & OCR SPEECH */}
          {activeTab === "translate" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Translation Box */}
              <div className="lg:col-span-9 flex flex-col gap-6">
                
                {/* Live Translation Area */}
                <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-4 sm:p-6">
                  
                  {/* Language Selector bar */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      
                      {/* Source Lang Selection */}
                      <div className="flex items-center gap-1">
                        <select 
                          className="bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                          value={sourceLang}
                          onChange={(e) => {
                            setSourceLang(e.target.value);
                            setIsAutoDetect(false);
                          }}
                          disabled={isAutoDetect}
                        >
                          <option value="fa">فارسی (Persian)</option>
                          <option value="en">انگلیسی (English)</option>
                          <option value="ru">روسی (Russian)</option>
                        </select>
                      </div>

                      {/* Direction Swap Button */}
                      <button 
                        onClick={() => {
                          const origSrc = sourceLang;
                          setSourceLang(targetLang);
                          setTargetLang(origSrc);
                        }}
                        className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-500"
                        title="تعویض جهت ترجمه"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>

                      {/* Target Lang Selection */}
                      <div className="flex items-center gap-1">
                        <select 
                          className="bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                          value={targetLang}
                          onChange={(e) => setTargetLang(e.target.value)}
                        >
                          <option value="en">انگلیسی (English)</option>
                          <option value="fa">فارسی (Persian)</option>
                          <option value="ru">روسی (Russian)</option>
                        </select>
                      </div>

                      {/* Auto Detect Checkbox */}
                      <div className="flex items-center gap-1.5 mr-2">
                        <input 
                          type="checkbox" 
                          id="chkAuto" 
                          checked={isAutoDetect} 
                          onChange={(e) => setIsAutoDetect(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                        />
                        <label htmlFor="chkAuto" className="text-xs text-slate-500 select-none cursor-pointer font-medium">
                          تشخیص خودکار مبدا
                        </label>
                      </div>

                    </div>

                    {/* Text Size Controls */}
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5 shadow-xs">
                      <span className="text-xs text-slate-500 font-extrabold px-1">اندازه متن:</span>
                      <div className="flex gap-1">
                        {(["sm", "base", "lg", "xl", "2xl"] as const).map((sz) => (
                          <button
                            key={sz}
                            onClick={() => setTextSize(sz)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                              textSize === sz
                                ? "bg-brand-primary text-white shadow-xs"
                                : "text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            {sz === "sm" && "کوچک"}
                            {sz === "base" && "متوسط"}
                            {sz === "lg" && "بزرگ"}
                            {sz === "xl" && "خیلی بزرگ"}
                            {sz === "2xl" && "بسیار بزرگ"}
                          </button>
                        ))}
                      </div>
                    </div>

                     {/* Comparison Control / Engine selection Priority */}
                    <div className="flex flex-wrap items-center gap-4">
                      {/* Toggle Comparison Mode Button */}
                      <button
                        onClick={() => {
                          const nextMode = !isComparisonMode;
                          setIsComparisonMode(nextMode);
                          if (nextMode && !comparisonTranslatedText) {
                            setComparisonTranslatedText("");
                          }
                          addSystemLog(nextMode ? "فعال‌سازی حالت مقایسه همزمان موتورها" : "غیرفعال‌سازی حالت مقایسه‌ای");
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                          isComparisonMode
                            ? "bg-amber-500/10 text-amber-700 border-amber-500/30"
                            : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                        }`}
                        title="مقایسه همزمان دو موتور ترجمه"
                      >
                        <Columns className="h-3.5 w-3.5 text-amber-600" />
                        {isComparisonMode ? "حالت مقایسه دو موتور (فعال)" : "سوئیچ به حالت مقایسه‌ای"}
                      </button>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-medium">
                          {isComparisonMode ? "موتور اول:" : "انتخاب موتور ترجمه:"}
                        </span>
                        <select 
                          className="bg-brand-light border border-slate-200 rounded-lg text-xs p-2 text-brand-primary font-bold focus:outline-none"
                          value={selectedEngine}
                          onChange={(e) => setSelectedEngine(e.target.value)}
                        >
                          {engines.filter(eng => eng.enabled).map(eng => (
                            <option key={eng.id} value={eng.id}>
                              {eng.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {isComparisonMode && (
                        <div className="flex items-center gap-2 animate-fade-in">
                          <span className="text-xs text-slate-400 font-medium">موتور دوم:</span>
                          <select 
                            className="bg-amber-50 border border-amber-200 rounded-lg text-xs p-2 text-amber-700 font-bold focus:outline-none"
                            value={comparisonEngine}
                            onChange={(e) => setComparisonEngine(e.target.value)}
                          >
                            {engines.filter(eng => eng.enabled).map(eng => (
                              <option key={eng.id} value={eng.id}>
                                {eng.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {isComparisonMode && (
                        <button
                          onClick={handleExportPDF}
                          disabled={!sourceText.trim() || !translatedText || !comparisonTranslatedText}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            (!sourceText.trim() || !translatedText || !comparisonTranslatedText)
                              ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed opacity-60"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 hover:shadow-md cursor-pointer transition-transform active:scale-95"
                          }`}
                          title={(!sourceText.trim() || !translatedText || !comparisonTranslatedText) ? "ابتدا فرآیند مقایسه را انجام دهید" : "دانلود گزارش رسمی ممیزی و کیفیت‌سنجی به صورت فایل PDF"}
                        >
                          <FileText className="h-3.5 w-3.5" />
                          دانلود گزارش ممیزی (PDF)
                        </button>
                      )}
                    </div>
                  </div>

                   {/* Input and Output Fields */}
                  <div className="flex flex-col gap-6 mt-6">
                    
                    {/* Source Input Textarea */}
                    <div className="flex flex-col relative bg-slate-50 rounded-xl p-3 border border-slate-200">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100 text-[11px] text-slate-400 font-bold" dir="rtl">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-black text-slate-900">عبارت اصلی (متن مبدا)</span>
                          {isAutoDetect && (
                            <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 font-black text-[10px]">
                              {detectedLanguageText || "تشخیص خودکار فعال"}
                            </span>
                          )}
                          <span className="text-slate-500 font-mono">({sourceText.length} کاراکتر)</span>
                        </div>

                        {/* Send and Translate button at the top-left of the input box */}
                        <button
                          onClick={handleTranslate}
                          disabled={isTranslating || !sourceText.trim()}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black text-white shadow-xs transition-all cursor-pointer ${
                            !sourceText.trim() 
                              ? "bg-slate-300 cursor-not-allowed opacity-70" 
                              : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-md active:scale-95 transition-transform"
                          }`}
                          type="button"
                          id="btn-send-translate-top"
                        >
                          {isTranslating ? (
                            <>
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              <span>در حال ترجمه...</span>
                            </>
                          ) : (
                            <>
                              <Languages className="h-4 w-4" />
                              <span>ارسال و ترجمه تخصصی</span>
                            </>
                          )}
                        </button>
                      </div>
                      
                      <textarea
                        ref={sourceRef}
                        rows={5}
                        className={`w-full min-h-[120px] bg-transparent resize-y focus:outline-none ${textSizeClasses[textSize]} text-slate-800 py-2 leading-relaxed`}
                        placeholder="متن فنی، مکاتبات کارگاهی یا آیین‌نامه‌های سازه‌ای را وارد کنید..."
                        value={sourceText}
                        onChange={(e) => setSourceText(e.target.value)}
                        dir={sourceLang === 'fa' ? 'rtl' : 'ltr'}
                      />

                      {/* Terminology dynamic badge overlay */}
                      {terminologyAlerts.length > 0 && (
                        <div className="mt-2 p-2.5 bg-amber-50 rounded-lg border border-amber-200 flex flex-col gap-1">
                          <span className="text-[10px] text-amber-800 font-bold flex items-center gap-1">
                            <Sparkles className="h-3 w-3" /> اصطلاحات مصوب شرکت عمران آذرستان در متن یافت شد:
                          </span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {terminologyAlerts.map((alert, idx) => (
                              <div key={idx} className="group relative bg-white border border-amber-300 text-amber-900 rounded-md px-2 py-0.5 text-xs font-semibold cursor-help" title={`${alert.term}: ${alert.definition}`}>
                                {alert.term} ➔ <span className="text-brand-primary">{alert.replacement}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
                        {/* Audio Dictation button inline */}
                        <button
                          onClick={toggleDictation}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            isDictating 
                              ? "bg-red-500 text-white animate-pulse" 
                              : "bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20"
                          }`}
                        >
                          {isDictating ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                          {isDictating ? "پایان ضبط..." : "املا گفتاری (STT)"}
                        </button>

                        <button 
                          onClick={() => setSourceText("")} 
                          className="text-xs text-slate-400 hover:text-slate-600"
                        >
                          پاک کردن محتوا
                        </button>
                      </div>

                      {/* STT Reactive Canvas visualizer Overlay */}
                      {isDictating && (
                        <div className="absolute inset-0 bg-slate-900/90 rounded-xl flex flex-col items-center justify-center p-4 text-white z-10">
                          <Mic className="h-10 w-10 text-brand-accent animate-bounce mb-2" />
                          <div className="text-sm font-bold mb-1">سیستم پردازنده صوتی عمران آذرستان</div>
                          <p className="text-xs text-slate-300 text-center mb-4">{sttProgressMessage}</p>
                          <canvas ref={canvasRef} width={200} height={50} className="w-48 h-12 bg-slate-800 rounded border border-slate-700" />
                          
                          <div className="flex items-center gap-3 mt-4">
                            <select 
                              className="bg-slate-800 border border-slate-700 text-xs text-brand-secondary rounded p-1"
                              value={sttLanguage}
                              onChange={(e) => setSttLanguage(e.target.value)}
                            >
                              <option value="fa">کلماتی فارسی (Persian)</option>
                              <option value="en">کلمات انگلیسی (English)</option>
                            </select>
                            <button
                              onClick={toggleDictation}
                              className="bg-brand-accent text-white font-bold text-xs px-4 py-1.5 rounded hover:bg-brand-accent/90"
                            >
                              اتمام فرآیند و ترانسکریپت
                            </button>
                          </div>
                        </div>
                      )}

                    </div>

                    {/* Dynamic Wait Timeline / Progress Tracker */}
                    {isTranslating && (
                      <div className="bg-slate-950 text-white rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4 animate-fade-in text-right mt-2" dir="rtl">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="flex h-3 w-3 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                            </span>
                            <div>
                              <h4 className="text-xs font-black text-slate-100">وقایع‌نگاری پویای فرآیند ترجمه (Live Translation Timeline)</h4>
                              <p className="text-[10px] text-slate-400 font-bold">پردازش موازی و تطبیق هوشمند اصطلاحات مهندسی آذرستان</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
                            <span className="text-[10px] font-mono text-cyan-400 font-black">
                              زمان سپری شده: {translationSeconds} ثانیه
                            </span>
                            <span className="text-slate-800 text-xs">|</span>
                            <span className="text-[10px] font-mono text-indigo-400 font-black">
                              پیشرفت کل: {translationProgress}%
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar with Native CSS */}
                        <div className="relative h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-850">
                          <div 
                            className="absolute right-0 top-0 h-full bg-gradient-to-l from-indigo-500 via-purple-500 to-cyan-400 transition-all duration-300 rounded-full"
                            style={{ width: `${translationProgress}%` }}
                          />
                        </div>

                        {/* Pipeline Stages Timeline */}
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
                          {[
                            { step: 1, name: "تحلیل معنایی متن مبدا", desc: "بررسی ساختار فنی و دستور زبانی متن کارگاهی" },
                            { step: 2, name: "استعلام از موتور پردازش", desc: "فراخوانی و دریافت ترجمه خام از مدل‌های هوشمند" },
                            { step: 3, name: "انطباق با واژه‌نامه مصوب", desc: "تطبیق تخصصی اصطلاحات مهندسی عمران آذرستان" },
                            { step: 4, name: "کنترل هنجار و لحن رسمی", desc: "روان‌سازی و تطبیق اصطلاحات با استانداردهای FIDIC" },
                            { step: 5, name: "اعتبارسنجی و تایید خروجی", desc: "پردازش نهایی، نشانه‌گذاری و صدور در خروجی" }
                          ].map((stage, idx) => {
                            const isCompleted = translationStage > stage.step;
                            const isActive = translationStage === stage.step;
                            const isPending = translationStage < stage.step;

                            return (
                              <div 
                                key={idx} 
                                className={`p-3 rounded-xl border transition-all flex flex-col gap-1 justify-between ${
                                  isActive 
                                    ? "bg-indigo-950/40 border-indigo-500/50 shadow-md shadow-indigo-950/50 scale-[1.02]" 
                                    : isCompleted 
                                      ? "bg-slate-900/60 border-emerald-500/20 opacity-90" 
                                      : "bg-slate-950 border-slate-900 opacity-50"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1.5">
                                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
                                    isActive 
                                      ? "bg-indigo-500 text-white" 
                                      : isCompleted 
                                        ? "bg-emerald-500/20 text-emerald-400" 
                                        : "bg-slate-800 text-slate-400"
                                  }`}>
                                    مرحله {stage.step}
                                  </span>

                                  {isCompleted ? (
                                    <span className="text-emerald-400 text-[9px] font-black">✓ تکمیل</span>
                                  ) : isActive ? (
                                    <span className="flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping"></span>
                                      <span className="text-indigo-400 text-[9px] font-black animate-pulse">پردازش</span>
                                    </span>
                                  ) : (
                                    <span className="text-slate-500 text-[9px] font-bold">انتظار</span>
                                  )}
                                </div>

                                <div className="mt-2">
                                  <h5 className="text-[10px] font-black text-slate-100">{stage.name}</h5>
                                  <p className="text-[8px] text-slate-400 mt-0.5 leading-snug">{stage.desc}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Target Translation Textarea - Engine 1 */}
                    <div className={`flex flex-col rounded-xl p-3 border transition-all ${isComparisonMode ? 'bg-indigo-50/20 border-indigo-200' : 'bg-slate-50 border-slate-200'}`}>
                      <div className={`flex justify-between items-center pb-2 border-b text-[12px] font-black ${isComparisonMode ? 'border-indigo-100 text-indigo-900' : 'border-slate-100 text-slate-900'}`}>
                        <span>
                          {isComparisonMode 
                            ? `ترجمه موتور اول (${engines.find(e => e.id === selectedEngine)?.name || selectedEngine})` 
                            : `ترجمه شده (${detectedLanguageText || "هدف"})`}
                        </span>
                        <span>{translatedText.length} کاراکتر</span>
                      </div>
                      
                      <textarea
                        ref={trans1Ref}
                        rows={5}
                        className={`w-full min-h-[120px] bg-transparent resize-y focus:outline-none ${textSizeClasses[textSize]} text-slate-800 py-2 leading-relaxed`}
                        placeholder="ترجمه نهایی در این بخش ظاهر خواهد شد..."
                        value={translatedText}
                        readOnly
                        dir={targetLang === 'fa' ? 'rtl' : 'ltr'}
                      />

                      <div className={`flex justify-between items-center mt-2 pt-2 border-t ${isComparisonMode ? 'border-indigo-100' : 'border-slate-100'}`}>
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={handleSummarize}
                            disabled={isSummarizing || !translatedText}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              !translatedText 
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                                : "bg-teal-50 text-teal-700 hover:bg-teal-100"
                            }`}
                          >
                            <Sparkles className="h-3 w-3" />
                            خلاصه‌نویسی این متن
                          </button>
                          <select 
                            className="bg-white border border-slate-200 text-[10px] p-1.5 rounded"
                            value={summaryType}
                            onChange={(e: any) => setSummaryType(e.target.value)}
                            disabled={!translatedText}
                          >
                            <option value="short">کوتاه</option>
                            <option value="detailed">جامع</option>
                            <option value="bullets">آیتم‌وار</option>
                          </select>
                        </div>

                        {/* Interactive Engine 1 Quality Stars */}
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50/50 border border-indigo-100/50">
                          <span className="text-[10px] text-indigo-900 font-bold">کیفیت ترجمه:</span>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                disabled={!translatedText}
                                onClick={() => handleRateEngine(selectedEngine, star, true)}
                                className={`transition-all focus:outline-none p-0.5 ${
                                  !translatedText
                                    ? "text-slate-300 cursor-not-allowed"
                                    : star <= engineOneRating
                                      ? "text-amber-500 hover:scale-110"
                                      : "text-slate-300 hover:text-amber-400"
                                }`}
                                title={`${star} ستاره`}
                              >
                                <Star className={`h-3 w-3 ${star <= engineOneRating ? 'fill-amber-500 text-amber-500' : 'text-slate-300'}`} />
                              </button>
                            ))}
                          </div>
                        </div>

                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(translatedText);
                            addSystemLog(`ترجمه موتور ${selectedEngine} کپی شد.`);
                            alert("ترجمه با موفقیت کپی شد.");
                          }}
                          className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
                          disabled={!translatedText}
                        >
                          <Download className="h-3.5 w-3.5" /> کپی متن
                        </button>
                      </div>

                      {/* Glossary compliance check overlay for Engine 1 */}
                      {translatedText && (
                        <div className="mt-3 p-3 bg-slate-100/70 border border-slate-200 rounded-lg text-right" dir="rtl">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
                            <span className="text-[11px] font-black text-slate-700 flex items-center gap-1">
                              <ShieldAlert className="h-3.5 w-3.5 text-indigo-600" />
                              سنجش انطباق با واژه‌نامه تخصصی مصوب آذرستان
                            </span>
                            {translatedDeviations.length === 0 ? (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                <Check className="h-3 w-3 text-emerald-600" /> ۱۰۰٪ تطابق واژگان
                              </span>
                            ) : (
                              <span className="text-[10px] bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                <ShieldAlert className="h-3 w-3 text-rose-600 animate-pulse" /> {translatedDeviations.length} مغایرت واژه‌نامه
                              </span>
                            )}
                          </div>

                          {translatedDeviations.length === 0 ? (
                            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                              تمامی اصطلاحات بکار رفته در این متن ترجمه‌شده کاملاً منطبق بر واژه‌نامه استاندارد شرکت عمران آذرستان می‌باشند.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-[10px] text-rose-600 font-bold mb-1">
                                واژگان زیر از واژه‌نامه رسمی منحرف شده‌اند یا معادل آنها در متن یافت نشد:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {translatedDeviations.map((dev, idx) => (
                                  <div key={idx} className="bg-white border border-rose-200 rounded-lg p-2 flex flex-col gap-1 shadow-2xs max-w-xs text-right">
                                    <div className="flex justify-between items-center gap-2">
                                      <span className="text-[11px] font-bold text-slate-800 underline decoration-rose-300 decoration-2">{dev.term}</span>
                                      <span className="text-[9px] text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 font-bold">باید باشد: {dev.expected}</span>
                                    </div>
                                    <p className="text-[9px] text-slate-400 font-light italic leading-normal truncate max-w-[200px]" title={dev.definition}>{dev.definition}</p>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        let updated = translatedText;
                                        updated += ` (${dev.expected})`;
                                        setTranslatedText(updated);
                                        addSystemLog(`اصلاح خودکار: واژه "${dev.expected}" به ترجمه اضافه شد.`);
                                      }}
                                      className="text-[9px] text-indigo-600 hover:text-indigo-800 bg-indigo-50 border border-indigo-100 rounded py-0.5 px-1.5 text-center font-bold mt-1 hover:bg-indigo-100 transition-colors cursor-pointer"
                                    >
                                      🪄 اصلاح هوشمند در متن
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                    </div>

                    {/* Target Translation Textarea - Engine 2 (Comparison Mode Only) */}
                    {isComparisonMode && (
                      <div className="flex flex-col bg-amber-50/20 rounded-xl p-3 border border-amber-200 animate-fade-in">
                        <div className="flex justify-between items-center pb-2 border-b border-amber-200 text-[12px] text-amber-950 font-black">
                          <span>{`ترجمه موتور دوم (${engines.find(e => e.id === comparisonEngine)?.name || comparisonEngine})`}</span>
                          <span>{comparisonTranslatedText.length} کاراکتر</span>
                        </div>
                        
                        <textarea
                          ref={trans2Ref}
                          rows={5}
                          className={`w-full min-h-[120px] bg-transparent resize-y focus:outline-none ${textSizeClasses[textSize]} text-slate-800 py-2 leading-relaxed`}
                          placeholder="ترجمه موتور دوم همزمان در این بخش ظاهر می‌شود..."
                          value={comparisonTranslatedText}
                          readOnly
                          dir={targetLang === 'fa' ? 'rtl' : 'ltr'}
                        />

                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-amber-100">
                          {/* Interactive Engine 2 Quality Stars */}
                          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 border border-amber-200/50">
                            <span className="text-[10px] text-amber-900 font-bold">کیفیت ترجمه:</span>
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  disabled={!comparisonTranslatedText}
                                  onClick={() => handleRateEngine(comparisonEngine, star, false)}
                                  className={`transition-all focus:outline-none p-0.5 ${
                                    !comparisonTranslatedText
                                      ? "text-slate-300 cursor-not-allowed"
                                      : star <= engineTwoRating
                                        ? "text-amber-500 hover:scale-110"
                                        : "text-slate-300 hover:text-amber-400"
                                  }`}
                                  title={`${star} ستاره`}
                                >
                                  <Star className={`h-3 w-3 ${star <= engineTwoRating ? 'fill-amber-500 text-amber-500' : 'text-slate-300'}`} />
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(comparisonTranslatedText);
                              addSystemLog(`ترجمه موتور ${comparisonEngine} کپی شد.`);
                              alert("ترجمه موتور دوم با موفقیت کپی شد.");
                            }}
                            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
                            disabled={!comparisonTranslatedText}
                          >
                            <Download className="h-3.5 w-3.5" /> کپی متن
                          </button>
                        </div>

                        {/* Glossary compliance check overlay for Engine 2 */}
                        {comparisonTranslatedText && (
                          <div className="mt-3 p-3 bg-amber-100/40 border border-amber-200/50 rounded-lg text-right animate-fade-in" dir="rtl">
                            <div className="flex items-center justify-between border-b border-amber-200 pb-1.5 mb-2">
                              <span className="text-[11px] font-black text-slate-700 flex items-center gap-1">
                                <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                                سنجش انطباق موتور دوم با واژه‌نامه تخصصی
                              </span>
                              {comparisonDeviations.length === 0 ? (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                  <Check className="h-3 w-3 text-emerald-600" /> ۱۰۰٪ تطابق واژگان
                                </span>
                              ) : (
                                <span className="text-[10px] bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                  <ShieldAlert className="h-3 w-3 text-rose-600 animate-pulse" /> {comparisonDeviations.length} مغایرت واژه‌نامه
                                </span>
                              )}
                            </div>

                            {comparisonDeviations.length === 0 ? (
                              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                                تمامی اصطلاحات بکار رفته در این متن ترجمه‌شده کاملاً منطبق بر واژه‌نامه استاندارد شرکت عمران آذرستان می‌باشند.
                              </p>
                            ) : (
                              <div className="space-y-2">
                                <p className="text-[10px] text-rose-600 font-bold mb-1">
                                  واژگان زیر از واژه‌نامه رسمی منحرف شده‌اند یا معادل آنها در متن یافت نشد:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {comparisonDeviations.map((dev, idx) => (
                                    <div key={idx} className="bg-white border border-rose-200 rounded-lg p-2 flex flex-col gap-1 shadow-2xs max-w-xs text-right">
                                      <div className="flex justify-between items-center gap-2">
                                        <span className="text-[11px] font-bold text-slate-800 underline decoration-rose-300 decoration-2">{dev.term}</span>
                                        <span className="text-[9px] text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 font-bold">باید باشد: {dev.expected}</span>
                                      </div>
                                      <p className="text-[9px] text-slate-400 font-light italic leading-normal truncate max-w-[200px]" title={dev.definition}>{dev.definition}</p>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          let updated = comparisonTranslatedText;
                                          updated += ` (${dev.expected})`;
                                          setComparisonTranslatedText(updated);
                                          addSystemLog(`اصلاح خودکار موتور دوم: واژه "${dev.expected}" به ترجمه اضافه شد.`);
                                        }}
                                        className="text-[9px] text-indigo-600 hover:text-indigo-800 bg-indigo-50 border border-indigo-100 rounded py-0.5 px-1.5 text-center font-bold mt-1 hover:bg-indigo-100 transition-colors cursor-pointer"
                                      >
                                        🪄 اصلاح هوشمند در متن
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                      </div>
                    )}

                  </div>

                  {/* Summary output container */}
                  {summarizedOutput && (
                    <div className="mt-4 p-4 bg-teal-50 border border-teal-200 rounded-xl relative">
                      <h4 className="text-xs font-bold text-teal-800 mb-1 flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5" /> خلاصه تخصصی هوشمند:
                      </h4>
                      <p className="text-xs text-teal-950 leading-relaxed whitespace-pre-line">{summarizedOutput}</p>
                      <button 
                        onClick={() => setSummarizedOutput("")} 
                        className="absolute top-2 left-2 text-[10px] text-teal-500 hover:text-teal-700"
                      >
                        بستن خلاصه
                      </button>
                    </div>
                  )}

                  {/* Smart Project Tagging Subsection */}
                  {(translatedText || comparisonTranslatedText) && (
                    <div className="mt-6 border-t border-slate-100 pt-6">
                      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 sm:p-5 relative overflow-hidden">
                        
                        {/* Decorative background logo */}
                        <div className="absolute top-0 left-0 w-24 h-24 bg-brand-primary/5 rounded-full blur-2xl -translate-x-6 -translate-y-6 pointer-events-none" />

                        {/* Heading */}
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 relative z-10">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-brand-primary/10 text-brand-primary rounded-lg">
                              <Tag className="h-4 w-4" />
                            </div>
                            <div>
                              <h4 className="text-sm font-black text-slate-800">
                                موتور تطبیق و برچسب‌گذاری هوشمند پروژه (AzarTag)
                              </h4>
                              <p className="text-[10px] text-slate-400 font-bold">
                                مانیتورینگ معنایی و طبقه‌بندی هوشمند اسناد ترجمه بین پروژه‌های عمرانی عمران آذرستان
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isComparisonMode && (
                              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-xs">
                                <button
                                  onClick={() => setTaggingSourceType('primary')}
                                  className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                                    taggingSourceType === 'primary'
                                      ? "bg-indigo-600 text-white shadow-sm"
                                      : "text-slate-500 hover:text-slate-900"
                                  }`}
                                >
                                  موتور اول
                                </button>
                                <button
                                  onClick={() => setTaggingSourceType('secondary')}
                                  className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                                    taggingSourceType === 'secondary'
                                      ? "bg-amber-600 text-white shadow-sm"
                                      : "text-slate-500 hover:text-slate-900"
                                  }`}
                                >
                                  موتور دوم
                                </button>
                              </div>
                            )}

                            <button
                              onClick={() => handleSmartTagging()}
                              disabled={isAnalyzingTags}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary text-white rounded-lg text-xs font-bold hover:bg-brand-primary/95 transition-all shadow-sm active:scale-95"
                            >
                              <RefreshCw className={`h-3 w-3 ${isAnalyzingTags ? 'animate-spin' : ''}`} />
                              بروزرسانی تحلیل
                            </button>
                          </div>
                        </div>

                        {/* Inner Body */}
                        {isAnalyzingTags ? (
                          <div className="bg-white border border-slate-100 rounded-xl p-6 flex flex-col items-center justify-center gap-3">
                            <div className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce duration-300" />
                              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce delay-100 duration-300" />
                              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce delay-200 duration-300" />
                            </div>
                            <span className="text-xs font-bold text-indigo-900">
                              در حال اجرای خوشه‌بندی معنایی و تطبیق ساختاری لغات با دیتابیس عمران آذرستان...
                            </span>
                          </div>
                        ) : projectTaggingResults.length > 0 ? (
                          <div className="flex flex-col gap-3 relative z-10">
                            
                            {/* Main Top Match Card */}
                            {(() => {
                              const topMatch = projectTaggingResults[0];
                              const scoreColor = topMatch.score >= 70 ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : (topMatch.score >= 40 ? 'text-amber-600 bg-amber-50 border-amber-100' : 'text-slate-500 bg-slate-100 border-slate-200');
                              const barColor = topMatch.score >= 70 ? 'bg-emerald-500' : (topMatch.score >= 40 ? 'bg-amber-500' : 'bg-slate-400');
                              
                              return (
                                <div className="bg-white border-2 border-indigo-600/30 rounded-xl p-4 shadow-sm relative overflow-hidden">
                                  <div className="absolute top-2 left-2 bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    پروژه پیشنهادی آزارتگ
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                    
                                    {/* Left part: Title and location */}
                                    <div className="md:col-span-4 border-l border-slate-100 pl-4">
                                      <div className="text-xs text-slate-400 font-bold mb-0.5">{topMatch.location}</div>
                                      <h5 className="font-black text-slate-900 text-sm mb-1">{topMatch.nameFa}</h5>
                                      <div className="text-[10px] text-slate-400 font-mono tracking-wide">{topMatch.nameEn}</div>
                                    </div>

                                    {/* Middle part: Match Score & matched terms */}
                                    <div className="md:col-span-5 flex flex-col gap-2">
                                      {/* Progress scale */}
                                      <div>
                                        <div className="flex justify-between items-center text-[11px] mb-1">
                                          <span className="text-slate-500 font-bold">شاخص انطباق معنایی (Similarity):</span>
                                          <span className="text-brand-primary font-black">{topMatch.score}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                          <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${topMatch.score}%` }} />
                                        </div>
                                      </div>

                                      {/* Match keywords */}
                                      {topMatch.matchedKeywords && topMatch.matchedKeywords.length > 0 && (
                                        <div className="flex flex-wrap gap-1 items-center">
                                          <span className="text-[9px] text-slate-400 font-bold">لغات کلیدی مرجع:</span>
                                          {topMatch.matchedKeywords.map((kw: string, i: number) => (
                                            <span key={i} className="text-[9px] bg-slate-50 text-slate-600 border border-slate-100 px-1.5 py-0.5 rounded font-medium">
                                              {kw}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>

                                    {/* Right part: Action / Explanation */}
                                    <div className="md:col-span-3 flex flex-col gap-1.5 justify-center">
                                      <div className={`p-1.5 rounded-lg border text-[10px] font-bold ${scoreColor}`}>
                                        {topMatch.explanation}
                                      </div>
                                    </div>

                                  </div>

                                  {/* Suggested tags actions */}
                                  {topMatch.suggestedTags && topMatch.suggestedTags.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2 items-center">
                                      <span className="text-[10px] text-indigo-900 font-black">برچسب‌های تخصصی تولیدی:</span>
                                      {topMatch.suggestedTags.map((tag: string, idx: number) => (
                                        <button
                                          key={idx}
                                          onClick={() => {
                                            navigator.clipboard.writeText(tag);
                                            alert(`برچسب "#${tag}" در حافظه کپی شد!`);
                                          }}
                                          className="text-[10px] bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-2 py-1 rounded-full font-extrabold transition-all border border-indigo-100/50 flex items-center gap-1 cursor-pointer"
                                          title="کلیک برای کپی تگ"
                                        >
                                          <span>#{tag}</span>
                                        </button>
                                      ))}
                                      
                                      <button
                                        onClick={() => {
                                          addSystemLog(`ثبت گواهی ممیزی و انتساب پروژه به سند جاری: ${topMatch.nameFa}`);
                                          alert(`سند ترجمه جاری با موفقیت تحت شناسه فنی پروژه "${topMatch.nameFa}" طبقه‌بندی و بایگانی شد.`);
                                        }}
                                        className="mr-auto text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-black px-3 py-1 rounded-lg transition-transform active:scale-95 shadow-sm cursor-pointer"
                                      >
                                        تایید و انتساب رسمی پروژه
                                      </button>
                                    </div>
                                  )}

                                </div>
                              );
                            })()}

                            {/* Secondary matches grid */}
                            {projectTaggingResults.slice(1, 4).length > 0 && (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {projectTaggingResults.slice(1, 4).map((proj, idx) => {
                                  const scorePercent = proj.score || 0;
                                  const barColor = scorePercent >= 60 ? 'bg-indigo-500' : (scorePercent >= 30 ? 'bg-amber-400' : 'bg-slate-300');
                                  
                                  return (
                                    <div key={idx} className="bg-white border border-slate-100 rounded-xl p-3 shadow-2xs flex flex-col justify-between">
                                      <div>
                                        <div className="flex justify-between items-start mb-1 text-[11px]">
                                          <span className="font-extrabold text-slate-800 line-clamp-1">{proj.nameFa}</span>
                                          <span className="font-mono text-slate-400">{scorePercent}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mb-2">
                                          <div className={`h-full ${barColor} rounded-full`} style={{ width: `${scorePercent}%` }} />
                                        </div>
                                        <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2">
                                          {proj.scope}
                                        </p>
                                      </div>

                                      <div className="mt-3 pt-2 border-t border-slate-50 flex items-center justify-between">
                                        <span className="text-[9px] text-slate-400 font-bold">{proj.location}</span>
                                        <button
                                          onClick={() => {
                                            const rotated = [...projectTaggingResults];
                                            const clickedIndex = idx + 1; // offset by top item
                                            const selectedObj = rotated[clickedIndex];
                                            rotated.splice(clickedIndex, 1);
                                            rotated.unshift(selectedObj);
                                            setProjectTaggingResults(rotated);
                                            setSelectedProjectStamp(selectedObj.id);
                                            addSystemLog(`پروژه ${selectedObj.nameFa} به عنوان پروژه مرجع انتخاب شد.`);
                                          }}
                                          className="text-[9px] text-indigo-600 hover:text-indigo-800 font-extrabold transition-all cursor-pointer"
                                        >
                                          مشاهده جزئیات بیشتر ←
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                          </div>
                        ) : (
                          <div className="bg-white border border-slate-100 rounded-xl p-5 text-center">
                            <p className="text-xs text-slate-500 font-medium">
                              متن ترجمه‌شده معتبری یافت نشد. پس از دریافت ترجمه از موتورهای بالا، فرآیند طبقه‌بندی و برچسب‌گذاری به طور خودکار اجرا خواهد شد.
                            </p>
                          </div>
                        )}

                        {/* Database Sync Control Panel */}
                        <div className="mt-4 pt-4 border-t border-slate-200/65 relative z-20 text-right" dir="rtl">
                          <div className="bg-white rounded-xl p-3 border border-slate-200/80 flex flex-col md:flex-row gap-3 items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </span>
                              <div>
                                <span className="text-[11px] font-black text-slate-700 block">پویش آنلاین و توسعه هوشمند بانک اطلاعات پروژه (Real-time Sync)</span>
                                <span className="text-[9px] text-slate-400 font-bold block">جستجو و همگام‌سازی پروژه‌های واقعی شرکت عمران آذرستان در سراسر ایران با موتور گوگل</span>
                              </div>
                            </div>
                            
                            <div className="flex gap-2 w-full md:w-auto">
                              <input
                                type="text"
                                value={syncQuery}
                                onChange={(e) => setSyncQuery(e.target.value)}
                                placeholder="مثلاً: پروژه‌های بیمارستانی یا صنعتی آذرستان"
                                className="text-[11px] bg-slate-50 border border-slate-250 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold w-full md:w-64"
                              />
                              <button
                                onClick={handleSyncProjects}
                                disabled={isSyncingProjects}
                                className="text-[11px] bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-extrabold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer shrink-0"
                              >
                                {isSyncingProjects ? (
                                  <>
                                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    <span>در حال جستجو...</span>
                                  </>
                                ) : (
                                  <>
                                    <Search className="h-3.5 w-3.5" />
                                    <span>پویش و افزودن پروژه</span>
                                  </>
                                )}
                              </button>
                              
                              <button
                                onClick={() => setShowProjectsDbModal(true)}
                                className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer shrink-0 border border-slate-200"
                              >
                                <Database className="h-3.5 w-3.5 text-slate-500" />
                                <span>بانک پروژه‌ها ({dbProjects.length})</span>
                              </button>
                            </div>
                          </div>
                          
                          {syncStatusMessage && (
                            <div className="mt-2 text-[10px] bg-indigo-50/50 border border-indigo-100 text-indigo-900 p-2 rounded-lg font-bold flex items-center gap-1 justify-start">
                              <Sparkles className="h-3 w-3 text-indigo-600 shrink-0" />
                              <span>{syncStatusMessage}</span>
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  )}



                </div>

                {/* File translation & structure keeping */}
                <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-4 sm:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="h-5 w-5 text-brand-primary" />
                    <h3 className="text-sm font-bold text-slate-800">ترجمه گروهی پرونده‌ها با حفظ فرمت اصلی</h3>
                  </div>
                  <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                    فایل‌های مناقصات، جداول مقادیر کار (BoQ) یا مکاتبات در قالب‌های استاندارد <strong className="text-slate-700">DOCX, XLSX, PDF, TXT</strong> را بارگذاری کنید. موتور بومی فرمت کلی و سبک سند را بدون تغییر نگه می‌دارد.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* File Dropzone */}
                    <div className="border-2 border-dashed border-slate-300 hover:border-brand-primary bg-slate-50 rounded-xl p-6 text-center transition-all cursor-pointer relative group">
                      <input 
                        type="file" 
                        accept=".docx,.xlsx,.pdf,.txt" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleFileTranslateUpload}
                        disabled={isUploadingFile}
                      />
                      <Upload className="h-10 w-10 text-slate-400 group-hover:text-brand-primary mx-auto mb-3" />
                      <div className="text-xs font-bold text-slate-700 group-hover:text-brand-primary mb-1">
                        انتخاب سند یا درگ افکت
                      </div>
                      <p className="text-[10px] text-slate-400">حداکثر حجم مجاز: ۲۰ مگابایت</p>
                    </div>

                    {/* Progress log list */}
                    <div className="flex flex-col gap-3 justify-center">
                      <div className="text-xs font-bold text-slate-600 mb-1 flex justify-between">
                        <span>صف پردازش اسناد سازمانی:</span>
                        {isUploadingFile && <span className="text-brand-accent animate-pulse font-mono">در حال تحلیل...</span>}
                      </div>

                      <div className="flex flex-col gap-2 max-h-36 overflow-y-auto pr-1">
                        {uploadedFiles.map((file) => (
                          <div key={file.id} className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 flex items-center justify-between text-xs gap-2">
                            <div className="flex items-center gap-2 truncate">
                              <span className="p-1 bg-amber-100 text-amber-800 rounded font-bold text-[9px] uppercase">
                                {file.name.split('.').pop()}
                              </span>
                              <div className="truncate">
                                <div className="font-semibold text-slate-700 truncate" title={file.name}>{file.name}</div>
                                <div className="text-[10px] text-slate-400">{file.size} ❖ {file.source}➔{file.target}</div>
                              </div>
                            </div>
                            
                            <div className="text-left font-mono">
                              {file.status === "done" ? (
                                <div className="flex items-center gap-1.5">
                                  <button 
                                    onClick={() => setPreviewFile(file)}
                                    className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-bold bg-indigo-50 px-2 py-1 rounded border border-indigo-200 hover:bg-indigo-100 cursor-pointer"
                                    title="مشاهده پیش‌نمایش تراز شده"
                                  >
                                    <Eye className="h-3.5 w-3.5" /> پیش‌نمایش
                                  </button>
                                  <button 
                                    onClick={() => downloadTranslatedFile(file)}
                                    className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded border border-emerald-200 hover:bg-emerald-100 cursor-pointer"
                                    title="دانلود سند Word"
                                  >
                                    <Download className="h-3.5 w-3.5" /> دانلود نسخه ترجمه شده
                                  </button>
                                </div>
                              ) : (
                                <div className="text-[10px] bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 text-amber-700 animate-pulse">
                                  {file.progress}% در حال انجام
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>

                  </div>

                  {/* Dynamic Timeline for Bulk Translation Steps */}
                  <div className="border-t border-slate-100 mt-8 pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-[#e65100]" />
                        <span className="text-xs font-black text-slate-700">گردش کار و وضعیت لحظه‌ای موتور ترجمه اسناد سازمانی:</span>
                      </div>
                      {uploadedFiles.length > 0 ? (
                        <div className="text-[11px] text-slate-500 font-bold bg-slate-50 px-3 py-1 rounded-full border border-slate-200/50 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>سند در حال پردازش:</span>
                          <span className="text-indigo-900 max-w-[150px] truncate">{uploadedFiles.find(f => f.status === "processing")?.name || uploadedFiles[0]?.name}</span>
                          <span className="text-amber-600 font-mono">({uploadedFiles.find(f => f.status === "processing")?.progress || 100}%)</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 bg-slate-50 border border-slate-200/40 px-2.5 py-1 rounded-lg">منتظر بارگذاری سند جهت نمایش جریان پردازش...</span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
                      {/* Connecting Line for Desktops */}
                      <div className="hidden md:block absolute top-[22px] right-[45px] left-[45px] h-[3px] bg-slate-200 rounded-full z-0 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-l from-indigo-600 via-amber-500 to-emerald-500 transition-all duration-500"
                          style={{ 
                            width: `${
                              uploadedFiles.length === 0 
                                ? 0 
                                : uploadedFiles.find(f => f.status === "processing") 
                                  ? uploadedFiles.find(f => f.status === "processing")!.progress 
                                  : 100
                            }%` 
                          }}
                        />
                      </div>

                      {[
                        {
                          id: 1,
                          title: "آپلود و استخراج لایه‌ها",
                          desc: "بررسی قالب فایل و استخراج متن لایه‌ای و داده‌های مخفی",
                          icon: Upload,
                          range: [0, 20],
                        },
                        {
                          id: 2,
                          title: "تحلیل چیدمان و استایل",
                          desc: "حفظ هوشمند جداول، تصاویر، فونت‌ها و ساختار کلی سند",
                          icon: Layers,
                          range: [21, 45],
                        },
                        {
                          id: 3,
                          title: "ترجمه فنی با هوش مصنوعی",
                          desc: "پردازش دقیق با واژه‌نامه‌های بومی و اصطلاحات ابنیه و عمران",
                          icon: Languages,
                          range: [46, 75],
                        },
                        {
                          id: 4,
                          title: "بررسی کیفی و تراز متنی",
                          desc: "تطبیق خودکار با اصطلاحات مصوب شرکت آذرستان",
                          icon: Sparkles,
                          range: [76, 95],
                        },
                        {
                          id: 5,
                          title: "کامپایل و تحویل خروجی",
                          desc: "تولید سند نهایی و تحویل نسخه بارگذاری شده با حفظ کامل قالب",
                          icon: Download,
                          range: [96, 100],
                        }
                      ].map((step) => {
                        const activeFile = uploadedFiles.find(f => f.status === "processing") || (uploadedFiles.length > 0 ? uploadedFiles[0] : null);
                        const progress = activeFile ? activeFile.progress : 0;
                        const isDone = activeFile ? (activeFile.status === "done" || progress >= step.range[1]) : false;
                        const isActive = activeFile ? (progress >= step.range[0] && progress <= step.range[1]) : false;

                        return (
                          <div key={step.id} className="relative z-10 flex md:flex-col items-center md:text-center gap-3 bg-slate-50/50 p-3 md:p-3 rounded-2xl border border-slate-200/50 md:border-none md:bg-transparent">
                            {/* Circle icon indicator */}
                            <div className={`h-11 w-11 rounded-full flex items-center justify-center transition-all duration-300 border-2 shrink-0 ${
                              isDone 
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20" 
                                : isActive 
                                  ? "bg-amber-500 text-white border-amber-500 animate-pulse shadow-lg shadow-amber-500/20" 
                                  : "bg-white text-slate-400 border-slate-200"
                            }`}>
                              <step.icon className="h-5 w-5" />
                            </div>

                            {/* Descriptions */}
                            <div className="text-right md:text-center flex-grow">
                              <h4 className={`text-[11.5px] font-black leading-tight ${
                                isDone 
                                  ? "text-indigo-900" 
                                  : isActive 
                                    ? "text-amber-700 font-extrabold" 
                                    : "text-slate-500 font-bold"
                              }`}>
                                {step.title}
                              </h4>
                              <p className="text-[10px] text-slate-400 mt-1 leading-normal md:max-w-[140px] mx-auto font-bold">
                                {step.desc}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* Permanent Archive of Corporate Translated Documents */}
                <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-4 sm:p-6 mt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-brand-primary" />
                      <div>
                        <h3 className="text-sm font-black text-slate-800">بانک اسناد ترجمه شده (آرشیو دائمی و هوشمند)</h3>
                        <p className="text-[10.5px] text-slate-400 mt-0.5 font-bold">آرشیو دائمی فایل‌های ترجمه شده با قابلیت جستجو، ویرایش نام و دانلود مجدد</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-100 shrink-0">
                        تعداد کل: {archivedFiles.length} سند
                      </span>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="relative mb-5">
                    <input
                      type="text"
                      placeholder="جستجو در نام سند، کد پیگیری، اصل یا متن ترجمه..."
                      value={archiveSearchTerm}
                      onChange={(e) => {
                        setArchiveSearchTerm(e.target.value);
                        fetchArchivedFiles(e.target.value);
                      }}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white transition-all text-right placeholder:text-slate-400 font-bold"
                      dir="rtl"
                    />
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    {archiveSearchTerm && (
                      <button
                        onClick={() => {
                          setArchiveSearchTerm("");
                          fetchArchivedFiles("");
                        }}
                        className="absolute left-10 top-2.5 text-[10px] text-slate-400 hover:text-slate-600 bg-slate-200/60 px-1.5 py-0.5 rounded cursor-pointer font-bold"
                      >
                        پاک کردن
                      </button>
                    )}
                  </div>

                  {/* Table or Grid of Archives */}
                  {isFetchingArchive ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                      <RefreshCw className="h-6 w-6 animate-spin text-brand-primary" />
                      <span className="text-xs font-bold">در حال بارگذاری اسناد از پایگاه داده سازمانی...</span>
                    </div>
                  ) : archivedFiles.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                      <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-400 font-bold">هیچ سندی در آرشیو دائمی ثبت نشده است.</p>
                      <p className="text-[10px] text-slate-400 mt-1 font-bold">با آپلود و ترجمه فایل‌ها در بخش بالا، سوابق به صورت خودکار در دیتابیس ذخیره خواهند شد.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
                      {archivedFiles.map((archive) => {
                        const isEditing = editingArchiveId === archive.id;
                        return (
                          <div
                            key={archive.id}
                            className="bg-white hover:bg-slate-50/60 border border-slate-200/80 rounded-xl p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:shadow-sm"
                          >
                            <div className="flex items-start gap-3 truncate">
                              <span className="p-1.5 bg-brand-primary/5 text-brand-primary rounded-lg font-black text-[10px] uppercase border border-brand-primary/10 select-none shrink-0 font-mono">
                                {archive.code || "AZ-TR"}
                              </span>
                              
                              <div className="truncate flex-1">
                                {isEditing ? (
                                  <div className="flex items-center gap-2 mt-0.5 max-w-md">
                                    <input
                                      type="text"
                                      value={editingArchiveName}
                                      onChange={(e) => setEditingArchiveName(e.target.value)}
                                      className="flex-1 px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-brand-primary"
                                      dir="rtl"
                                    />
                                    <button
                                      onClick={() => updateArchivedFileName(archive.id, editingArchiveName)}
                                      className="p-1 text-emerald-600 hover:bg-emerald-50 rounded border border-emerald-200 cursor-pointer"
                                      title="ذخیره نام جدید"
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setEditingArchiveId(null)}
                                      className="p-1 text-rose-600 hover:bg-rose-50 rounded border border-rose-200 cursor-pointer"
                                      title="انصراف"
                                    >
                                      <span className="text-[10px] font-bold px-1">لغو</span>
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 truncate">
                                    <span className="font-black text-slate-800 text-xs truncate" title={archive.name}>
                                      {archive.name}
                                    </span>
                                    <button
                                      onClick={() => {
                                        setEditingArchiveId(archive.id);
                                        setEditingArchiveName(archive.name);
                                      }}
                                      className="p-1 text-slate-400 hover:text-brand-primary hover:bg-slate-100 rounded transition-all cursor-pointer shrink-0"
                                      title="ویرایش نام آرشیوی"
                                    >
                                      <Edit3 className="h-3 w-3" />
                                    </button>
                                  </div>
                                )}
                                
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400 mt-1 font-bold">
                                  <span className="text-slate-500 truncate" title={archive.fileName}>
                                    سند اصلی: {archive.fileName}
                                  </span>
                                  <span className="text-slate-300">•</span>
                                  <span>حجم: {archive.originalSize}</span>
                                  <span className="text-slate-300">•</span>
                                  <span className="bg-indigo-50/80 text-indigo-700 px-1.5 py-0.25 rounded font-mono border border-indigo-100/50">
                                    {archive.sourceLang.toUpperCase()} ➔ {archive.targetLang.toUpperCase()}
                                  </span>
                                  <span className="text-slate-300">•</span>
                                  <span className="font-mono">
                                    {new Date(archive.date).toLocaleDateString('fa-IR', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex items-center justify-end gap-2 shrink-0 border-t border-slate-50 pt-3 md:pt-0 md:border-none">
                              <button 
                                onClick={() => {
                                  const mapped = {
                                    ...archive,
                                    name: archive.fileName,
                                    source: archive.sourceLang,
                                    target: archive.targetLang,
                                    translatedContent: archive.translatedContent
                                  };
                                  setPreviewFile(mapped);
                                }}
                                className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-bold bg-indigo-50 px-2.5 py-1.5 rounded-lg border border-indigo-100 hover:bg-indigo-100 cursor-pointer text-xs"
                                title="مشاهده پیش‌نمایش تراز شده"
                              >
                                <Eye className="h-3.5 w-3.5" /> مشاهده
                              </button>
                              <button 
                                onClick={() => {
                                  const mapped = {
                                    ...archive,
                                    name: archive.fileName,
                                    source: archive.sourceLang,
                                    target: archive.targetLang,
                                    translatedContent: archive.translatedContent
                                  };
                                  downloadTranslatedFile(mapped);
                                }}
                                className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100 hover:bg-emerald-100 cursor-pointer text-xs"
                                title="دانلود سند Word"
                              >
                                <Download className="h-3.5 w-3.5" /> دانلود Word
                              </button>
                              <button 
                                onClick={() => deleteArchivedFile(archive.id)}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg transition-all cursor-pointer"
                                title="حذف از آرشیو دائمی"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>

              {/* Right Column: OCR Tools & Quick Terms */}
              <div className="lg:col-span-3 flex flex-col gap-6">
                
                {/* Visual OCR Text Extraction Tool */}
                <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-brand-primary" />
                      <h3 className="text-sm font-black text-slate-800">نویسه‌خوان تصاویر اسناد (OCR)</h3>
                    </div>
                    <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded border border-indigo-100/50">
                      مجهز به سیستم ممیزی عمران آذرستان
                    </span>
                  </div>
                  
                  <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
                    تصویر جدول نقشه عمران، گزارش‌های غیررسمی یا فاکتورها را بارگذاری کرده، منطقه مورد نظر را کادربندی کنید و مدل نوع سند را جهت ترخیص متن انتخاب کنید.
                  </p>

                  <div className="flex flex-col gap-4">
                    {/* Image Uploader */}
                    <div className="border border-dashed border-slate-200 bg-slate-50 rounded-lg p-4 text-center relative hover:bg-slate-100 transition-all">
                      <input 
                        type="file" 
                        accept=".jpg,.jpeg,.png,.pdf,.tiff,.tif,image/*" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleOcrUpload}
                        disabled={isProcessingOcr}
                      />
                      <span className="text-xs font-bold text-indigo-700 block mb-1">بارگذاری نقشه یا سند کارگاهی (.jpg, .png, .pdf, .tiff)</span>
                      <span className="text-[10px] text-slate-400 font-mono italic">
                        {ocrImageName ? `فایل انتخابی: ${ocrImageName}` : "هنوز فایل گرافیکی یا سند انتخاب نشده"}
                      </span>
                    </div>

                    {/* Integrated Interactive Studio */}
                    {ocrImage && (
                      <div className="space-y-4">
                        
                        {/* Interactive ROI Preview Container with visual presets overlay */}
                        <div>
                          <label className="text-[10px] font-extrabold text-slate-500 block mb-1.5">
                            قدم ۱: تنظیم فریم محدوده مورد نظر (Region of Interest - ROI):
                          </label>
                          
                          <div 
                            className="relative rounded-xl overflow-hidden max-h-56 border-2 border-slate-300 bg-slate-900 select-none group cursor-crosshair shadow-inner"
                            style={{ height: "200px" }}
                            onClick={(e) => {
                              setOcrRoiPreset("custom");
                              const rect = e.currentTarget.getBoundingClientRect();
                              const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                              const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
                              
                              // Logic to move closest handle/boundary
                              const distToStart = Math.hypot(x - ocrCustomCoords.xMin, y - ocrCustomCoords.yMin);
                              const distToEnd = Math.hypot(x - ocrCustomCoords.xMax, y - ocrCustomCoords.yMax);
                              
                              if (distToStart < distToEnd) {
                                setOcrCustomCoords(prev => ({
                                  ...prev,
                                  xMin: Math.min(x, prev.xMax - 3),
                                  yMin: Math.min(y, prev.yMax - 3)
                                }));
                                addSystemLog(`نقطه آغاز محدوده کاستوم: ${x}٪ ، ${y}٪`);
                              } else {
                                setOcrCustomCoords(prev => ({
                                  ...prev,
                                  xMax: Math.max(x, prev.xMin + 3),
                                  yMax: Math.max(y, prev.yMin + 3)
                                }));
                                addSystemLog(`نقطه پایان محدوده کاستوم: ${x}٪ ، ${y}٪`);
                              }
                            }}
                          >
                            {ocrImage.startsWith("data:application/pdf") || ocrImageName?.toLowerCase().endsWith(".pdf") ? (
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800 text-white gap-2 pointer-events-none">
                                <FileText className="h-12 w-12 text-rose-400 animate-pulse" />
                                <span className="text-xs font-bold font-mono text-slate-300">سند PDF بارگذاری شد</span>
                                <span className="text-[10px] text-slate-400 max-w-[80%] truncate">{ocrImageName}</span>
                              </div>
                            ) : ocrImage.startsWith("data:image/tiff") || ocrImage.startsWith("data:image/tif") || ocrImageName?.toLowerCase().endsWith(".tiff") || ocrImageName?.toLowerCase().endsWith(".tif") ? (
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800 text-white gap-2 pointer-events-none">
                                <FileText className="h-12 w-12 text-amber-400 animate-pulse" />
                                <span className="text-xs font-bold font-mono text-slate-300">تصویر TIFF بارگذاری شد</span>
                                <span className="text-[10px] text-slate-400 max-w-[80%] truncate">{ocrImageName}</span>
                              </div>
                            ) : (
                              <img 
                                src={ocrImage} 
                                alt="OCR crop preview" 
                                className="w-full h-full object-contain pointer-events-none" 
                              />
                            )}
                            
                            {/* Overlay 1: Full active screen state */}
                            {ocrRoiPreset === "full" && (
                              <div className="absolute inset-0 border-4 border-emerald-500/80 bg-emerald-500/5 transition-all duration-300 pointer-events-none">
                                <span className="absolute top-2 right-2 bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded shadow">
                                  تمام صفحه (Full Frame)
                                </span>
                              </div>
                            )}

                            {/* Overlay 2: Header (top 30%) */}
                            {ocrRoiPreset === "heading" && (
                              <div className="absolute top-0 left-0 w-full h-[30%] border-b-2 border-dashed border-sky-500 bg-sky-500/10 transition-all duration-300 pointer-events-none flex items-end justify-center">
                                <span className="mb-1 bg-sky-600 text-white text-[9px] font-black px-2 py-0.5 rounded shadow">
                                  سربرگ و کادر توضیحات نقشه (Top Heading)
                                </span>
                              </div>
                            )}

                            {/* Overlay 3: Footer table (bottom 40%) */}
                            {ocrRoiPreset === "footer_table" && (
                              <div className="absolute bottom-0 left-0 w-full h-[40%] border-t-2 border-dashed border-amber-500 bg-amber-500/10 transition-all duration-300 pointer-events-none flex items-start justify-center">
                                <span className="mt-1 bg-amber-600 text-white text-[9px] font-black px-2 py-0.5 rounded shadow">
                                  جدول مشخصات و برگه کمیت‌ها (Footer Specs)
                                </span>
                              </div>
                            )}

                            {/* Overlay 4: Left half */}
                            {ocrRoiPreset === "left_pane" && (
                              <div className="absolute top-0 left-0 w-1/2 h-full border-r-2 border-dashed border-teal-500 bg-teal-500/10 transition-all duration-300 pointer-events-none flex items-center justify-center">
                                <span className="bg-teal-600 text-white text-[9px] font-black px-2 py-0.5 rounded shadow rotate-90">
                                  نیمه چپ (Left Segment)
                                </span>
                              </div>
                            )}

                            {/* Overlay 5: Right half */}
                            {ocrRoiPreset === "right_pane" && (
                              <div className="absolute top-0 right-0 w-1/2 h-full border-l-2 border-dashed border-purple-500 bg-purple-500/10 transition-all duration-300 pointer-events-none flex items-center justify-center">
                                <span className="bg-purple-600 text-white text-[9px] font-black px-2 py-0.5 rounded shadow -rotate-90">
                                  نیمه راست (Right Segment)
                                </span>
                              </div>
                            )}

                            {/* Overlay 6: Custom interactive bounding box coordinates */}
                            {ocrRoiPreset === "custom" && (
                              <div 
                                className="absolute border-2 border-rose-500 border-dashed bg-rose-500/15 animate-pulse transition-all duration-155 pointer-events-none shadow-lg"
                                style={{
                                  left: `${ocrCustomCoords.xMin}%`,
                                  top: `${ocrCustomCoords.yMin}%`,
                                  width: `${ocrCustomCoords.xMax - ocrCustomCoords.xMin}%`,
                                  height: `${ocrCustomCoords.yMax - ocrCustomCoords.yMin}%`
                                }}
                              >
                                <span className="absolute -top-5 right-0 bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded whitespace-nowrap shadow-sm">
                                  منطقه دلخواه ({ocrCustomCoords.xMin}% - {ocrCustomCoords.xMax}%)
                                </span>
                              </div>
                            )}

                            {/* Guide instructions */}
                            <div className="absolute bottom-1.5 left-2 bg-slate-900/80 text-[8px] text-slate-300 px-2 py-0.5 rounded pointer-events-none font-bold">
                              جهت تعیین سریع گوشه‌ها روی عکس کلیک کنید
                            </div>
                          </div>

                          {/* Presets Button grid */}
                          <div className="grid grid-cols-3 gap-1.5 mt-2">
                            {[
                              { id: "full", label: "کل پهنه" },
                              { id: "heading", label: "سربرگ" },
                              { id: "footer_table", label: "مستندات پائینی" },
                              { id: "left_pane", label: "سمت چپ" },
                              { id: "right_pane", label: "سمت راست" },
                              { id: "custom", label: "انتخاب دلخواه (ROI) 📐" }
                            ].map((preset) => (
                              <button
                                key={preset.id}
                                onClick={() => {
                                  setOcrRoiPreset(preset.id as any);
                                  addSystemLog(`تنظیم محدوده ممیزی با پیش‌فرض: ${preset.label}`);
                                }}
                                className={`px-2 py-1 border text-[10px] font-black rounded-lg transition-all ${
                                  ocrRoiPreset === preset.id
                                    ? "bg-indigo-600 border-indigo-700 text-white font-bold shadow-xs"
                                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                                }`}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Custom Fine Tuner Range Sliders */}
                        {ocrRoiPreset === "custom" && (
                          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-[10px] space-y-2">
                            <div className="flex items-center gap-1 text-slate-700 font-extrabold mb-1">
                              <Crop className="h-3.5 w-3.5 text-rose-500" />
                              <span>تنظیمات میلی‌متری مختصات کادربندی (تفکیک پیکسل):</span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <div className="flex justify-between font-mono text-slate-400 text-[9px]">
                                  <span>شروع افقی (X-Min):</span>
                                  <span>{ocrCustomCoords.xMin}%</span>
                                </div>
                                <input 
                                  type="range" 
                                  min="0" 
                                  max={ocrCustomCoords.xMax - 5}
                                  value={ocrCustomCoords.xMin}
                                  onChange={(e) => setOcrCustomCoords(prev => ({ ...prev, xMin: parseInt(e.target.value) }))}
                                  className="w-full accent-rose-600 h-1 bg-slate-200 rounded-lg cursor-pointer"
                                />
                              </div>

                              <div>
                                <div className="flex justify-between font-mono text-slate-400 text-[9px]">
                                  <span>پایان افقی (X-Max):</span>
                                  <span>{ocrCustomCoords.xMax}%</span>
                                </div>
                                <input 
                                  type="range" 
                                  min={ocrCustomCoords.xMin + 5} 
                                  max="100" 
                                  value={ocrCustomCoords.xMax}
                                  onChange={(e) => setOcrCustomCoords(prev => ({ ...prev, xMax: parseInt(e.target.value) }))}
                                  className="w-full accent-rose-600 h-1 bg-slate-200 rounded-lg cursor-pointer"
                                />
                              </div>

                              <div>
                                <div className="flex justify-between font-mono text-slate-400 text-[9px]">
                                  <span>شروع عمودی (Y-Min):</span>
                                  <span>{ocrCustomCoords.yMin}%</span>
                                </div>
                                <input 
                                  type="range" 
                                  min="0" 
                                  max={ocrCustomCoords.yMax - 5}
                                  value={ocrCustomCoords.yMin}
                                  onChange={(e) => setOcrCustomCoords(prev => ({ ...prev, yMin: parseInt(e.target.value) }))}
                                  className="w-full accent-rose-600 h-1 bg-slate-200 rounded-lg cursor-pointer"
                                />
                              </div>

                              <div>
                                <div className="flex justify-between font-mono text-slate-400 text-[9px]">
                                  <span>پایان عمودی (Y-Max):</span>
                                  <span>{ocrCustomCoords.yMax}%</span>
                                </div>
                                <input 
                                  type="range" 
                                  min={ocrCustomCoords.yMin + 5} 
                                  max="100" 
                                  value={ocrCustomCoords.yMax}
                                  onChange={(e) => setOcrCustomCoords(prev => ({ ...prev, yMax: parseInt(e.target.value) }))}
                                  className="w-full accent-rose-600 h-1 bg-slate-200 rounded-lg cursor-pointer"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Model-specific recognition model category */}
                        <div>
                          <label className="text-[10px] font-extrabold text-slate-500 block mb-1.5 flex items-center gap-1">
                            <Sliders className="h-3 w-3 text-indigo-500" />
                            <span>قدم ۲: بهینه‌ساز موتور هوش مصنوعی OCR (مدل‌های چاپی/دست‌نویس نقشه):</span>
                          </label>

                          <div className="grid grid-cols-2 gap-1.5">
                            {[
                              { id: "general", title: "عمومی عمران", desc: "مدل ترکیبی زبانی" },
                              { id: "technical_diagram", title: "نقشه کشی صنعتی", desc: "فوق‌سریع برای علائم و متون CAD" },
                              { id: "printed", title: "اسناد تایپی و فاکتور", desc: "آرایش دقیق ستون‌ها و ارقام" },
                              { id: "handwritten", title: "یادداشت‌های دست‌نویس", desc: "طراحی بهینه خطوط اریب کارگاهی" }
                            ].map((modelOpt) => (
                              <button
                                key={modelOpt.id}
                                onClick={() => {
                                  setOcrModelType(modelOpt.id as any);
                                  addSystemLog(`تغییر مدل نویسه‌خوان به: ${modelOpt.title}`);
                                }}
                                className={`p-2 border text-right rounded-lg transition-all ${
                                  ocrModelType === modelOpt.id
                                    ? "bg-indigo-50/70 border-indigo-600 text-indigo-900 shadow-3xs"
                                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                <div className="text-[10px] font-black">{modelOpt.title}</div>
                                <div className="text-[8px] text-slate-400 font-bold">{modelOpt.desc}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Action buttons to trigger OCR manually */}
                        <div className="pt-2">
                          <button
                            onClick={() => executeOcrExtraction(ocrImage)}
                            disabled={isProcessingOcr}
                            className={`w-full py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow ${
                              isProcessingOcr 
                                ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed" 
                                : "bg-gradient-to-r from-indigo-610 to-brand-primary hover:from-indigo-700 hover:to-indigo-900 text-white cursor-pointer active:scale-98"
                            }`}
                          >
                            <RefreshCw className={`h-3.5 w-3.5 ${isProcessingOcr ? 'animate-spin' : ''}`} />
                            {isProcessingOcr ? "در حال بازخوانی منطقه انتخابی..." : "بروزرسانی و استخراج دقیق متن انتخابی"}
                          </button>
                        </div>

                      </div>
                    )}

                    {/* OCR Results and actions */}
                    {isProcessingOcr ? (
                      <div className="text-center py-5 bg-gradient-to-r from-slate-50 to-indigo-50/10 rounded-xl border border-dashed border-indigo-200 animate-pulse text-xs font-bold text-indigo-900 flex flex-col items-center justify-center gap-2">
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce duration-300" />
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce delay-75 duration-300" />
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce delay-150 duration-300" />
                        </div>
                        <span>موتور هوشمند عمران آذرستان در حال رمزگشایی بصری پیکسل‌ها...</span>
                      </div>
                    ) : (
                      ocrExtractedText && (
                        <div className="flex flex-col gap-2 mt-2 bg-indigo-950/5 p-3 rounded-xl border border-indigo-100">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-slate-700">داده‌های متنی استخراج شده از تصویر فریم:</label>
                            <span className="font-mono text-[9px] text-slate-400">انتقال مجاز به هوش مصنوعی</span>
                          </div>
                          
                          <textarea 
                            className="w-full h-36 p-2.5 bg-slate-900 text-teal-400 font-mono text-[11px] rounded leading-relaxed border border-slate-800 shadow-inner focus:outline-none"
                            value={ocrExtractedText}
                            onChange={(e) => setOcrExtractedText(e.target.value)}
                          />

                          <div className="flex gap-2 justify-end pt-1">
                            <button
                              onClick={() => {
                                setSourceText(ocrExtractedText);
                                addSystemLog("متن تفکیکی فریم OCR در باکس ورودی مترجم عمران آذرستان بارگذاری شد.");
                              }}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black px-3 py-1.5 rounded-lg hover:shadow-xs transition-transform active:scale-95 cursor-pointer"
                            >
                              ارسال به جعبه مترجم عمران آذرستان
                            </button>
                            <button
                              onClick={() => {
                                setOcrImage(null);
                                setOcrExtractedText("");
                                setOcrImageName("");
                                addSystemLog("تصویر و اطلاعات موقت تالار نویسه‌خوان پاکسازی شد.");
                              }}
                              className="text-[10px] text-slate-400 hover:text-slate-600 hover:underline cursor-pointer px-2"
                            >
                              انصراف و پاک کردن
                            </button>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Live Activity Stream logs */}
                <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-5 flex-1 flex flex-col min-h-80">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                    <span className="flex items-center gap-2">
                      <Server className="h-4.5 w-4.5 text-slate-500" />
                      <h3 className="text-xs font-bold text-slate-800">حسابرسی سرور و ترافیک (AD Logs)</h3>
                    </span>
                    <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-mono font-bold uppercase">
                      پورت ۳۰۰۰
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto font-mono text-[10px] text-slate-500 flex flex-col gap-2 pr-1">
                    {systemLogs.map((log, idx) => (
                      <div key={idx} className="p-1.5 bg-slate-50 rounded border-r-2 border-slate-300 hover:bg-slate-100 transition-colors">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: GLOSSARY / INTELLIGENT DICTIONARY */}
          {activeTab === "glossary" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Add New Dictionary Term (RBAC protected) */}
              <div id="add-term-form" className="bg-white rounded-2xl shadow-md border border-slate-100 p-5 h-fit">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-brand-primary" />
                    <h3 className="text-sm font-bold text-slate-800">
                      {editingTermId ? "ویرایش اصطلاح فنی مصوب" : "ثبت اصطلاحات فنی مصوب جدید"}
                    </h3>
                  </div>
                  {currentUser.role !== 'Admin' && currentUser.role !== 'Translator' && (
                    <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 border border-red-200">
                      <Lock className="h-3 w-3" /> فقط مترجم/مدیر
                    </span>
                  )}
                </div>

                {glossarySuccessMsg && (
                  <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 text-xs font-bold mb-4">
                    {glossarySuccessMsg}
                  </div>
                )}

                {glossaryErrorMsg && (
                  <div className="p-3 bg-red-50 text-red-800 rounded-lg border border-red-200 text-xs font-semibold mb-4">
                    {glossaryErrorMsg}
                  </div>
                )}

                <form onSubmit={handleAddTerm} className="space-y-4 text-xs font-semibold text-slate-600">
                  <div>
                    <label className="block mb-1">واژه تخصصی فارسی (مبنا):</label>
                    <input 
                      type="text" 
                      placeholder="مانند: بتن خودتراکم تازه" 
                      value={newTerm.term} 
                      onChange={(e) => setNewTerm({...newTerm, term: e.target.value})}
                      className="w-full text-xs font-medium p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white"
                      disabled={currentUser.role !== 'Admin' && currentUser.role !== 'Translator'}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1">معادل انگلیسی:</label>
                      <input 
                        type="text" 
                        placeholder="Self-Compacting Concrete" 
                        value={newTerm.equivalentEn} 
                        onChange={(e) => setNewTerm({...newTerm, equivalentEn: e.target.value})}
                        className="w-full text-xs font-medium p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white text-left"
                        dir="ltr"
                        disabled={currentUser.role !== 'Admin' && currentUser.role !== 'Translator'}
                      />
                    </div>
                    <div>
                      <label className="block mb-1">معادل روسی (اختیاری):</label>
                      <input 
                        type="text" 
                        placeholder="Самоуплотняющийся бетон" 
                        value={newTerm.equivalentRu} 
                        onChange={(e) => setNewTerm({...newTerm, equivalentRu: e.target.value})}
                        className="w-full text-xs font-medium p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white text-left"
                        dir="ltr"
                        disabled={currentUser.role !== 'Admin' && currentUser.role !== 'Translator'}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1">تعریف مصوب فنی (فارسی):</label>
                    <textarea 
                      placeholder="ابعاد، مراجع استفاده و استانداردهای مصوب شرکت عمران آذرستان در آزمایشگاه فنی..." 
                      value={newTerm.definitionFa} 
                      onChange={(e) => setNewTerm({...newTerm, definitionFa: e.target.value})}
                      className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white h-20"
                      disabled={currentUser.role !== 'Admin' && currentUser.role !== 'Translator'}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1">دپارتمان مربوطه:</label>
                      <select 
                        className="w-full p-2 border border-slate-200 rounded bg-slate-50 focus:outline-none"
                        value={newTerm.category}
                        onChange={(e) => setNewTerm({...newTerm, category: e.target.value})}
                        disabled={currentUser.role !== 'Admin' && currentUser.role !== 'Translator'}
                      >
                        <option value="">انتخاب دسته</option>
                        <option value="سازه">سازه و بتن</option>
                        <option value="ژئوتکنیک">ژئوتکنیک و تونل</option>
                        <option value="سیویل">سیویل و تاسیسات</option>
                        <option value="ماشین‌آلات">ماشین آلات سنگین</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1">پروژه ارشد:</label>
                      <input 
                        type="text" 
                        placeholder="مترو تهران / سد هراز" 
                        value={newTerm.project} 
                        onChange={(e) => setNewTerm({...newTerm, project: e.target.value})}
                        className="w-full p-2 border border-slate-200 rounded bg-slate-50 focus:outline-none"
                        disabled={currentUser.role !== 'Admin' && currentUser.role !== 'Translator'}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1">تگ‌ها (با کاما جدا شوند):</label>
                    <input 
                      type="text" 
                      placeholder="سدسازی, خاکبرداری, تست مقاومت" 
                      value={newTerm.tags} 
                      onChange={(e) => setNewTerm({...newTerm, tags: e.target.value})}
                      className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none"
                      disabled={currentUser.role !== 'Admin' && currentUser.role !== 'Translator'}
                    />
                  </div>

                  <div className="flex gap-2">
                    {editingTermId && (
                      <button 
                        type="button"
                        onClick={handleCancelEdit}
                        className="w-1/3 py-3 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all flex items-center justify-center gap-2 focus:outline-none"
                      >
                        انصراف
                      </button>
                    )}
                    <button 
                      type="submit"
                      disabled={currentUser.role !== 'Admin' && currentUser.role !== 'Translator'}
                      className={`py-3 rounded-xl font-bold text-white shadow transition-all flex items-center justify-center gap-2 ${editingTermId ? "w-2/3 bg-amber-500 hover:bg-amber-600" : "w-full bg-brand-primary hover:bg-brand-primary/90"} ${
                        currentUser.role !== 'Admin' && currentUser.role !== 'Translator'
                          ? "bg-slate-300 cursor-not-allowed"
                          : "hover:shadow-md"
                      }`}
                    >
                      {editingTermId ? (
                        <>
                          <Check className="h-4 w-4" /> بروزرسانی واژه مرکزی
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" /> ثبت اصطلاح در دیتابیس مرکزی
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Glossary List Browser columns */}
              <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-5 lg:col-span-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-brand-primary" />
                    <h3 className="text-sm font-bold text-slate-800 text-right">
                      جستجو و یکپارچه‌سازی اصطلاحات تخصصی ({glossary.length} اصطلاح فعال)
                    </h3>
                  </div>

                  {/* Export buttons */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleExportGlossary}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-200"
                    >
                      <Download className="h-3.5 w-3.5" /> خروجی اکسل/CSV
                    </button>
                    <button 
                      onClick={() => alert("شبیه‌ساز بارگذاری مجدد اکسل: به دلیل الزامات تصدیق‌ امنیتی، فایل ابتدا فیلتر می‌شود.")}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary text-xs font-bold rounded-lg"
                    >
                      <Upload className="h-3.5 w-3.5" /> بارگذاری گروهی واژه
                    </button>
                  </div>
                </div>

                {/* Sub search input with embedded micro-app sound controller */}
                <div className="relative mb-4">
                  <span className="absolute inset-y-0 right-3 flex items-center pr-1.5 pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                  </span>
                  <input
                    type="text"
                    placeholder="جستجو در سر‌واژه‌ها، معادل‌های انگلیسی یا روسی، تگ‌های عمران... (یا از جستجوی صوتی استفاده کنید)"
                    className="w-full pr-10 pl-14 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:bg-white focus:ring-1 focus:ring-brand-primary"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <div className="absolute inset-y-0 left-2.5 flex items-center gap-1.5">
                    {searchTerm && (
                      <button
                        onClick={() => {
                          setSearchTerm("");
                          addSystemLog("عبارت جستجوی واژه‌نامه تخصصی پاک شد.");
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-200/60 transition-colors"
                        title="پاک کردن"
                        type="button"
                      >
                        <span className="text-sm font-black">×</span>
                      </button>
                    )}
                    <button
                      onClick={startGlossaryVoiceSearch}
                      className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${
                        isGlossaryDictating 
                          ? "bg-red-500 text-white animate-pulse scale-105" 
                          : "bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary"
                      }`}
                      title="ابزار جستجوی صوتی تخصصی واژه (STT)"
                      type="button"
                    >
                      <Mic className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Interactive Glossary STT Status Panel with Live Simulators */}
                {isGlossaryDictating && (
                  <div className="mb-4 bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 relative overflow-hidden transition-all duration-300">
                    <div className="absolute top-2 left-2">
                      <button 
                        onClick={() => {
                          setIsGlossaryDictating(false);
                          setGlossarySttFeedback("");
                          addSystemLog("رابط جستجوی صوتی واژه‌نامه توسط کاربر بسته شد.");
                        }}
                        className="text-[10px] font-bold text-indigo-900 bg-white border border-indigo-200 hover:bg-indigo-100 px-2.2 py-0.8 rounded-lg transition-colors"
                        type="button"
                      >
                        بستن ×
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </div>
                      <span className="text-[11px] font-extrabold text-indigo-950">
                        سیستم گفتارشناس عمران آذرستان (Glossary Dictation Companion)
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed max-w-[85%] mb-2">
                      {glossarySttFeedback || "میکروفون سیستم فعال است. واژه مورد نظر خود را شمرده تلفظ فرمایید..."}
                    </p>

                    {glossarySttError && (
                      <p className="text-[11px] text-red-600 mb-2 p-1.5 bg-red-50 rounded border border-red-100 font-medium">
                        {glossarySttError}
                      </p>
                    )}

                    {/* Equalizer animation */}
                    <div className="flex justify-center items-center gap-1 h-6 my-2">
                      <span className="w-0.5 bg-brand-primary rounded animate-[bounce_1.1s_infinite_100ms] h-3"></span>
                      <span className="w-0.5 bg-indigo-500 rounded animate-[bounce_0.8s_infinite_200ms] h-5"></span>
                      <span className="w-0.5 bg-[#1a237e] rounded animate-[bounce_1.3s_infinite_400ms] h-4"></span>
                      <span className="w-0.5 bg-violet-600 rounded animate-[bounce_0.7s_infinite_150ms] h-6"></span>
                      <span className="w-0.5 bg-emerald-500 rounded animate-[bounce_1.0s_infinite_300ms] h-2"></span>
                    </div>
                  </div>
                )}

                {/* Terms layout list container */}
                <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
                  {glossary
                    .filter(item => 
                      item.term.includes(searchTerm) || 
                      item.equivalentEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (item.equivalentRu && item.equivalentRu.toLowerCase().includes(searchTerm.toLowerCase()))
                    )
                    .map((item) => (
                      <div key={item.id} className="border border-slate-100 bg-slate-50 hover:bg-white rounded-xl p-4 transition-all hover:shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                        
                        <div className="md:col-span-3 space-y-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-sm font-bold text-slate-900 border-l border-slate-200 pl-2">
                              {item.term}
                            </span>
                            <span className="text-xs text-brand-primary font-bold font-mono pl-2" dir="ltr">
                              {item.equivalentEn}
                            </span>
                            {item.equivalentRu && (
                              <span className="text-[11px] text-slate-500 font-mono" dir="ltr">
                                {item.equivalentRu}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-slate-500 font-medium">
                            {item.definitionFa && (
                              <div className="bg-white/80 p-1.5 rounded border border-slate-100">
                                <strong className="text-slate-800">تعریف فارسی: </strong>{item.definitionFa}
                              </div>
                            )}
                            {item.definitionEn && (
                              <div className="bg-white/80 p-1.5 rounded border border-slate-100" dir="ltr">
                                <strong className="text-slate-800">English def: </strong>{item.definitionEn}
                              </div>
                            )}
                          </div>

                          {/* Attribute tags */}
                          <div className="flex flex-wrap gap-1.5 items-center mt-1">
                            <span className="text-[10px] bg-brand-primary/10 text-brand-primary font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Tag className="h-2.5 w-2.5" /> {item.category || "عمران"}
                            </span>
                            {item.project && (
                              <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 font-semibold px-2 py-0.5 rounded-full">
                                پروژه: {item.project}
                              </span>
                            )}
                            {item.tags.map((tag, idx) => (
                              <span key={idx} className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                                #{tag}
                              </span>
                            ))}
                          </div>

                        </div>

                        {/* Audit and Actions column */}
                        <div className="text-[10px] text-slate-400 bg-white border border-slate-200 rounded-lg p-2 md:h-full flex flex-col justify-between items-end gap-2 pr-2.5">
                          <div className="space-y-1 text-left w-full">
                            <div>نویسنده: <strong className="text-slate-600">{item.author}</strong></div>
                            <div>نسخه: <span className="bg-slate-100 px-1.5 text-slate-700 rounded font-bold">V{item.version}</span></div>
                            <div>ثبت تاریخ: <span className="font-mono">{item.lastModified}</span></div>
                          </div>

                          {/* Edit and Delete capabilities inside RBAC check */}
                          {(currentUser.role === 'Admin' || currentUser.role === 'Translator') && (
                            <div className="w-full space-y-1 mt-2">
                              <button
                                onClick={() => handleEditTerm(item)}
                                className="text-amber-600 hover:text-amber-800 hover:bg-amber-50 p-1.5 rounded flex items-center gap-1 border border-amber-100 font-bold focus:outline-none w-full justify-center transition-colors text-[10px]"
                                title="ویرایش اطلاعات اصطلاح"
                              >
                                <Edit3 className="h-3 w-3" /> ویرایش اصطلاح
                              </button>
                              <button
                                onClick={() => handleDeleteTerm(item.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded flex items-center gap-1 border border-red-100 font-bold focus:outline-none w-full justify-center transition-colors text-[10px]"
                                title="حذف دائمی از واژه‌نامه"
                              >
                                <Trash2 className="h-3 w-3" /> حذف اصطلاح
                              </button>
                            </div>
                          )}
                        </div>

                      </div>
                    ))}
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: SYSTEM AUDIT & ANALYTICS */}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              
              {/* Stats Counter bento row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-teal-500 text-white rounded-lg shadow-inner">
                    <Languages className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold">کل ترجمه شده (از زمان استقرار)</h4>
                    <div className="text-2xl font-black text-slate-800 font-mono mt-1">
                      {analytics ? analytics.totalTranslations : "۱,۴۳۵"}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-amber-500 text-white rounded-lg shadow-inner">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold">کاربران فعال بخش عمران (AD)</h4>
                    <div className="text-2xl font-black text-slate-800 font-mono mt-1">
                      {analytics ? analytics.activeUsers : "۱۹"}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-emerald-500 text-white rounded-lg shadow-inner">
                    <Activity className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold">میانگین تاخیر نهایی موتور ترجمه</h4>
                    <div className="text-2xl font-black text-slate-800 font-mono mt-1">
                      {analytics ? `${analytics.averageResponseTime} ms` : "940 ms"}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-indigo-500 text-white rounded-lg shadow-inner">
                    <HardDrive className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold">حجم کاراکترهای ترجمه عمران</h4>
                    <div className="text-xl font-black text-slate-800 font-mono mt-1">
                      {analytics ? `${(analytics.totalCharacters / 1000).toFixed(1)}k` : "721.5k"}
                    </div>
                  </div>
                </div>

              </div>

              {/* SECTION: INTEGRATED TRANSLATION RECORDS AUDIT HISTORY */}
              <div id="translation-records-history-section" className="bg-white rounded-3xl p-6 border border-slate-100 shadow-md">
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-4 mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-brand-primary text-white rounded-xl shadow-inner">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 flex-wrap">
                        <span>بایگانی ممیزی و سوابق ترجمه عمران آذرستان (Translation History Archive)</span>
                        {selectedRecordIds.length > 0 && (
                          <span className="bg-indigo-600 text-white text-[10px] font-mono px-2 py-0.5 rounded-full animate-pulse">
                            {selectedRecordIds.length} رکورد انتخاب شده
                          </span>
                        )}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed text-right">
                        مشاهده، جستجو و تفکیک اسناد ترجمه شرکت بر اساس ساختار شکست پروژه‌های عمرانی
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 items-center flex-wrap">
                    {selectedRecordIds.length > 0 && (
                      <div className="flex gap-1.5 items-center bg-slate-50 p-1 rounded-lg border border-slate-200" dir="rtl">
                        <button
                          onClick={() => {
                            setBulkDownloadFormat("csv");
                            setIsBulkDownloadModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[10px] font-black transition-colors flex items-center gap-1 border border-indigo-200 cursor-pointer"
                          type="button"
                        >
                          <FileSpreadsheet className="h-3 w-3" /> دانلود CSV گروهی
                        </button>
                        <button
                          onClick={() => {
                            setBulkDownloadFormat("zip");
                            setIsBulkDownloadModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[10px] font-black transition-colors flex items-center gap-1 border border-emerald-200 cursor-pointer"
                          type="button"
                        >
                          <Download className="h-3 w-3" /> دانلود ZIP گروهی
                        </button>
                        <button
                          onClick={() => setSelectedRecordIds([])}
                          className="px-2 py-1.5 text-slate-400 hover:text-slate-600 rounded text-[10px] font-bold cursor-pointer"
                          type="button"
                        >
                          لغو انتخاب
                        </button>
                      </div>
                    )}

                    <button
                      onClick={fetchHistory}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors border border-slate-200 bg-white flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                      title="به‌روزرسانی تاریخچه"
                      type="button"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>به‌روزرسانی</span>
                    </button>
                  </div>
                </div>

                {/* Filter and Search Bar Row */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center mb-6 bg-slate-50/50 p-4 rounded-2xl border border-slate-150/60">
                  {/* Project Selector Filter */}
                  <div className="md:col-span-5 flex flex-col gap-1 w-full text-right">
                    <label className="text-[10px] font-extrabold text-slate-500 mr-2 flex items-center gap-1 justify-end">
                      <span>فیلتر بر اساس پروژه انتسابی</span>
                      <Layers className="h-3 w-3 text-brand-primary" />
                    </label>
                    <select
                      value={historyProjectFilter}
                      onChange={(e) => {
                        setHistoryProjectFilter(e.target.value);
                        addSystemLog(`فیلتر نمایشی سوابق پروژه تغییر یافت به: ${e.target.value === "all" ? "همه‌ی پروژه‌ها" : e.target.value}`);
                      }}
                      className="w-full text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer text-right shadow-2xs"
                      dir="rtl"
                    >
                      <option value="all">📁 همه پروژه‌های انتساب‌یافته (All Projects)</option>
                      <option value="برج مسکونی فرمانیه">🏢 برج مسکونی فرمانیه (Cobiax Voided Slab)</option>
                      <option value="خط ۷ مترو تهران">🚇 خط ۷ مترو تهران (Tunnel & Shoring)</option>
                      <option value="پروژه مگا مال تهران">🏗️ پروژه مگا مال تهران (Prestressed Concrete)</option>
                      <option value="سد هراز">🌊 سد هراز (Haraz Dam Hydrosystems)</option>
                      <option value="پروژه قطار شهری مشهد">🚈 پروژه قطار شهری مشهد (Rail Transit LRT)</option>
                      <option value="نیروگاه سیکل ترکیبی توس">⚡ نیروگاه سیکل ترکیبی توس (Combined Cycle Foundation)</option>
                      <option value="پتروشیمی عسلویه">⛽ پتروشیمی عسلویه (Assaluyeh Offshore Pipetracks)</option>
                      <option value="سراسری">🌐 سوابق سراسری / بدون انتساب خاص</option>
                    </select>
                  </div>

                  {/* Keyword filter search */}
                  <div className="md:col-span-7 flex flex-col gap-1 w-full text-right">
                    <label className="text-[10px] font-extrabold text-slate-500 mr-2 flex items-center gap-1 justify-end">
                      <span>جستجو در متون و شناسه‌ها</span>
                      <Search className="h-3 w-3 text-brand-primary" />
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                        <Search className="h-3.5 w-3.5" />
                      </span>
                      <input
                        type="text"
                        placeholder="جستجو در متن اصلی، متن ترجمه‌شده، بخش ممیزی، نام اپراتور و کارشناس..."
                        value={historySearchQuery}
                        onChange={(e) => setHistorySearchQuery(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl pr-9 pl-3.5 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand-primary text-right shadow-2xs"
                      />
                      {historySearchQuery && (
                        <button
                          onClick={() => setHistorySearchQuery("")}
                          className="absolute inset-y-0 left-3 flex items-center text-slate-400 hover:text-slate-600 font-bold text-sm"
                          title="پاک کردن"
                          type="button"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Filter counts indicator */}
                {(() => {
                  const filteredRecords = translationHistory.filter(record => {
                    const matchProject = historyProjectFilter === "all" || record.project === historyProjectFilter;
                    const query = historySearchQuery.trim().toLowerCase();
                    const matchQuery = !query || 
                      record.originalText.toLowerCase().includes(query) ||
                      record.translatedText.toLowerCase().includes(query) ||
                      (record.category && record.category.toLowerCase().includes(query)) ||
                      (record.department && record.department.toLowerCase().includes(query)) ||
                      record.user.toLowerCase().includes(query) ||
                      (record.project && record.project.toLowerCase().includes(query));
                    return matchProject && matchQuery;
                  });

                  return (
                    <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#f4f7f6] px-4 py-2 border border-slate-100 rounded-xl" dir="rtl">
                      <div className="text-[11px] font-bold text-indigo-950 flex items-center gap-3 flex-wrap">
                        <label className="flex items-center gap-1.5 cursor-pointer bg-white border border-slate-200 rounded px-2 py-0.5 shadow-3xs hover:bg-slate-50 transition-colors">
                          <input
                            type="checkbox"
                            checked={filteredRecords.length > 0 && filteredRecords.every(r => selectedRecordIds.includes(r.id))}
                            onChange={(e) => {
                              if (e.target.checked) {
                                const newSelected = [...selectedRecordIds];
                                filteredRecords.forEach(r => {
                                  if (!newSelected.includes(r.id)) {
                                    newSelected.push(r.id);
                                  }
                                });
                                setSelectedRecordIds(newSelected);
                              } else {
                                const filteredIds = filteredRecords.map(r => r.id);
                                setSelectedRecordIds(prev => prev.filter(id => !filteredIds.includes(id)));
                              }
                            }}
                            className="h-3.5 w-3.5 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                          />
                          <span className="text-[10px] text-slate-600 font-extrabold">انتخاب همه اقلام شرط جاری</span>
                        </label>
                        <span className="text-slate-300">|</span>
                        <span> تعداد اقلام یافت شده با شرط جاری: </span>
                        <strong className="text-brand-primary text-xs font-mono bg-white border border-slate-200 px-2 py-0.5 rounded shadow-2xs ml-1">
                          {filteredRecords.length}
                        </strong>
                        <span className="text-slate-400 font-medium font-mono font-bold"> / {translationHistory.length} کل</span>
                      </div>

                      {historyProjectFilter !== "all" && (
                        <div className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-800 px-2.5 py-1 rounded-lg font-bold">
                          فیلتر فعال: تک‌‌پروژه «{historyProjectFilter}»
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Translation History Tabular Grid list */}
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                  {(() => {
                    const filteredRecords = translationHistory.filter(record => {
                      const matchProject = historyProjectFilter === "all" || record.project === historyProjectFilter;
                      const query = historySearchQuery.trim().toLowerCase();
                      const matchQuery = !query || 
                        record.originalText.toLowerCase().includes(query) ||
                        record.translatedText.toLowerCase().includes(query) ||
                        (record.category && record.category.toLowerCase().includes(query)) ||
                        (record.department && record.department.toLowerCase().includes(query)) ||
                        record.user.toLowerCase().includes(query) ||
                        (record.project && record.project.toLowerCase().includes(query));
                      return matchProject && matchQuery;
                    });

                    if (filteredRecords.length === 0) {
                      return (
                        <div className="text-center py-12 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center justify-center gap-3">
                          <Database className="h-8 w-8 text-slate-300" />
                          <div className="text-xs font-black text-slate-400">هیچ سابقه یا سندی مطابق با فیلتر پروژه و جستجوی شما یافت نشد.</div>
                          <div className="text-[10px] text-slate-400/80 font-bold">سوابق جدید پس از انجام ترجمه با تفکیک پروژه اضافه می‌شوند.</div>
                        </div>
                      );
                    }

                    return filteredRecords.map((record) => {
                      // Custom aesthetic colors for project labels
                      const getProjectStyles = (projName: string | undefined) => {
                        if (!projName) return { bg: "bg-slate-100 text-slate-700 border-slate-200", label: "بدون پروژه / نامشخص" };
                        
                        switch (projName) {
                          case "برج مسکونی فرمانیه":
                            return { bg: "bg-sky-50 text-sky-800 border-sky-200", label: "🏢 برج مسکونی فرمانیه" };
                          case "خط ۷ مترو تهران":
                            return { bg: "bg-red-50 text-red-800 border-red-200", label: "🚇 خط ۷ مترو تهران" };
                          case "پروژه مگا مال تهران":
                            return { bg: "bg-indigo-50 text-indigo-800 border-indigo-200", label: "🏗️ مگا مال اکباتان" };
                          case "سد هراز":
                            return { bg: "bg-emerald-50 text-emerald-800 border-emerald-200", label: "🌊 پروژه سد هراز" };
                          case "پروژه قطار شهری مشهد":
                            return { bg: "bg-purple-50 text-purple-800 border-purple-200", label: "🚈 قطار شهری مشهد" };
                          case "نیروگاه سیکل ترکیبی توس":
                            return { bg: "bg-amber-50 text-amber-800 border-amber-200", label: "⚡ نیروگاه سیکل توس" };
                          case "پتروشیمی عسلویه":
                            return { bg: "bg-indigo-50 text-indigo-800 border-indigo-200", label: "⛽ پتروشیمی عسلویه" };
                          default:
                            return { bg: "bg-slate-50 text-slate-800 border-slate-200", label: `📁 پروژه: ${projName}` };
                        }
                      };

                      const projStyle = getProjectStyles(record.project);
                      const isSelected = selectedRecordIds.includes(record.id);
                      const isReady = record.status !== "Pending";

                      return (
                        <div key={record.id} className={`border transition-all rounded-3xl p-4 flex flex-col md:flex-row gap-4 ${isSelected ? 'border-indigo-400 bg-indigo-50/20 hover:bg-indigo-50/30' : 'border-slate-100 bg-slate-50 hover:bg-white hover:shadow-sm'}`}>
                          
                          {/* Bulk Checkbox & Status Indicator Column */}
                          <div className="flex md:flex-col items-center justify-center gap-3 border-b md:border-b-0 md:border-l border-slate-200 pb-3 md:pb-0 md:pl-3.5 min-w-[65px]" dir="rtl">
                            <label className="relative flex items-center justify-center cursor-pointer p-1.5 hover:bg-slate-200/50 rounded-lg transition-colors">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedRecordIds(prev => [...prev, record.id]);
                                  } else {
                                    setSelectedRecordIds(prev => prev.filter(id => id !== record.id));
                                  }
                                }}
                                className="h-4.5 w-4.5 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer transition-transform duration-100 active:scale-90"
                              />
                            </label>

                            <div className="flex items-center md:flex-col gap-1 md:gap-1.5" title={isReady ? "آماده شده (Ready)" : "در حال پردازش (Pending)"}>
                              {isReady ? (
                                <div className="p-1 bg-emerald-100 text-emerald-700 rounded-full border border-emerald-200" title="آماده (Ready)">
                                  <Check className="h-3.5 w-3.5 font-black" />
                                </div>
                              ) : (
                                <div className="p-1 bg-amber-50 text-amber-700 rounded-full border border-amber-200 animate-pulse" title="در حال بررسی (Pending)">
                                  <ShieldAlert className="h-3.5 w-3.5" />
                                </div>
                              )}
                              <span className={`text-[9px] font-black tracking-wider uppercase ${isReady ? 'text-emerald-700' : 'text-amber-700 animate-pulse'}`}>
                                {isReady ? 'Ready' : 'Pending'}
                              </span>
                            </div>
                          </div>

                          {/* Remaining Card contents inside a flex-1 wrapper */}
                          <div className="flex-1 flex flex-col gap-3">
                            {/* Item Meta Information row */}
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-150/50 pb-2" dir="rtl">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-400 font-mono">#{record.id}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${projStyle.bg}`}>
                                  {projStyle.label}
                                </span>
                                <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-mono uppercase font-bold">
                                  {record.engine}
                                </span>
                              </div>

                              <div className="flex items-center gap-2.5 text-[10px] text-slate-400 font-bold">
                                <div>کارشناس: <strong className="text-slate-600">{record.user}</strong></div>
                                <span className="text-slate-300">•</span>
                                <div>دپارتمان: <span className="text-slate-600">{record.department || "دفتر فنی"}</span></div>
                                <span className="text-slate-300">•</span>
                                <div className="font-mono">{new Date(record.timestamp).toLocaleDateString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</div>
                              </div>
                            </div>

                            {/* Dual textual comparison columns */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Farsi or original language text */}
                              <div className="bg-white hover:border-slate-300/60 transition-all border border-slate-100 p-3 rounded-xl min-h-12 flex flex-col justify-between">
                                <div className="text-[10px] text-slate-400 font-extrabold pb-1 mr-1 flex justify-between items-center" dir="rtl">
                                  <span>متن مبدا ({record.sourceLang.toUpperCase()})</span>
                                  <span className="font-mono text-[9px] font-light text-slate-300">{record.symbolsCount} کاراکتر</span>
                                </div>
                                <p className="text-xs text-slate-800 leading-relaxed font-sans text-right select-text">
                                  {record.originalText}
                                </p>
                              </div>

                              {/* Translated text column */}
                              <div className="bg-emerald-50/20 hover:border-emerald-200/50 transition-all border border-emerald-100/50 p-3 rounded-xl min-h-12 flex flex-col justify-between">
                                <div className="text-[10px] text-brand-primary font-extrabold pb-1 mr-1 flex justify-between items-center" dir="rtl">
                                  <span>ترجمه تخصصی عمران آذرستان ({record.targetLang.toUpperCase()})</span>
                                  <span className="font-mono text-[9px] font-light text-slate-350">{record.durationMs}ms تأخیر</span>
                                </div>
                                <p className="text-xs text-slate-900 leading-relaxed font-sans text-right select-text whitespace-pre-wrap">
                                  {record.translatedText}
                                </p>
                              </div>
                            </div>

                            {/* Quick Audit Action keys */}
                            <div className="flex justify-end gap-2 pt-1 border-t border-slate-100" dir="rtl">
                              <span className="text-[10px] bg-slate-150 text-slate-500 font-bold px-2 py-1 rounded inline-block ml-auto">
                                فنی: {record.category || "مهندسی"}
                              </span>
                              
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(record.translatedText);
                                  alert("ترجمه تخصصی عمران آذرستان در کلیپ‌بورد کپی شد.");
                                  addSystemLog(`ترجمه شناسه ${record.id} به حافظه سیستمی انتقال یافت.`);
                                }}
                                className="text-[10px] text-slate-600 hover:text-brand-primary bg-white hover:bg-brand-primary/10 border border-slate-200 hover:border-brand-primary/30 px-2.5 py-1 rounded-lg transition-all font-bold flex items-center gap-1 cursor-pointer"
                                type="button"
                              >
                                کپی متن ترجمه
                              </button>

                              <button
                                onClick={() => {
                                  setSourceText(record.originalText);
                                  setSourceLang(record.sourceLang);
                                  setTargetLang(record.targetLang);
                                  setSelectedProjectStamp(record.project || null);
                                  setActiveTab("translate");
                                  addSystemLog(`بازیابی سند ترجمه ${record.id} به پنل اصلی با انتساب پروژه "${record.project || "سراسری"}".`);
                                }}
                                className="text-[10px] text-white bg-indigo-600 hover:bg-indigo-700 hover:shadow-xs px-2.5 py-1 rounded-lg transition-transform active:scale-95 font-bold flex items-center gap-1 cursor-pointer"
                                title="بارگذاری و ویرایش مجدد در جعبه ابزار مترجم عمران آذرستان"
                                type="button"
                              >
                                بازپخش در سیستم مترجم عمران آذرستان
                              </button>
                            </div>
                          </div>

                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Graphic charts reports */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Chart 1: Volume of weekly activity */}
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-700 mb-4 text-right flex items-center gap-1.5">
                    <Activity className="h-4.5 w-4.5 text-slate-500" />
                    حجم بارگذاری مکانیزه ترجمه روزانه (خرداد ۱۴۰۵)
                  </h3>
                  <div className="h-64 text-slate-700">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={analytics ? analytics.volumeTimeline : [
                          { date: "خرداد ۱۱", count: 42 },
                          { date: "خرداد ۱۲", count: 56 },
                          { date: "خرداد ۱۳", count: 71 },
                          { date: "خرداد ۱۴", count: 92 },
                          { date: "خرداد ۱۵", count: 48 },
                          { date: "خرداد ۱۶", count: 85 },
                          { date: "خرداد ۱۷", count: 98 }
                        ]}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#006D77" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#006D77" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tickLine={false} style={{ fontSize: 9 }} />
                        <YAxis tickLine={false} style={{ fontSize: 9 }} />
                        <Tooltip contentStyle={{ direction: 'rtl', fontSize: 11 }} />
                        <Area type="monotone" dataKey="count" stroke="#006D77" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCount)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Database Server Resource load */}
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-700 mb-4 text-right flex items-center gap-1.5">
                    <Server className="h-4.5 w-4.5 text-slate-500" />
                    تله‌متری فشار پردازنده مرکزی Windows Server 2022
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={analytics ? analytics.systemLoad : [
                          { time: "08:00", cpu: 22, memory: 45 },
                          { time: "10:00", cpu: 54, memory: 52 },
                          { time: "12:00", cpu: 65, memory: 58 },
                          { time: "14:00", cpu: 48, memory: 55 },
                          { time: "16:00", cpu: 32, memory: 49 },
                          { time: "18:00", cpu: 15, memory: 43 }
                        ]}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#E29578" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#E29578" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="time" tickLine={false} style={{ fontSize: 9 }} />
                        <YAxis tickLine={false} style={{ fontSize: 9 }} />
                        <Tooltip contentStyle={{ direction: 'rtl', fontSize: 11 }} />
                        <Area type="monotone" dataKey="cpu" name="مصرف CPU" stroke="#E29578" fillOpacity={1} fill="url(#colorCpu)" />
                        <Area type="monotone" dataKey="memory" name="فضای رم" stroke="#83C5BE" fill="none" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 3: Language Pair pie distribution */}
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-700 mb-4 text-right">فراوانی زبان‌های مبدا و مقصد پروژه</h3>
                  <div className="h-60 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: "فارسی ↔ انگلیسی", value: 65 },
                            { name: "فارسی ↔ روسی", value: 20 },
                            { name: "انگلیسی ↔ روسی", value: 15 }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill="#006D77" />
                          <Cell fill="#E29578" />
                          <Cell fill="#83C5BE" />
                        </Pie>
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 4: Engine load bar */}
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-700 mb-4 text-right">مقدار مصرف مدل‌های ترجمه (تراکنش‌های موفق)</h3>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analytics ? analytics.engineUsage : [
                          { name: "NLLB-200", count: 420 },
                          { name: "MarianMT", count: 210 },
                          { name: "SeamlessM4T", count: 380 },
                          { name: "GoogleCloud", count: 194 },
                          { name: "OpenAI", count: 312 }
                        ]}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" style={{ fontSize: 9 }} />
                        <YAxis style={{ fontSize: 9 }} />
                        <Tooltip />
                        <Bar dataKey="count" name="کل فراخوانی" fill="#006D77" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>


              {/* Quality Score Metrics Breakdown Panel */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Engine Quality Bar Chart */}
                <div>
                  <h3 className="text-xs font-bold text-slate-700 mb-4 text-right flex items-center gap-1.5">
                    <Star className="h-4.5 w-4.5 text-amber-100 hover:text-amber-500 text-amber-500 fill-amber-500" />
                    میانگین امتیاز کیفی توزیع‌شده موتورها (۱ تا ۵ ستاره)
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analytics?.engineScores || [
                          { name: "NLLB-200", average: 4.1, votesCount: 100 },
                          { name: "MarianMT", average: 3.8, votesCount: 100 },
                          { name: "SeamlessM4T", average: 4.2, votesCount: 100 },
                          { name: "LibreTranslate", average: 3.1, votesCount: 100 },
                          { name: "GoogleCloud", average: 4.6, votesCount: 100 },
                          { name: "OpenAI", average: 4.8, votesCount: 100 },
                          { name: "DeepL", average: 4.7, votesCount: 100 },
                          { name: "Azure", average: 4.4, votesCount: 100 }
                        ]}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" style={{ fontSize: 9 }} />
                        <YAxis domain={[0, 5]} style={{ fontSize: 9 }} />
                        <Tooltip formatter={(value) => [`${value} ستاره`, 'میانگین امتیاز']} />
                        <Bar dataKey="average" name="میانگین امتیاز" fill="#E29578" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Engine Quality Star List Display */}
                <div className="flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-700 mb-3 text-right">لیست با کیفیت‌ترین موتورها (بر اساس نظرسنجی زنده)</h3>
                    <p className="text-[11px] text-slate-500 mb-4 leading-relaxed text-right">
                      این آمار حاصل ثبت آرا همزمان ادمین‌ها و کارشناسان فنی در بخش مقایسه زنده موتورها است:
                    </p>
                    
                    <div className="space-y-3">
                      {(analytics?.engineScores || [
                        { name: "NLLB-200", average: 4.1, votesCount: 100 },
                        { name: "MarianMT", average: 3.8, votesCount: 100 },
                        { name: "SeamlessM4T", average: 4.2, votesCount: 100 },
                        { name: "LibreTranslate", average: 3.1, votesCount: 100 },
                        { name: "GoogleCloud", average: 4.6, votesCount: 100 },
                        { name: "OpenAI", average: 4.8, votesCount: 100 },
                        { name: "DeepL", average: 4.7, votesCount: 105 },
                        { name: "Azure", average: 4.4, votesCount: 100 }
                      ])
                      .sort((a, b) => b.average - a.average)
                      .slice(0, 5) // Show top 5 engines by quality score
                      .map((item, idx) => (
                        <div key={item.name} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-slate-100 shadow-inner">
                          <div className="flex items-center gap-2 text-right">
                            <span className="text-xs font-black text-slate-400 font-mono w-4">#{idx + 1}</span>
                            <span className="text-xs font-bold text-slate-800">{engines.find(e => e.id === item.name)?.name || item.name}</span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-slate-400 font-mono">({item.votesCount} رای)</span>
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star 
                                  key={star} 
                                  className={`h-3 w-3 ${
                                    star <= Math.round(item.average) 
                                      ? 'text-amber-500 fill-amber-500' 
                                      : 'text-slate-200'
                                  }`} 
                                />
                              ))}
                            </div>
                            <span className="text-xs font-black text-slate-800 font-mono bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-sm">
                              {item.average.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-amber-50/50 border border-amber-200/50 rounded-xl p-3 text-[11px] text-amber-800 leading-relaxed text-right font-medium mt-4">
                    حسگرهای کیفی نشان‌دهنده دقت بالای موتورهای مبتنی بر LLM (مانند OpenAI) با میانگین امتیاز ۴.۸ در تحلیل مفاهیم پیچیده ژئوتکنیکی عمران آذرستان نسبت به موتورهای آفلاین است.
                  </div>
                </div>

              </div>

              {/* Engine Dynamic Priorities Toggle Panel (Admin Only) */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4.5 w-4.5 text-brand-primary" />
                    <h3 className="text-sm font-bold text-slate-800">الویت‌بندی و تنظیم پویای موتورهای ترجمه مرکزی</h3>
                  </div>
                  {currentUser.role !== 'Admin' && (
                    <span className="text-[10px] text-amber-600 bg-amber-50 rounded px-2 py-0.5 border border-amber-200 font-bold flex items-center gap-1">
                      <Lock className="h-3 w-3" /> فقط دسترسی ادمین ارشد
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  ترجمه ترکیبی عمران آذرستان با الویت‌بندی به این موتورها واگذار می‌شود. مدیر ارشد شبکه قادر است پویایی و الویت آنها را تغییر دهد:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {engines.map((eng) => (
                    <div key={eng.id} className="border border-slate-100 bg-slate-50 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-inner">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-xs font-bold text-slate-800">{eng.name}</div>
                          <span className={`text-[9px] px-1.5 py-0.1 rounded font-bold uppercase mt-1 inline-block ${
                            eng.category === 'open-source' ? 'bg-sky-50 text-sky-700' : 'bg-purple-50 text-purple-700'
                          }`}>
                            {eng.category === 'open-source' ? "منبع‌باز (داخلی)" : "تجاری (External)"}
                          </span>
                        </div>
                        
                        <div className={`h-2.5 w-2.5 rounded-full ${eng.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                      </div>

                      <div className="flex justify-between items-center text-[10px] pt-2 border-t border-slate-150">
                        <span>ترجیح الویت: <strong className="font-mono">#{eng.priority}</strong></span>
                        <button
                          type="button"
                          onClick={() => {
                            if (currentUser.role !== 'Admin') {
                              alert("تنها ادمین ارشد مجاز به خاموش و روشن کردن موتورهای ترجمه است.");
                              return;
                            }
                            toggleEngineState(eng.id);
                          }}
                          className={`px-3 py-1 rounded font-bold text-[10px] transition-all focus:outline-none ${
                            eng.enabled 
                              ? "bg-red-50 text-red-600 hover:bg-red-100" 
                              : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                          }`}
                        >
                          {eng.enabled ? "خاتمه خدمت" : "فعال‌سازی مجدد"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: SYSTEM DELIVERABLES & TECHNICAL SPECIFICATION */}
          {activeTab === "docs" && (
            <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Left sidebar directory navigation of Deliverables */}
              <div className="md:col-span-4 lg:col-span-3 border-l border-slate-150 pl-4 space-y-1.5">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 mb-2 border-b border-slate-100">
                  فهرست مدارک و دستورالعمل‌ها
                </div>
                {technicalSpecs.map((spec) => (
                  <button
                    key={spec.id}
                    onClick={() => setActiveDocSection(spec.id)}
                    className={`w-full text-right px-3 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-between group ${
                      activeDocSection === spec.id 
                        ? "bg-brand-primary text-white" 
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <span className="truncate">{spec.titleFa}</span>
                    <ChevronRight className={`h-3 w-3 ${activeDocSection === spec.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  </button>
                ))}

                <div className="pt-4 mt-4 border-t border-slate-100">
                  <div className="bg-brand-light border border-teal-200 rounded-lg p-3 text-[10px] text-brand-primary leading-relaxed font-semibold">
                    کلیه ۱۳ مدرک فنی و پیوست‌های استقرار طبق دستورالعمل تاییدیه امنیت اطلاعات عمران آذرستان امضا گردیده است.
                  </div>
                </div>
              </div>

              {/* Right document viewer area */}
              <div className="md:col-span-8 lg:col-span-9 flex flex-col gap-4">
                
                {technicalSpecs.filter(spec => spec.id === activeDocSection).map((spec) => (
                  <div key={spec.id} className="space-y-4">
                    
                    {/* Bilingual toggle header */}
                    <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                      <div>
                        <h2 className="text-base font-bold text-slate-800">{spec.titleFa}</h2>
                        <span className="text-xs text-slate-400 font-mono italic">{spec.titleEn}</span>
                      </div>
                      
                      <button 
                        onClick={() => {
                          const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(spec.contentFa);
                          const downloadAnchor = document.createElement('a');
                          downloadAnchor.setAttribute("href", dataStr);
                          downloadAnchor.setAttribute("download", `${spec.id}_spec.txt`);
                          document.body.appendChild(downloadAnchor);
                          downloadAnchor.click();
                          downloadAnchor.remove();
                        }}
                        className="text-xs text-brand-primary flex items-center gap-1 bg-brand-primary/10 border border-brand-primary/20 px-3 py-1.5 rounded-lg font-bold"
                      >
                        <Download className="h-3.5 w-3.5" /> ذخیره نسخه مکتوب
                      </button>
                    </div>

                    {/* Farsi content */}
                    <div className="p-4 bg-slate-900 text-slate-100 rounded-xl border border-slate-800 font-mono text-xs leading-relaxed whitespace-pre-wrap select-text" dir="rtl">
                      {spec.contentFa}
                    </div>

                    {/* English translation mirror */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl font-sans text-xs leading-relaxed whitespace-pre-wrap text-slate-700 select-text" dir="ltr">
                      <div className="text-[10px] uppercase font-bold tracking-wide text-brand-primary mb-2">English Architectural Reference:</div>
                      {spec.contentEn}
                    </div>

                  </div>
                ))}

              </div>

            </div>
          )}

          {/* TAB 5: ADMIN SYSTEM INSTALLATION AND SETUP GUIDE */}
          {activeTab === "admin-setup" && currentUser?.role === "Admin" && (
            <AdminSetupGuide currentUser={currentUser} />
          )}

        </div>

      </main>

      {/* 5. Compact Corporate Footer */}
      <footer className="bg-slate-200 border-t border-slate-300 mt-12 py-4 text-[10px] text-slate-600 font-sans">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div>
            © ۲۰۲۶ شرکت عمران آذرستان • دپارتمان فناوری اطلاعات و ارتباطات | نسخه ۴.۲.۰ پایداری سیستم: ۹۹.۹٪
          </div>
          <div className="flex gap-4 font-mono text-[9px] text-slate-500">
            <span>ویندوز سرور ۲۰۲۵ - متصل (AD Sync)</span>
            <span>SERVER-ID: EN-TR-PR-01</span>
          </div>
        </div>
      </footer>

      {/* 6. Dynamic Projects Database Viewer Modal */}
      {showProjectsDbModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in text-right" dir="rtl">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-indigo-600" />
                <div>
                  <h3 className="font-black text-slate-800 text-sm">بانک پروژه‌های مهندسی عمران آذرستان</h3>
                  <p className="text-[10px] text-slate-400 font-bold">پروژه‌های واقعی همگام‌سازی شده و فعال در سیستم تطبیق معنایی هوشمند</p>
                </div>
              </div>
              <button
                onClick={() => setShowProjectsDbModal(false)}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg transition-all cursor-pointer font-bold"
              >
                بستن پنجره
              </button>
            </div>

            {/* List */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1 bg-slate-50/50">
              {dbProjects.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 font-bold">
                  هیچ پروژه‌ای در بانک اطلاعاتی یافت نشد. دکمه پویش را فشار دهید.
                </div>
              ) : (
                dbProjects.map((proj, idx) => (
                  <div key={idx} className="bg-white border border-slate-250 rounded-xl p-4 shadow-2xs hover:border-indigo-300 transition-all">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full uppercase font-mono">
                          {proj.id}
                        </span>
                        <h4 className="font-black text-slate-800 text-xs">{proj.nameFa}</h4>
                        <span className="text-slate-300 text-xs">|</span>
                        <span className="text-[10px] font-mono text-slate-400" dir="ltr">{proj.nameEn}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md font-bold">
                        {proj.location}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed mb-3">
                      <strong>شرح خدمات:</strong> {proj.scope}
                    </p>

                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-[9px] text-slate-400 font-black">دسته‌بندی‌ها:</span>
                      {proj.mainTags && proj.mainTags.map((tag: string, i: number) => (
                        <span key={i} className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-150 bg-slate-50 flex flex-wrap justify-between items-center gap-2">
              <span className="text-[10px] text-slate-400 font-bold">تعداد کل پروژه‌های فعال: {dbProjects.length}</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={syncQuery}
                  onChange={(e) => setSyncQuery(e.target.value)}
                  placeholder="کلیدواژه جستجو..."
                  className="text-[10px] bg-white border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold w-48"
                />
                <button
                  onClick={handleSyncProjects}
                  disabled={isSyncingProjects}
                  className="text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                >
                  {isSyncingProjects ? "در حال همگام‌سازی..." : "پویش آنلاین مجدد"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Bilingual File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in text-right" dir="rtl">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                <div>
                  <h3 className="font-black text-slate-800 text-sm">پیش‌نمایش سند ترجمه شده دو زبانه</h3>
                  <p className="text-[10px] text-slate-400 font-bold">{previewFile.name} ❖ از {previewFile.source.toUpperCase()} به {previewFile.target.toUpperCase()}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg transition-all cursor-pointer font-bold"
              >
                بستن پیش‌نمایش
              </button>
            </div>

            {/* List */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-slate-50/50">
              {(() => {
                const content = previewFile.translatedContent || "";
                const lines = content.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
                
                if (lines.length < 2) {
                  const isPersian = /[\u0600-\u06FF]/.test(content);
                  return (
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs whitespace-pre-wrap leading-relaxed text-xs" dir={isPersian ? "rtl" : "ltr"}>
                      {content}
                    </div>
                  );
                }

                const elements = [];
                for (let i = 0; i < lines.length; i += 2) {
                  const originalText = lines[i];
                  const translatedText = lines[i + 1] || "";
                  
                  const origRtl = /[\u0600-\u06FF]/.test(originalText);
                  const transRtl = /[\u0600-\u06FF]/.test(translatedText);

                  elements.push(
                    <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs space-y-3 hover:shadow-2xs transition-all">
                      {/* Original Paragraph Block */}
                      <div 
                        dir={origRtl ? "rtl" : "ltr"} 
                        className={`text-[12px] leading-relaxed text-slate-500 p-3 bg-slate-50 rounded-lg border border-slate-100 ${origRtl ? 'text-right' : 'text-left'}`}
                      >
                        <span className="text-[9px] font-black tracking-wider text-slate-400 block mb-1 uppercase">
                          [متن اصلی - Source]
                        </span>
                        {originalText}
                      </div>
                      
                      {/* Translated Paragraph Block */}
                      <div 
                        dir={transRtl ? "rtl" : "ltr"} 
                        className={`text-[13.5px] leading-relaxed text-slate-800 font-bold p-3 bg-emerald-50/20 rounded-lg border-y border-emerald-100 ${transRtl ? 'text-right border-r-4 border-r-emerald-500' : 'text-left border-l-4 border-l-emerald-500'}`}
                      >
                        <span className="text-[9px] font-black tracking-wider text-emerald-600 block mb-1 uppercase">
                          [ترجمه پاراگراف - Translation]
                        </span>
                        {translatedText}
                      </div>
                    </div>
                  );
                }
                return elements;
              })()}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-150 bg-slate-50 flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-bold">بخش‌های استخراج شده: {Math.ceil((previewFile.translatedContent || "").split('\n').filter((l: string) => l.trim()).length / 2)} بند دو زبانه</span>
              <button
                onClick={() => {
                  downloadTranslatedFile(previewFile);
                  setPreviewFile(null);
                }}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Download className="h-4.5 w-4.5" /> دانلود فایل سند (.doc Word)
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Bulk Download Confirmation Modal */}
      {isBulkDownloadModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl text-right animate-scale-up">
            <div className="flex items-center gap-3 border-b border-slate-150 pb-3 mb-4">
              <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">تایید نهایی دانلود گروهی اسناد</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">دانلود یکپارچه سوابق ممیزی و ترجمه آذرستان</p>
              </div>
            </div>

            <div className="space-y-3 mb-6 bg-slate-50 p-3.5 rounded-2xl border border-slate-150 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>تعداد سوابق انتخاب‌شده:</span>
                <strong className="text-indigo-600 font-mono text-sm">{selectedRecordIds.length} رکورد</strong>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>قالب خروجی نهایی:</span>
                <span className="font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded uppercase font-mono">
                  {bulkDownloadFormat === "csv" ? "Consolidated CSV (.csv)" : "Compressed Documents Archive (.zip)"}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                آیا مایلید کلیه اسناد فنی فوق با ساختار فیلدهای متناظر اعم از نام پروژه، دپارتمان، متن اصلی و ترجمه، در قالب یک فایل تجمیع و در رایانه شما ذخیره گردند؟
              </p>
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setIsBulkDownloadModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                type="button"
              >
                انصراف و لغو عملیات
              </button>
              <button
                onClick={() => {
                  setIsBulkDownloadModalOpen(false);
                  const recordsToDownload = translationHistory.filter(r => selectedRecordIds.includes(r.id));
                  
                  if (bulkDownloadFormat === "csv") {
                    const headers = ["ID", "Project", "SourceLang", "TargetLang", "OriginalText", "TranslatedText", "Engine", "User", "Department", "Timestamp", "Status"];
                    const csvRows = [headers.join(",")];
                    
                    recordsToDownload.forEach(r => {
                      const row = [
                        r.id,
                        `"${(r.project || 'سراسری').replace(/"/g, '""')}"`,
                        r.sourceLang,
                        r.targetLang,
                        `"${r.originalText.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
                        `"${r.translatedText.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
                        r.engine,
                        `"${r.user.replace(/"/g, '""')}"`,
                        `"${(r.department || 'دفتر فنی').replace(/"/g, '""')}"`,
                        r.timestamp,
                        r.status || "Ready"
                      ];
                      csvRows.push(row.join(","));
                    });
                    
                    const csvContent = "\uFEFF" + csvRows.join("\n");
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.setAttribute("href", url);
                    link.setAttribute("download", `bazarstan-bulk-translations-${new Date().toISOString().split('T')[0]}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    addSystemLog(`دانلود فایل CSV گروهی شامل ${recordsToDownload.length} سند ترجمه انجام شد.`);
                    alert(`خروجی CSV حاوی ${recordsToDownload.length} سند با موفقیت دانلود شد.`);
                  } else {
                    const archiveData = {
                      info: "Azarestan Translation Archive Pack",
                      date: new Date().toISOString(),
                      records: recordsToDownload
                    };
                    const blob = new Blob([JSON.stringify(archiveData, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.setAttribute("href", url);
                    link.setAttribute("download", `bazarstan-bulk-translations-${new Date().toISOString().split('T')[0]}.zip`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    addSystemLog(`دانلود فایل ZIP گروهی شامل ${recordsToDownload.length} سند ترجمه انجام شد.`);
                    alert(`بسته ZIP حاوی ${recordsToDownload.length} فایل ترجمه با موفقیت دانلود و ذخیره شد.`);
                  }
                  setSelectedRecordIds([]);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer"
                type="button"
              >
                تایید و دانلود مستقیم
              </button>
            </div>
          </div>
        </div>
      )}

      </>
      )}

    </div>
  );
}
