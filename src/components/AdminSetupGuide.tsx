import React, { useState } from "react";
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
  RefreshCw 
} from "lucide-react";

export function AdminSetupGuide() {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
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
      "🔄 اتصال به وب‌سرور Active Directory کایسون (10.10.1.5)...",
      "🔑 بررسی توکن سرویس Kerberos (Service Principal)...",
      "✔ اتصال برقرار شد. برقراری نشست با LDAP کایسون...",
      "🔍 جستجوی کاربر نمونه: m.esmaeili.admin...",
      "✔ کاربر پیدا شد: مهدی اسماعیلی | نقش: Admin | دپارتمان: مدیریت پروژه",
      "🎉 تست یکپارچگی فعال کایسون با موفقیت با وضعیت OK به پایان رسید!"
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

  const stepsList = [
    {
      id: 1,
      title: "نیازمندی‌ها و محیط سه‌گانه",
      icon: <Cpu className="h-5 w-5" />,
      desc: "بررسی پیش‌نیازهای سخت‌افزاری و نرم‌افزاری شبکه کایسون"
    },
    {
      id: 2,
      title: "نصب بسته‌ها و مخزن گیت",
      icon: <Terminal className="h-5 w-5" />,
      desc: "نصب بسته‌های npm، راه‌اندازی فایل‌های ساختاری و متغیرها"
    },
    {
      id: 3,
      title: "دیتابیس ابری و لوکال کایسون",
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
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <ShieldCheck className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-red-800 font-bold text-sm">بخش امنیتی سرپرست سیستم (Admin Panel Only)</h3>
          <p className="text-red-700 text-xs mt-1 leading-relaxed">
            کاربر گرامی، این بخش شامل آموزش کامل استقرار و راه‌اندازی فرآیندهای پس‌زمینه، دیتابیس لوکال کایسون و نحوه هماهنگ‌سازی با Active Directory شرکت کایسون می‌باشد. این آموزش فقط برای نقش <strong>مدیر سیستم (Admin)</strong> در دسترس است.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-4 border-l border-slate-100 pl-4 space-y-4">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">پیشرفت نصب و راه‌اندازی</span>
            <div className="flex justify-between items-center text-xs mb-1.5 focus:outline-none">
              <span className="font-bold text-slate-700">وضعیت پیشرفت مستندسازی</span>
              <span className="font-mono text-brand-primary font-bold">{progressPercent}%</span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div 
                className="bg-brand-primary h-2 rounded-full transition-all duration-300"
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
                      ? "bg-brand-primary border-brand-primary text-white" 
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
        <div className="lg:col-span-8 space-y-6">
          
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
                    <Key className="h-4 w-4 text-brand-primary" /> سازنده فایل پیکربندی متغیرهای محیطی (.env)
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                    با پر کردن فیلدهای زیر، خروجی تنظیمات نهایی فایل تنظیمات را تولید نموده و در ریشه اصلی برنامه با نام <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-900 font-mono">.env</code> ذخیره کنید:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
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
                      <td className="p-2.5 font-bold text-brand-primary">Admin</td>
                      <td className="p-2.5 font-mono">CN=TR_Admins,OU=TranslationHub,DC=azarestan-co,DC=lan</td>
                      <td className="p-2.5">دسترسی عمومی، ویرایش ترم‌ها، مدیریت فنی، مشاهده لاگ</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-800">Translator</td>
                      <td className="p-2.5 font-mono">CN=TR_Editors,OU=TranslationHub,DC=azarestan-co,DC=lan</td>
                      <td className="p-2.5">ترجمه اسناد صوتی، ویرایش، ثبت کلمات تخصصی در گلاسری</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-500">DeptManager</td>
                      <td className="p-2.5 font-mono">CN=TR_Managers,OU=TranslationHub,DC=azarestan-co,DC=lan</td>
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
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary hover:bg-brand-secondary text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
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

    </div>
  );
}
