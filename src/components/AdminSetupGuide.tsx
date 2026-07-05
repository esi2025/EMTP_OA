import React, { useState, useEffect } from "react";
import { 
  Server, 
  Database, 
  Settings, 
  Terminal, 
  Key, 
  Users, 
  Cpu, 
  CheckCircle, 
  Copy, 
  Check, 
  BookOpen, 
  AlertTriangle, 
  FileCode, 
  ShieldCheck, 
  Play, 
  RefreshCw,
  Plus,
  Trash2,
  Clock,
  Activity,
  UserCheck,
  ShieldAlert,
  LogOut
} from "lucide-react";

import { ADUser } from "../types";

export function AdminSetupGuide({ currentUser }: { currentUser: ADUser }) {
  const [adminTab, setAdminTab] = useState<"users" | "dashboard" | "docs" >("users");
  const [activeStep, setActiveStep] = useState<number>(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Active Directory Users state
  const [adUsers, setAdUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // New User Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [newRole, setNewRole] = useState<"Admin" | "Translator" | "DeptManager" | "User">("User");
  const [newAllowedIp, setNewAllowedIp] = useState("");
  const [newCanTranslate, setNewCanTranslate] = useState(true);
  const [newCanDefineTerms, setNewCanDefineTerms] = useState(true);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const fetchAdUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.success) {
        setAdUsers(data.users || []);
      }
    } catch (e) {
      console.error("Error fetching AD users:", e);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const updateAdUser = async (username: string, updates: any) => {
    try {
      const res = await fetch("/api/admin/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, requester: currentUser?.username, ...updates })
      });
      const data = await res.json();
      if (data.success) {
        setAdUsers(prev => prev.map(u => u.username === username ? { ...u, ...data.user } : u));
      } else {
        alert(data.error || "خطا در بروزرسانی تنظیمات کاربر");
      }
    } catch (err) {
      console.error("Error updating user:", err);
      alert("خطای ارتباط با سرور");
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newName.trim()) {
      alert("نام کاربری و نام و نام خانوادگی الزامی هستند.");
      return;
    }
    setIsCreatingUser(true);
    try {
      const res = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername,
          name: newName,
          email: newEmail,
          department: newDepartment,
          role: newRole,
          allowedIp: newAllowedIp,
          canTranslate: newCanTranslate,
          canDefineTerms: newCanDefineTerms,
          requester: currentUser?.username
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdUsers(prev => [...prev, data.user]);
        // Reset form
        setNewUsername("");
        setNewName("");
        setNewEmail("");
        setNewDepartment("");
        setNewRole("User");
        setNewAllowedIp("");
        setNewCanTranslate(true);
        setNewCanDefineTerms(true);
        setShowAddForm(false);
        alert(`کاربر سازمانی جدید (${data.user.name}) با موفقیت به شبکه اضافه شد.`);
      } else {
        alert(data.error || "خطا در ایجاد کاربر جدید");
      }
    } catch (err) {
      console.error(err);
      alert("خطای ارتباط با سرور");
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleDeleteUser = async (username: string) => {
    if (username.toLowerCase() === "support") {
      alert("امکان حذف یوزر ارشد پشتیبان وجود ندارد.");
      return;
    }
    if (!window.confirm(`آیا از حذف کاربر "${username}" اطمینان کامل دارید؟ دسترسی او به سامانه به طور کامل لغو خواهد شد.`)) {
      return;
    }
    try {
      const res = await fetch("/api/admin/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, requester: currentUser?.username })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdUsers(prev => prev.filter(u => u.username !== username));
        alert("کاربر مورد نظر با موفقیت حذف گردید.");
      } else {
        alert(data.error || "خطا در حذف کاربر");
      }
    } catch (err) {
      console.error(err);
      alert("خطای ارتباط با سرور");
    }
  };
  
  // Projects State
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  // New Project Form State
  const [newProjNameFa, setNewProjNameFa] = useState("");
  const [newProjNameEn, setNewProjNameEn] = useState("");
  const [newProjLocation, setNewProjLocation] = useState("");
  const [newProjScope, setNewProjScope] = useState("");
  const [newProjTags, setNewProjTags] = useState("");
  const [newProjKeywordsFa, setNewProjKeywordsFa] = useState("");
  const [newProjKeywordsEn, setNewProjKeywordsEn] = useState("");

  // Sessions State
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  // Checklist states
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({
    1: true,
    2: false,
    3: false,
    4: false,
    5: false
  });

  // Simulated AD integration test state
  const [testingAD, setTestingAD] = useState(false);
  const [adTestOutput, setAdTestOutput] = useState<string[]>([]);

  // ENV Generator states
  const [dbUser, setDbUser] = useState("admin");
  const [dbPass, setDbPass] = useState("KaysonPass151");
  const [dbHost, setDbHost] = useState("postgres-db");
  const [geminiKey, setGeminiKey] = useState("AIzaSy_...");

  // Fetch projects and sessions
  const fetchProjects = async () => {
    setIsLoadingProjects(true);
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (data.success) {
        setProjects(data.projects || []);
      }
    } catch (e) {
      console.error("Error fetching projects:", e);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const fetchSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const res = await fetch("/api/auth/sessions");
      const data = await res.json();
      if (data.success) {
        setSessions(data.sessions || []);
      }
    } catch (e) {
      console.error("Error fetching sessions:", e);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchSessions();
    fetchAdUsers();
    
    // Poll sessions and users every 10 seconds to keep track of active statuses
    const interval = setInterval(() => {
      fetchSessions();
      fetchAdUsers();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjNameFa || !newProjNameEn) {
      alert("لطفا نام فارسی و انگلیسی پروژه را وارد کنید.");
      return;
    }
    try {
      const res = await fetch("/api/projects/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameFa: newProjNameFa,
          nameEn: newProjNameEn,
          location: newProjLocation,
          scope: newProjScope,
          mainTags: newProjTags ? newProjTags.split(",").map(t => t.trim()) : [],
          keywordsFa: newProjKeywordsFa ? newProjKeywordsFa.split(",").map(t => t.trim()) : [newProjNameFa],
          keywordsEn: newProjKeywordsEn ? newProjKeywordsEn.split(",").map(t => t.trim()) : [newProjNameEn]
        })
      });
      const data = await res.json();
      if (data.success) {
        setProjects(data.projects || []);
        // Reset form
        setNewProjNameFa("");
        setNewProjNameEn("");
        setNewProjLocation("");
        setNewProjScope("");
        setNewProjTags("");
        setNewProjKeywordsFa("");
        setNewProjKeywordsEn("");
        alert("پروژه جدید با موفقیت بصورت دستی ایجاد و ذخیره گردید.");
      } else {
        alert(data.error || "خطا در ایجاد پروژه");
      }
    } catch (err) {
      console.error("Error creating project:", err);
      alert("خطای ارتباط با سرور");
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("آیا از حذف این پروژه فنی اطمینان کامل دارید؟ تمام بایگانی‌ها بدون پروژه منتسب خواهند شد.")) return;
    try {
      const res = await fetch("/api/projects/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        setProjects(data.projects || []);
        alert("پروژه فنی با موفقیت از سیستم حذف شد.");
      } else {
        alert(data.error || "خطا در حذف پروژه");
      }
    } catch (err) {
      console.error("Error deleting project:", err);
      alert("خطا در ارتباط با سرور");
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleStepCompleted = (stepIndex: number) => {
    setCompletedSteps(prev => ({
      ...prev,
      [stepIndex]: !prev[stepIndex]
    }));
  };

  const runSimulatedADTest = () => {
    setTestingAD(true);
    setAdTestOutput([]);
    
    const logs = [
      "🔄 اتصال به وب‌سرور Active Directory عمران آذرستان (10.10.1.5)...",
      "🔑 بررسی توکن سرویس Kerberos (Service Principal)...",
      "✔ اتصال برقرار شد. برقراری نشست با LDAP عمران آذرستان...",
      "🔍 جستجوی کاربر نمونه: m.esmaeili.admin...",
      "✔ کاربر پیدا شد: مهدی اسماعیلی | نقش: Admin | دپارتمان: مدیریت پروژه و مهندسی",
      "🎉 تست یکپارچگی فعال اکتیو دایرکتوری با موفقیت با وضعیت OK به پایان رسید!"
    ];

    logs.forEach((log, index) => {
      setTimeout(() => {
        setAdTestOutput(prev => [...prev, log]);
        if (index === logs.length - 1) {
          setTestingAD(false);
        }
      }, (index + 1) * 600);
    });
  };

  const formatDuration = (seconds: number | null | undefined): string => {
    if (!seconds || seconds <= 0) return "کمتر از یک دقیقه";
    if (seconds < 60) return `${seconds} ثانیه`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (remainingSeconds === 0) {
      return `${minutes} دقیقه`;
    }
    return `${minutes} دقیقه و ${remainingSeconds} ثانیه`;
  };

  const stepsList = [
    {
      id: 1,
      title: "نیازمندی‌ها و محیط سه‌گانه",
      icon: <Cpu className="h-5 w-5" />,
      desc: "بررسی پیش‌نیازهای سخت‌افزاری و نرم‌افزاری شبکه عمران آذرستان"
    },
    {
      id: 2,
      title: "نصب بسته‌ها و مخزن گیت",
      icon: <Terminal className="h-5 w-5" />,
      desc: "نصب بسته‌های npm، راه‌اندازی فایل‌های ساختاری و متغیرها"
    },
    {
      id: 3,
      title: "دیتابیس ابری و لوکال عمران آذرستان",
      icon: <Database className="h-5 w-5" />,
      desc: "راه‌اندازی ساختار طرحواره (Schema) برای PostgreSQL"
    },
    {
      id: 4,
      title: "یکپارچه‌سازی Active Directory",
      icon: <Users className="h-5 w-5" />,
      desc: "تست و فعال‌سازی احراز هویت با پروتکل Kerberos / LDAP"
    },
    {
      id: 5,
      title: "پایداری با PM2 و وب‌سرور",
      icon: <Server className="h-5 w-5" />,
      desc: "اجرای خودکار به عنوان سرویس ویندوز یا لینوکس"
    }
  ];

  const totalCompleted = Object.values(completedSteps).filter(Boolean).length;
  const progressPercent = Math.round((totalCompleted / stepsList.length) * 100);

  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-4 sm:p-6" dir="rtl" id="admin-setup-guide-container">
      
      {/* Alert Banner */}
      <div className="bg-slate-900 text-slate-100 rounded-xl p-4 mb-6 flex flex-wrap items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-7 w-7 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-white font-black text-sm">پنل فوق‌امنیتی سرپرست ارشد سیستم (Admin Console Only)</h3>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">
              مدیر گرامی، این بخش به طور انحصاری جهت <strong className="text-white">تعریف دستی پروژه‌ها</strong>، <strong className="text-white">رهگیری و پایش زنده ورود/خروج کاربران</strong> و مطالعه استقرار مستندات شبکه تعبیه گردیده است.
            </p>
          </div>
        </div>
        <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700 font-bold text-xs">
          <button
            onClick={() => setAdminTab("users")}
            className={`px-4 py-2 rounded-md transition-all cursor-pointer ${adminTab === "users" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
          >
            مدیریت و دسترسی کاربران
          </button>
          <button
            onClick={() => setAdminTab("dashboard")}
            className={`px-4 py-2 rounded-md transition-all cursor-pointer ${adminTab === "dashboard" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
          >
            تعریف پروژه و لاگ نشست‌ها
          </button>
          <button
            onClick={() => setAdminTab("docs")}
            className={`px-4 py-2 rounded-md transition-all cursor-pointer ${adminTab === "docs" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
          >
            مستندات استقرار سیستم
          </button>
        </div>
      </div>

      {adminTab === "users" && (
        <div className="space-y-6 animate-fade-in text-right">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600 animate-pulse" />
                <div>
                  <h3 className="font-black text-slate-800 text-sm">مدیریت کاربران سازمانی و سطوح دسترسی شبکه (Active Directory Integration)</h3>
                  <p className="text-[10px] text-slate-400 font-bold">تعیین کاربران مجاز به ورود، اعمال محدودیت IP و تخصیص دسترسی‌های ترجمه و دیکشنری</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {currentUser?.username?.toLowerCase() === "support" && (
                  <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {showAddForm ? "بستن فرم تعریف کاربر" : "تعریف کاربر جدید"}
                  </button>
                )}
                <button
                  onClick={fetchAdUsers}
                  disabled={isLoadingUsers}
                  className="text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoadingUsers ? "animate-spin" : ""}`} />
                  بروزرسانی لیست کاربران
                </button>
              </div>
            </div>

            {/* Create New User Form (SUPPORT ONLY) */}
            {currentUser?.username?.toLowerCase() === "support" && showAddForm && (
              <form onSubmit={handleCreateUser} className="bg-white border border-indigo-100 rounded-xl p-4 mb-5 text-right space-y-4 shadow-md animate-fade-in">
                <div className="flex items-center gap-2 text-indigo-700 font-black text-xs pb-2 border-b border-indigo-50">
                  <Plus className="h-4 w-4 text-emerald-600" />
                  <span>تعریف کاربر جدید در پایگاه داده شبکه (Active Directory Fallback Database)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-500 font-bold">نام کاربری (مبنای ورود):</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: m.ahmadi"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono text-left focus:bg-white focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-500 font-bold">نام و نام خانوادگی کامل:</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: محمد احمدی"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold focus:bg-white focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-500 font-bold">ایمیل سازمانی:</label>
                    <input
                      type="email"
                      placeholder="مثال: m.ahmadi@omran-azarestan.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono text-left focus:bg-white focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-500 font-bold">بخش / دپارتمان:</label>
                    <input
                      type="text"
                      placeholder="مثال: کارگاه پروژه عمران پرند"
                      value={newDepartment}
                      onChange={(e) => setNewDepartment(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold focus:bg-white focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-500 font-bold">نقش سیستمی:</label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as any)}
                      className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold focus:bg-white focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="User">کاربر ساده (User)</option>
                      <option value="Translator">مترجم تخصصی (Translator)</option>
                      <option value="DeptManager">مدیر دپارتمان (DeptManager)</option>
                      <option value="Admin">مدیر سیستم (Admin)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-500 font-bold">محدودیت IP اختصاصی:</label>
                    <input
                      type="text"
                      placeholder="بدون محدودیت IP"
                      value={newAllowedIp}
                      onChange={(e) => setNewAllowedIp(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono text-left focus:bg-white focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex items-center gap-2 h-full pt-4">
                    <input
                      type="checkbox"
                      id="newCanTranslate"
                      checked={newCanTranslate}
                      onChange={(e) => setNewCanTranslate(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                    />
                    <label htmlFor="newCanTranslate" className="text-xs text-slate-700 font-bold cursor-pointer">مجاز به ترجمه تخصصی</label>
                  </div>
                  <div className="flex items-center gap-2 h-full pt-4">
                    <input
                      type="checkbox"
                      id="newCanDefineTerms"
                      checked={newCanDefineTerms}
                      onChange={(e) => setNewCanDefineTerms(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                    />
                    <label htmlFor="newCanDefineTerms" className="text-xs text-slate-700 font-bold cursor-pointer">مجاز به تعریف اصطلاح</label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-all"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingUser}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-5 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
                  >
                    {isCreatingUser ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>در حال ایجاد...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span>ایجاد حساب سازمانی جدید</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="p-3 font-bold">کاربر اکتیودایرکتوری</th>
                    <th className="p-3 font-bold">بخش / دپارتمان</th>
                    <th className="p-3 font-bold">نقش سیستمی</th>
                    <th className="p-3 font-bold text-center">وضعیت دسترسی</th>
                    <th className="p-3 font-bold">محدودیت IP اختصاصی</th>
                    <th className="p-3 font-bold text-center">نقش مترجم</th>
                    <th className="p-3 font-bold text-center">تعریف واژه</th>
                    <th className="p-3 font-bold text-center">اقدامات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-bold">
                  {adUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-xs text-slate-400 font-bold">
                        در حال بارگذاری لیست کاربران شبکه عمران آذرستان...
                      </td>
                    </tr>
                  ) : (
                    adUsers.map((user) => {
                      const isSupport = currentUser?.username?.toLowerCase() === "support";
                      return (
                        <tr key={user.username} className="hover:bg-indigo-50/20 transition-all font-semibold">
                          
                          {/* Active Directory User */}
                          <td className="p-3">
                            {isSupport ? (
                              <div className="flex flex-col gap-1 max-w-[200px]">
                                <input
                                  type="text"
                                  value={user.name || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setAdUsers(prev => prev.map(u => u.username === user.username ? { ...u, name: val } : u));
                                  }}
                                  onBlur={(e) => updateAdUser(user.username, { name: e.target.value })}
                                  className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-bold focus:bg-white focus:ring-1 focus:ring-indigo-500 text-right w-full"
                                  placeholder="نام کاربر"
                                />
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] font-mono text-slate-400 bg-slate-100 px-1 py-0.5 rounded shrink-0">{user.username}</span>
                                  <input
                                    type="text"
                                    value={user.email || ""}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setAdUsers(prev => prev.map(u => u.username === user.username ? { ...u, email: val } : u));
                                    }}
                                    onBlur={(e) => updateAdUser(user.username, { email: e.target.value })}
                                    className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-[9px] font-mono text-left focus:bg-white focus:ring-1 focus:ring-indigo-500 w-full"
                                    dir="ltr"
                                    placeholder="ایمیل"
                                  />
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="font-black text-slate-800">{user.name}</div>
                                <div className="text-[9px] text-slate-400 font-mono tracking-wide mt-0.5" dir="ltr">{user.username} | {user.email}</div>
                              </div>
                            )}
                          </td>
                          
                          {/* Department */}
                          <td className="p-3">
                            {isSupport ? (
                              <input
                                type="text"
                                value={user.department || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setAdUsers(prev => prev.map(u => u.username === user.username ? { ...u, department: val } : u));
                                }}
                                onBlur={(e) => updateAdUser(user.username, { department: e.target.value })}
                                className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-bold focus:bg-white focus:ring-1 focus:ring-indigo-500 text-right w-36"
                                placeholder="دپارتمان"
                              />
                            ) : (
                              <span className="text-slate-500 font-bold">{user.department}</span>
                            )}
                          </td>

                          {/* System Role */}
                          <td className="p-3">
                            {isSupport ? (
                              <select
                                value={user.role || "User"}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setAdUsers(prev => prev.map(u => u.username === user.username ? { ...u, role: val } : u));
                                  updateAdUser(user.username, { role: val });
                                }}
                                className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-bold focus:bg-white focus:ring-1 focus:ring-indigo-500 w-24"
                              >
                                <option value="User">User</option>
                                <option value="Translator">Translator</option>
                                <option value="DeptManager">DeptManager</option>
                                <option value="Admin">Admin</option>
                              </select>
                            ) : (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                user.role === "Admin" ? "bg-purple-100 text-purple-700" :
                                user.role === "Translator" ? "bg-indigo-100 text-indigo-700" :
                                user.role === "DeptManager" ? "bg-amber-100 text-amber-700" :
                                "bg-slate-100 text-slate-600"
                              }`}>
                                {user.role}
                              </span>
                            )}
                          </td>
                          
                          {/* Authorized Toggle */}
                          <td className="p-3 text-center">
                            <button
                              onClick={() => updateAdUser(user.username, { authorized: user.authorized === false ? true : false })}
                              disabled={!isSupport}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all border ${
                                isSupport ? "cursor-pointer" : "cursor-not-allowed opacity-80"
                              } ${
                                user.authorized !== false
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                  : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                              }`}
                              type="button"
                            >
                              {user.authorized !== false ? "✔ کاربر مجاز" : "❌ مسدود شده"}
                            </button>
                          </td>

                          {/* Allowed IP Input */}
                          <td className="p-3">
                            <input
                              type="text"
                              value={user.allowedIp || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setAdUsers(prev => prev.map(u => u.username === user.username ? { ...u, allowedIp: val } : u));
                              }}
                              onBlur={(e) => updateAdUser(user.username, { allowedIp: e.target.value })}
                              disabled={!isSupport}
                              placeholder="بدون محدودیت IP"
                              className={`w-32 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-mono px-2 py-1 focus:bg-white focus:ring-1 focus:ring-indigo-500 text-left ${
                                !isSupport ? "cursor-not-allowed opacity-80" : ""
                              }`}
                              dir="ltr"
                            />
                          </td>

                          {/* Translator Access Toggle */}
                          <td className="p-3 text-center">
                            <button
                              onClick={() => updateAdUser(user.username, { canTranslate: user.canTranslate === false ? true : false })}
                              disabled={!isSupport}
                              className={`px-2 py-1 rounded-md text-[10px] font-black transition-all ${
                                isSupport ? "cursor-pointer" : "cursor-not-allowed opacity-80"
                              } ${
                                user.canTranslate !== false
                                  ? "bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100"
                                  : "bg-slate-50 text-slate-400 border border-slate-200 hover:bg-slate-100"
                              }`}
                              type="button"
                            >
                              {user.canTranslate !== false ? "مترجم مجاز" : "فاقد دسترسی"}
                            </button>
                          </td>

                          {/* Dictionary Definition Toggle */}
                          <td className="p-3 text-center">
                            <button
                              onClick={() => updateAdUser(user.username, { canDefineTerms: user.canDefineTerms === false ? true : false })}
                              disabled={!isSupport}
                              className={`px-2 py-1 rounded-md text-[10px] font-black transition-all ${
                                isSupport ? "cursor-pointer" : "cursor-not-allowed opacity-80"
                              } ${
                                user.canDefineTerms !== false
                                  ? "bg-cyan-50 text-cyan-700 border border-cyan-100 hover:bg-cyan-100"
                                  : "bg-slate-50 text-slate-400 border border-slate-200 hover:bg-slate-100"
                              }`}
                              type="button"
                            >
                              {user.canDefineTerms !== false ? "امکان تعریف واژه" : "فاقد دسترسی"}
                            </button>
                          </td>

                          {/* Actions / Delete */}
                          <td className="p-3 text-center">
                            {isSupport ? (
                              <button
                                onClick={() => handleDeleteUser(user.username)}
                                disabled={user.username.toLowerCase() === "support"}
                                className={`p-1.5 rounded-lg text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all cursor-pointer ${
                                  user.username.toLowerCase() === "support" ? "cursor-not-allowed opacity-30" : ""
                                }`}
                                title="حذف کاربر"
                                type="button"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            ) : (
                              <span className="text-[9px] text-emerald-600 font-extrabold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
                                ذخیره خودکار
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {adminTab === "dashboard" ? (
        <div className="space-y-8 animate-fade-in text-right">
          
          {/* Active Directory Audit log & Active Sessions */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-600 animate-pulse" />
                <div>
                  <h3 className="font-black text-slate-800 text-sm">گزارش نشست‌ها و رهگیری زنده لاگ فعالیت کاربران (Active Directory Security Audits)</h3>
                  <p className="text-[10px] text-slate-400 font-bold">پایش لاگ زنده ورود، خروج و زمان دقیق تعامل کارشناسان با سامانه</p>
                </div>
              </div>
              <button
                onClick={fetchSessions}
                disabled={isLoadingSessions}
                className="text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoadingSessions ? "animate-spin" : ""}`} />
                بروزرسانی لاگ‌ها
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="p-3 font-bold">کاربر اکتیودایرکتوری</th>
                    <th className="p-3 font-bold">سمت و دپارتمان سازمانی</th>
                    <th className="p-3 font-bold">نقش امنیتی</th>
                    <th className="p-3 font-bold">زمان ورود (Login)</th>
                    <th className="p-3 font-bold">زمان خروج (Logout)</th>
                    <th className="p-3 font-bold">مدت زمان استفاده (Duration)</th>
                    <th className="p-3 font-bold">وضعیت نشست</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {sessions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-xs text-slate-400 font-bold">
                        هیچ لاگی مبنی بر ورود/خروج کاربران در پایگاه داده ثبت نگردیده است.
                      </td>
                    </tr>
                  ) : (
                    sessions.map((sess) => {
                      const isActive = !sess.logoutTime;
                      return (
                        <tr key={sess.id} className="hover:bg-indigo-50/30 transition-all font-medium">
                          <td className="p-3 font-black text-slate-800">
                            {sess.name}
                            <div className="text-[9px] text-slate-400 font-mono tracking-wide mt-0.5">{sess.username}</div>
                          </td>
                          <td className="p-3 text-slate-500">{sess.department}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${sess.role === "Admin" ? "bg-red-50 text-red-700 border border-red-100" : "bg-slate-100 text-slate-600"}`}>
                              {sess.role}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-slate-500" dir="ltr">
                            {new Date(sess.loginTime).toLocaleDateString("fa-IR")} - {new Date(sess.loginTime).toLocaleTimeString("fa-IR", {hour: '2-digit', minute:'2-digit'})}
                          </td>
                          <td className="p-3 font-mono text-slate-500" dir="ltr">
                            {sess.logoutTime ? (
                              `${new Date(sess.logoutTime).toLocaleDateString("fa-IR")} - ${new Date(sess.logoutTime).toLocaleTimeString("fa-IR", {hour: '2-digit', minute:'2-digit'})}`
                            ) : (
                              <span className="text-slate-300 italic font-sans">ثبت نشده</span>
                            )}
                          </td>
                          <td className="p-3 font-bold text-slate-800">
                            {formatDuration(sess.durationSeconds)}
                          </td>
                          <td className="p-3">
                            {isActive ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-100 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                آنلاین / فعال
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-400">
                                خاتمه یافته
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Project Management Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            
            {/* Create Project Form */}
            <div className="xl:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                <Plus className="h-5 w-5 text-indigo-600" />
                <h4 className="font-black text-slate-800 text-sm">تعریف پروژه ساختمانی به صورت دستی</h4>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block pb-1">نام پروژه (فارسی) <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={newProjNameFa}
                      onChange={(e) => setNewProjNameFa(e.target.value)}
                      placeholder="مثال: پروژه مگا مال تهران"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block pb-1">نام پروژه (انگلیسی) <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={newProjNameEn}
                      onChange={(e) => setNewProjNameEn(e.target.value)}
                      placeholder="e.g. Tehran Mega Mall Project"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-left"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block pb-1">محل اجرا</label>
                    <input
                      type="text"
                      value={newProjLocation}
                      onChange={(e) => setNewProjLocation(e.target.value)}
                      placeholder="مثال: تهران، اکباتان"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block pb-1">دسته‌بندی‌ها (کما سپریتور)</label>
                    <input
                      type="text"
                      value={newProjTags}
                      onChange={(e) => setNewProjTags(e.target.value)}
                      placeholder="مثال: بتن‌ریزی, سازه, تونل"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold block pb-1">شرح خدمات و محدوده کار (Scope)</label>
                  <textarea
                    rows={3}
                    value={newProjScope}
                    onChange={(e) => setNewProjScope(e.target.value)}
                    placeholder="شرح کارهای ابنیه، اسکلت، تصفیه خانه یا مهندسی..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block pb-1">کلمات کلیدی فارسی (تفکیک با کاما)</label>
                    <input
                      type="text"
                      value={newProjKeywordsFa}
                      onChange={(e) => setNewProjKeywordsFa(e.target.value)}
                      placeholder="کوبیاکس, سد, بتن ریزی سنگین"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block pb-1">کلمات کلیدی انگلیسی (تفکیک با کاما)</label>
                    <input
                      type="text"
                      value={newProjKeywordsEn}
                      onChange={(e) => setNewProjKeywordsEn(e.target.value)}
                      placeholder="cobiax, dam, heavy concrete"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-left"
                      dir="ltr"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  ذخیره و ثبت رسمی پروژه جدید
                </button>
              </form>
            </div>

            {/* Manual Projects List */}
            <div className="xl:col-span-7 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-indigo-600" />
                  <h4 className="font-black text-slate-800 text-sm">بانک پروژه‌های ثبت شده دستی ({projects.length})</h4>
                </div>
                <button
                  onClick={fetchProjects}
                  disabled={isLoadingProjects}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-indigo-600 transition-all cursor-pointer"
                  title="بازخوانی پروژه‌ها"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoadingProjects ? "animate-spin" : ""}`} />
                </button>
              </div>

              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {projects.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 font-bold">
                    در حال بارگذاری لیست پروژه‌های عمران آذرستان...
                  </div>
                ) : (
                  projects.map((proj) => (
                    <div key={proj.id} className="bg-slate-50 border border-slate-200 hover:border-indigo-200 rounded-xl p-3.5 transition-all relative group flex flex-col justify-between">
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pl-8">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full uppercase font-mono">
                              {proj.id}
                            </span>
                            <h5 className="font-black text-slate-800 text-xs">{proj.nameFa}</h5>
                            <span className="text-slate-300">|</span>
                            <span className="text-[10px] font-mono text-slate-400" dir="ltr">{proj.nameEn}</span>
                          </div>
                          <span className="text-[9px] text-slate-500 bg-slate-200 px-2 py-0.5 rounded-md font-bold">
                            {proj.location}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-600 leading-relaxed mb-3">
                          <strong>شرح خدمات:</strong> {proj.scope || "توضیحاتی برای این پروژه ثبت نشده است."}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-4 pt-2.5 border-t border-slate-200/60">
                        <div className="flex flex-wrap gap-1 items-center">
                          <span className="text-[9px] text-slate-400 font-bold">تگ‌ها:</span>
                          {proj.mainTags && proj.mainTags.map((tag: string, i: number) => (
                            <span key={i} className="text-[9px] bg-white text-slate-600 border border-slate-200 px-2 py-0.5 rounded font-bold">
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Delete action button */}
                        <button
                          onClick={() => handleDeleteProject(proj.id)}
                          className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-all cursor-pointer border border-transparent hover:border-red-100"
                          title="حذف دائمی پروژه"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
          
          {/* Navigation Sidebar */}
          <div className="lg:col-span-4 border-l border-slate-100 pl-4 space-y-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">پیشرفت نصب و راه‌اندازی</span>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-bold text-slate-700">وضعیت پیشرفت مستندسازی</span>
                <span className="font-mono text-brand-primary font-bold">{progressPercent}%</span>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              {stepsList.map(step => (
                <div 
                  key={step.id} 
                  className={`flex items-start gap-2 p-3 rounded-xl transition-all border ${
                    activeStep === step.id 
                      ? "bg-slate-50 border-slate-300 text-slate-900 shadow-sm" 
                      : "border-transparent text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {/* Custom Checkbox for progress */}
                  <button 
                    onClick={() => toggleStepCompleted(step.id)}
                    className={`mt-1 h-4 w-4 rounded border-2 shrink-0 flex items-center justify-center transition-all ${
                      completedSteps[step.id] 
                        ? "bg-indigo-600 border-indigo-600 text-white" 
                        : "border-slate-300 bg-white hover:border-slate-400"
                    }`}
                  >
                    {completedSteps[step.id] && <Check className="h-3 w-3" />}
                  </button>

                  {/* Step activator area */}
                  <button
                    onClick={() => setActiveStep(step.id)}
                    className="flex-1 text-right focus:outline-none"
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <span className="text-slate-400">{step.id}.</span>
                      {step.title}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{step.desc}</p>
                  </button>
                </div>
              ))}
            </div>

            {/* Quick Help Box */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3.5 text-xs text-blue-800 leading-relaxed font-semibold">
              <h4 className="font-bold text-blue-900 mb-1 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-blue-700" />
                رفع مشکل اتصال API:
              </h4>
              در صورتی که وب سرور با کدهای وضعیت ۲۰۰ اما حاوی پاسخ HTML بوت می‌شود، بررسی کنید که آیا متغیر وایپسی یا فایل‌های خروجی وایت با پوشه <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-900 font-mono">dist</code> تطابق دارد.
            </div>
          </div>

          {/* Dynamic Content Panel */}
          <div className="lg:col-span-8 space-y-6 text-right">
            
            {/* STEP 1: GENERAL SYSTEM REQUIREMENTS */}
            {activeStep === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-800">
                    <Cpu className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800">۱. نیازمندی‌های سخت‌افزاری و نرم‌افزاری محیط استقرار</h2>
                    <p className="text-xs text-slate-400 font-mono">Minimum & Recommended Infrastructure Specifications</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  این سامانه ترجمه و مدیریت واژه‌نامه‌ها از موتورهای پردازش آفلاین NLLB-200 و مدل‌های فشرده نویسه‌خوان (OCR Tesseract) استفاده می‌کند. مشخصات زیر توصیه می‌شود:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h4 className="font-bold text-xs text-slate-700 mb-2 flex items-center gap-1.5">
                      <Server className="h-4 w-4 text-slate-400" /> سیستم‌عامل سرور
                    </h4>
                    <ul className="text-xs text-slate-500 space-y-1.5 list-disc list-inside">
                      <li>Windows Server 2022 / 2025 (توصیه شده)</li>
                      <li>Red Hat Enterprise Linux 8+ / Rocky Linux</li>
                      <li>همگام با Active Directory محلی عمران آذرستان</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h4 className="font-bold text-xs text-slate-700 mb-2 flex items-center gap-1.5">
                      <Cpu className="h-4 w-4 text-slate-400" /> سخت‌افزار پردازش محلی (GPU)
                    </h4>
                    <ul className="text-xs text-slate-500 space-y-1.5 list-disc list-inside">
                      <li>CPU نسخه پردازشی Intel Xeon با حداقل ۸ هسته</li>
                      <li>بستر حافظه موقت (RAM) حداقل ۱۶ گیگابایت</li>
                      <li>کارت گرافیک NVIDIA RTX 3060 (توصیه پردازش عصبی متون)</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3.5 text-xs text-yellow-800 leading-relaxed font-semibold">
                  <strong>نکته مهم امنیتی:</strong> به علت نیازمندی امنیتی شرکت عمران آذرستان، ترافیک شبکه این برنامه در لایه تبادل واژه‌نامه محلی بوده و تمام فایل‌های آپلودی فقط در حافظه موقت RAM پردازش شده و ذخیره دائم نخواهند شد.
                </div>
              </div>
            )}

            {/* STEP 2: INSTALLATION & COMMAND-LINE SETUP */}
            {activeStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-800">
                    <Terminal className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800">۲. گام‌به‌گام نصب بسته‌ها و راه‌اندازی متغیرهای محیطی</h2>
                    <p className="text-xs text-slate-400 font-mono">NPM Packages Installation & Environment Builder</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    ابتدا مخزن توسعه نرم‌افزار را از گیت سازمان بارگیری کرده و بسته‌های پایه لایه وب و بک‌اند را با دستور زیر نصب کنید:
                  </p>

                  {/* Code Block */}
                  <div className="relative">
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto text-left" dir="ltr">
                      {`# کلون کردن مخزن برنامه به سرور توسعه عمران آذرستان\ngit clone http://git.azarestan-co.lan/translation/enterprise-hub.git\ncd enterprise-hub\n\n# نصب پکیج‌های پیش‌فرض سمت سرور و فرانت‌اند\nnpm install`}
                    </pre>
                    <button 
                      onClick={() => copyToClipboard(`git clone http://git.azarestan-co.lan/translation/enterprise-hub.git\ncd enterprise-hub\nnpm install`, "cl-bash")}
                      className="absolute top-3 right-3 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"
                    >
                      {copiedId === "cl-bash" ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  <div className="pt-4">
                    <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                      <Key className="h-4 w-4 text-indigo-600" /> سازنده فایل پیکربندی متغیرهای محیطی (.env)
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                      با پر کردن فیلدهای زیر، خروجی تنظیمات نهایی فایل تنظیمات را تولید نموده و در ریشه اصلی برنامه با نام <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-900 font-mono">.env</code> ذخیره کنید:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-right">
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold block pb-1">نام کاربری دیتابیس عمران آذرستان:</label>
                        <input 
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs px-2.5 py-2 focus:outline-none"
                          value={dbUser}
                          onChange={(e) => setDbUser(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold block pb-1">رمز عبور دیتابیس:</label>
                        <input 
                          type="password"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs px-2.5 py-2 focus:outline-none"
                          value={dbPass}
                          onChange={(e) => setDbPass(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold block pb-1">آدرس سرور دیتابیس لوکال:</label>
                        <input 
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs px-2.5 py-2 focus:outline-none"
                          value={dbHost}
                          onChange={(e) => setDbHost(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold block pb-1">کلید اتصال به هوش مصنوعی (Gemini API Key):</label>
                        <input 
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs px-2.5 py-2 focus:outline-none"
                          value={geminiKey}
                          onChange={(e) => setGeminiKey(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Generated ENV block */}
                    <div className="relative">
                      <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto text-left" dir="ltr">
                        {`PORT=3000\nNODE_ENV=production\nDATABASE_URL=postgresql://${dbUser}:${dbPass}@${dbHost}:5432/azarestan_trans\nGEMINI_API_KEY=${geminiKey}\nACTIVE_DIRECTORY_IP=10.10.1.5\nKERBEROS_REALM=AZARESTAN-CO.LAN`}
                      </pre>
                      <button 
                        onClick={() => copyToClipboard(`PORT=3000\nNODE_ENV=production\nDATABASE_URL=postgresql://${dbUser}:${dbPass}@${dbHost}:5432/azarestan_trans\nGEMINI_API_KEY=${geminiKey}\nACTIVE_DIRECTORY_IP=10.10.1.5\nKERBEROS_REALM=AZARESTAN-CO.LAN`, "cl-env")}
                        className="absolute top-3 right-3 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"
                      >
                        {copiedId === "cl-env" ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: DATABASE MIGRATION & CONFIG */}
            {activeStep === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-800">
                    <Database className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800">۳. آماده‌سازی ساختار دیتابیس عمران آذرستان</h2>
                    <p className="text-xs text-slate-400 font-mono">PostgreSQL Drizzle Schema & Table Setup</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  این سیستم از اوریست دیتابیس رابطه ای PostgreSQL جهت نگهداری تاریخچه ترجمه‌ها، لغت‌نامه‌های تخصصی عمران آذرستان و لاگ‌های امنیتی بخش فنی استفاده می‌نماید. جدول گلاسری با دستورالعمل زیر تعریف می‌شود:
                </p>

                {/* Code block for SQL scripts */}
                <div className="relative">
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto text-left" dir="ltr">
                    {`-- ایجاد ساختار جدول مدیریت لغت‌نامه‌ها (Glossary)\nCREATE TABLE IF NOT EXISTS glossary_terms (\n  id VARCHAR(50) PRIMARY KEY,\n  term VARCHAR(255) NOT NULL,\n  equivalent_en VARCHAR(255) NOT NULL,\n  equivalent_ru VARCHAR(255),\n  definition_fa TEXT,\n  definition_en TEXT,\n  definition_ru TEXT,\n  project VARCHAR(100) DEFAULT 'عمومی',\n  category VARCHAR(100) DEFAULT 'عمرانی',\n  author VARCHAR(150),\n  department VARCHAR(150),\n  verified BOOLEAN DEFAULT FALSE,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);`}
                  </pre>
                  <button 
                    onClick={() => copyToClipboard(`-- ایجاد ساختار جدول مدیریت لغت‌نامه‌ها (Glossary)\nCREATE TABLE IF NOT EXISTS glossary_terms (\n  id VARCHAR(50) PRIMARY KEY,\n  term VARCHAR(255) NOT NULL,\n  equivalent_en VARCHAR(255) NOT NULL,\n  equivalent_ru VARCHAR(255),\n  definition_fa TEXT,\n  definition_en TEXT,\n  definition_ru TEXT,\n  project VARCHAR(100) DEFAULT 'عمومی',\n  category VARCHAR(100) DEFAULT 'عمرانی',\n  author VARCHAR(150),\n  department VARCHAR(150),\n  verified BOOLEAN DEFAULT FALSE,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);`, "cl-sql")}
                    className="absolute top-3 right-3 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"
                  >
                    {copiedId === "cl-sql" ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-2">
                  <h4 className="font-bold text-xs text-slate-700 mb-2">دستور اجرای خودکار مایگریشن در سمت وب‌سرور:</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mb-3">
                    ما از اورم Drizzle یا Prisma به صورت پیش‌فرض استفاده می‌کنیم. برای اجرای همگام‌سازی طرحواره دیتابیس، ترمینال را در پوشه پروژه باز نموده و دستور زير را اجرا نمایید:
                  </p>
                  <div className="bg-slate-950 p-2 text-rose-300 font-mono text-xs rounded border border-slate-800 text-left" dir="ltr">
                    npm run db:push
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: ACTIVE DIRECTORY INTEGRATION */}
            {activeStep === 4 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-800">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800">۴. تنظیمات یکپارچه‌سازی با سرویس Active Directory</h2>
                    <p className="text-xs text-slate-400 font-mono">Kerberos Single Sign-On Server Authentication</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  برقراری ارتباط با وب‌سرویس Active Directory دپارتمان فناوری اطلاعات عمران آذرستان بر پایه معماری امنیتی Kerberos صورت می‌گیرد. این ارتباط دسترسی به این برنامه را بر اساس نقش‌های تعریف شده مشخص می‌کند:
                </p>

                <div className="border border-slate-150 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-right">
                    <thead className="bg-slate-50 text-slate-700 border-b border-slate-100">
                      <tr>
                        <th className="p-2.5 font-bold">نقش سامانه عمران آذرستان</th>
                        <th className="p-2.5 font-bold">شناسه گروه در اکتیو دایرکتوری</th>
                        <th className="p-2.5 font-bold">سطوح دسترسی اعمال شده</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      <tr>
                        <td className="p-2.5 font-bold text-indigo-600">Admin</td>
                        <td className="p-2.5 font-mono text-[10px]">CN=TR_Admins,OU=TranslationHub,DC=azarestan-co,DC=lan</td>
                        <td className="p-2.5">دسترسی عمومی، ویرایش ترم‌ها، مدیریت فنی، مشاهده لاگ</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-slate-800">Translator</td>
                        <td className="p-2.5 font-mono text-[10px]">CN=TR_Editors,OU=TranslationHub,DC=azarestan-co,DC=lan</td>
                        <td className="p-2.5">ترجمه اسناد صوتی، ویرایش، ثبت کلمات تخصصی در گلاسری</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-slate-500">DeptManager</td>
                        <td className="p-2.5 font-mono text-[10px]">CN=TR_Managers,OU=TranslationHub,DC=azarestan-co,DC=lan</td>
                        <td className="p-2.5">مشاهده زنده داشبورد نظارت، تحلیل نمودار ترافیک دپارتمانی</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Interactive test panel */}
                <div className="bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold font-mono text-cyan-400">امکان ابزاری تست زنده ارتباط AD سیمولاتور عمران آذرستان:</span>
                    <button 
                      disabled={testingAD}
                      onClick={runSimulatedADTest}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${testingAD ? 'animate-spin' : ''}`} />
                      تست ارتباط
                    </button>
                  </div>

                  <div className="font-mono text-xs space-y-1 bg-black p-3 rounded-lg max-h-40 overflow-y-auto text-left" dir="ltr">
                    {adTestOutput.length === 0 ? (
                      <span className="text-slate-500 italic">برای عیب‌یابی و آزمایش همگام‌سازی، دکمه بالا را کلیک کنید...</span>
                    ) : (
                      adTestOutput.map((l, idx) => (
                        <div key={idx} className={l.startsWith("✔") || l.startsWith("🎉") ? "text-green-400" : "text-slate-300"}>
                          {l}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: DEPLOYMENT WITH PM2 & WINDOWS SERVICES */}
            {activeStep === 5 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-800">
                    <Server className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800">۵. پایداری با استفاده از PM2 و وب‌سرورهای داخلی عمران آذرستان</h2>
                    <p className="text-xs text-slate-400 font-mono">PM2 Process Manager & Windows Daemon Setup</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  متدولوژی اجرای وب‌سایت در بستر لینوکسی به وسیله پکیج مدیریت پردازه <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-900 font-mono">PM2</code> یا مانیتورینگ <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-900 font-mono">systemd</code> گنجانده شده است. دستورهای استاندارد به شرح زیر است:
                </p>

                {/* Code blocks for PM2 */}
                <div className="relative">
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto text-left" dir="ltr">
                    {`# ۱. نصب سراسری بسته PM2 روی سرور\nnpm install pm2 -g\n\n# ۲. کامپایل نهایی پروژه لایه فرانت‌اند و بک‌اند بک‌پورت\nnpm run build\n\n# ۳. آغاز فعالیت برنامه روی پورت ۳۰۰۰ تحت نام انتخابی عمران آذرستان\npm2 start server.ts --name "azarestan-translator" --interpreter ./node_modules/.bin/tsx\n\n# ۴. ذخیره وضعیت پردازه در حافظه سرویس استارت‌آپ سیستم\npm2 save`}
                  </pre>
                  <button 
                    onClick={() => copyToClipboard(`npm install pm2 -g\nnpm run build\npm2 start server.ts --name "azarestan-translator" --interpreter ./node_modules/.bin/tsx\npm2 save`, "cl-pm2")}
                    className="absolute top-3 right-3 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"
                  >
                    {copiedId === "cl-pm2" ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3.5 text-xs text-yellow-800 leading-relaxed font-semibold">
                  <strong>پیگیری خودکار مانیتورینگ:</strong> جهت ارزیابی پردازش فشرده و بررسی بارگذاری‌های سنگین اسناد وازه‌نامه روی حافظه سرور، می‌توانید به تب <code>داشبورد نظارت و عملکرد سیستم</code> مراجعه فرمایید که نمودار زنده ترافیک و مانیتورینگ را به صورت چارت گرافیکی نمایش می‌دهد.
                </div>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
