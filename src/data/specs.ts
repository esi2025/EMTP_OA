export interface SpecSection {
  id: string;
  titleFa: string;
  titleEn: string;
  contentFa: string;
  contentEn: string;
}

export const technicalSpecs: SpecSection[] = [
  {
    id: "architecture",
    titleFa: "۱. معماری کلان سیستم (Architecture)",
    titleEn: "1. System Microservices Architecture",
    contentFa: `سامانه روی سیستم‌عامل Windows Server 2025 با ساختار زیر پیاده‌سازی می‌گردد:

[مرورگر کاربر نهایی] 
        | (پورت 443 - HTTPS)
        v
[پروکسی معکوس Nginx] 
        | 
        v
[وب‌سرور ASP.NET Core API - پورت 5000]
   |--> ذخیره و بازیابی داده‌ها --> [دیتابیس PostgreSQL - پورت 5432]
   |--> مدیریت نشست‌ها و کشینگ --> [حافظه موقت Redis - پورت 6379]
   |--> تصدیق هویت کاربران --> [سرویس اکتیو دایرکتوری - LDAPS پورت 636]
   | 
   |--> فراخوانی خدمات هوش مصنوعی (مدل‌های ترکیبی)
         |
         +--> [میکروسرویس‌های پایتون FastAPI - پورت 8000]
               |--> مدل NLLB-200 محلی (ترجمه متون تخصصی)
               |--> مدل Whisper محلی (تبدیل گفتار به متن)
               |--> پردازش و جستجوی معنایی واژه‌نامه --> [پایگاه داده برداری Qdrant - پورت 6333]
         |
         +--> درگاه ابری (External APIs)
               |--> سرویس ابری Google Translation API & Gemini 3.5 Flash
               |--> سرویس تجاری OpenAI GPT-4o / DeepL API`,
    contentEn: `The platform is structured as a robust multi-tier on-premise system hosted on Windows Server 2025:

[User Web Browser]
       ^
       | (Port 443 - HTTPS)
       v
[Nginx Reverse Proxy Layer]
       ^
       | (Internal Gateway Proxying)
       v
[ASP.NET Core Web API Host (Port 5000)]
   |
   |---> Relational Schema & Audits ---> [PostgreSQL Database (Port 5432)]
   |---> Transient Session Cache & Tokens ---> [Redis Instance (Port 6379)]
   |---> Enterprise Network SSO Hook ---> [Active Directory Domain Controller (LDAPS 636)]
   |
   |---> Hybrid AI Orchestrator Layer
           |
           +---> Local Microservices (Python FastAPI on Port 8000)
           |       |--> NLLB-200 Offline Translation Engine
           |       |--> Whisper Speech-To-Text GPU Host
           |       |--> Terminology Search Semantic Embeddings ---> [Qdrant Vector DB (Port 6333)]
           |
           +---> External Commercial Cloud Gateways
                   |--> Gemini 3.5 Flash Pipeline
                   |--> OpenAI GPT-4o & DeepL Enterprise API`
  },
  {
    id: "db-schema",
    titleFa: "۲. شمای دیتابیس (Database Schema DDL)",
    titleEn: "2. Relational Database Schema (PostgreSQL)",
    contentFa: `-- جدول کاربران متصل به اکتیو دایرکتوری روی دیتابیس عمران آذرستان
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    fullname VARCHAR(250) NOT NULL,
    email VARCHAR(250) UNIQUE,
    department VARCHAR(150),
    role VARCHAR(50) NOT NULL DEFAULT 'User', -- Admin, Translator, DeptManager, User
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- جدول مدیریت واژه‌نامه تخصصی صنعت عمران (جداول گلاسری)
CREATE TABLE glossary (
    id SERIAL PRIMARY KEY,
    farsi_term VARCHAR(300) NOT NULL,
    english_equivalent VARCHAR(300) NOT NULL,
    russian_equivalent VARCHAR(300),
    definition_fa TEXT,
    definition_en TEXT,
    definition_ru TEXT,
    status VARCHAR(50) DEFAULT 'approved', -- pending, approved
    project_scope VARCHAR(150), -- نام پروژه عمرانی مربوطه
    department_scope VARCHAR(150),
    category VARCHAR(100),
    version INT DEFAULT 1,
    author_id INT REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- جدول ثبت تراکنش‌ها و حسابرسی سیستم (Audit & Analytics Logs)
CREATE TABLE translation_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    source_language VARCHAR(10) NOT NULL,
    target_language VARCHAR(10) NOT NULL,
    original_text_length INT NOT NULL,
    engine_used VARCHAR(50) NOT NULL,
    duration_ms INT NOT NULL,
    category_tag VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`,
    contentEn: `-- PostgreSQL Schema Definition for Azarestan Enterprise Translator
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    fullname VARCHAR(250) NOT NULL,
    email VARCHAR(250) UNIQUE,
    department VARCHAR(150),
    role VARCHAR(50) NOT NULL DEFAULT 'User', -- Admin, Translator, DeptManager, User
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Glossary and Construction Specialized Terminology Table
CREATE TABLE glossary (
    id SERIAL PRIMARY KEY,
    farsi_term VARCHAR(300) NOT NULL,
    english_equivalent VARCHAR(300) NOT NULL,
    russian_equivalent VARCHAR(300),
    definition_fa TEXT,
    definition_en TEXT,
    definition_ru TEXT,
    status VARCHAR(50) DEFAULT 'approved',
    project_scope VARCHAR(150),
    department_scope VARCHAR(150),
    category VARCHAR(100),
    version INT DEFAULT 1,
    author_id INT REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transaction Telemetry & System Performance Logs Table
CREATE TABLE translation_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    source_language VARCHAR(10) NOT NULL,
    target_language VARCHAR(10) NOT NULL,
    original_text_length INT NOT NULL,
    engine_used VARCHAR(50) NOT NULL,
    duration_ms INT NOT NULL,
    category_tag VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`
  },
  {
    id: "api-specs",
    titleFa: "۳. مشخصات فنی واسط برنامه‌نویسی (API Specifications)",
    titleEn: "3. API Endpoints & Specifications (Swagger)",
    contentFa: `مشخصات متدهای پرکاربرد سامانه به صورت زیر است:

### ۱. متد ترجمه متن (Translation Service)
* **آدرس:** \`POST /api/v1/translation/translate\`
* **درخواست:**
\`\`\`json
{
  "text": "بتن‌ریزی فونداسیون شفت جنوبی شروع شد.",
  "sourceLanguage": "fa",
  "targetLanguage": "en",
  "enginePreference": "SeamlessM4T",
  "departmentTag": "تولید بتن"
}
\`\`\`
* **پاسخ:** \`200 OK\`
\`\`\`json
{
  "translatedText": "Foundation concrete pouring of the south shaft has commenced.",
  "engineUsed": "SeamlessM4T",
  "processingTimeMs": 420,
  "charactersCount": 42,
  "systemStatus": "Success"
}
\`\`\`

### ۲. واژه‌نامه تخصصی (Glossary Post)
* **آدرس:** \`POST /api/v1/glossary/terms\`
* **درخواست:** ایجاد ردیف اصطلاح جدید عمرانی با تگ پروژه.
* **پاسخ:** بازگشت شناسه تولیدی واژه‌نامه تخصصی.`,
    contentEn: `List of the primary endpoints configured on our ASP.NET Web API gateway:

### 1. Execute Translation Task
* **Route:** \`POST /api/v1/translation/translate\`
* **Request Payload:**
\`\`\`json
{
  "text": "بتن‌ریزی فونداسیون شفت جنوبی شروع شد.",
  "sourceLanguage": "fa",
  "targetLanguage": "en",
  "enginePreference": "SeamlessM4T",
  "departmentTag": "Concrete Production"
}
\`\`\`
* **Response Output:** \`200 OK\`
\`\`\`json
{
  "translatedText": "Foundation concrete pouring of the south shaft has commenced.",
  "engineUsed": "SeamlessM4T",
  "processingTimeMs": 420,
  "charactersCount": 42,
  "systemStatus": "Success"
}
\`\`\`

### 2. Append Terminology Glossary Row
* **Route:** \`POST /api/v1/glossary/terms\`
* **Access Level:** Translator / Administrator`
  },
  {
    id: "docker-config",
    titleFa: "۴. پیکربندی داکر (Docker Compose)",
    titleEn: "4. Multi-Container Orchestration (Docker Compose)",
    contentFa: `فایل \`docker-compose.yml\` برای اجرای یکپارچه خدمات ترجمه در زیر آمده است:

\`\`\`yaml
version: '3.8'

services:
  nginx-proxy:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - backend-api

  backend-api:
    image: azarestan/translation-api:latest
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - ConnectionStrings__PostgreSQL=Host=postgres-db;Database=azarestan_trans;Username=admin;Password=AzarestanPass151
      - Redis__Configuration=redis-cache:6379
      - ActiveDirectory__Domain=azarestan-co.com
      - AI__FastAPIGateway=http://fastapi-ai:8000
    depends_on:
      - postgres-db
      - redis-cache

  fastapi-ai:
    image: azarestan/translation-ai-microservice:latest
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]

  postgres-db:
    image: postgres:15
    environment:
      POSTGRES_DB: azarestan_trans
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: AzarestanPass151

  redis-cache:
    image: redis:alpine
\`\`\``,
    contentEn: `The \`docker-compose.yml\` orchestrating the civil translation infrastructure, localized AI hosts, and cache storage:

\`\`\`yaml
version: '3.8'

services:
  nginx-proxy:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - backend-api

  backend-api:
    image: azarestan/translation-api:latest
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - ConnectionStrings__PostgreSQL=Host=postgres-db;Database=azarestan_trans;Username=admin;Password=AzarestanPass151
      - Redis__Configuration=redis-cache:6379
      - ActiveDirectory__Domain=azarestan-co.com
      - AI__FastAPIGateway=http://fastapi-ai:8000
    depends_on:
      - postgres-db
      - redis-cache

  fastapi-ai:
    image: azarestan/translation-ai-microservice:latest
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]

  postgres-db:
    image: postgres:15
    environment:
      POSTGRES_DB: azarestan_trans
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: AzarestanPass151

  redis-cache:
    image: redis:alpine
\`\`\``
  },
  {
    id: "deployment-guide",
    titleFa: "۵. راهنمای استقرار در سرور ویندوز (Windows Deployment)",
    titleEn: "5. Windows Server Deployment & IIS Strategy",
    contentFa: `مراحل استقرار سامانه در سرور ویندوز ۲۰۲۵ متصل به شبکه داخلی شرکت:

1. **نصب ملزومات ماشین سرور:**
   - نصب ابزار WSL 2 و بستر Docker Desktop برای ویندوز سرور.
   - نصب افزونه NVIDIA Container Toolkit جهت فعال‌سازی شتاب‌دهنده سخت‌افزاری پردازشگر گرافیکی (GPU) برای میکروسرویس‌های Whisper و NLLB-200.
2. **برپایی وب‌سرور مکملی (Reverse Proxy):**
   - پیکربندی آدرس دامنه محلی شرکت (\`translate.azarestan.local\`) و بارگذاری گواهی‌نامه محلی SSL.
   - هدایت ترافیک در پورت ۸۰ به پورت ایمن ۴۴۳ و سپس هدایت داخلی به کانتینر درگاه اصلی پورت ۵۰۰۰.
3. **همگام‌سازی اکتیو دایرکتوری:**
   - تعریف دسترسی‌های کاربران از روی OUهای مشخص شده عمران آذرستان.`,
    contentEn: `Step-by-step instructions for installing on Windows Server 2025 inside Azarestan Corporate Network:

1. **Server Machine Requirements:**
   - Enable WSL 2 (Windows Subsystem for Linux) and Docker Desktop for Windows Server.
   - Install NVIDIA Container Toolkit to bridge the host GPU to the Whisper / NLLB microservice container for instant low-latency speech translation.
2. **Reverse Proxy Configuration (Nginx):**
   - Setup a local domain DNS entry (\`translate.azarestan.local\`) pointing to the local server IP.
   - Bind IIS or Nginx to port 80/443, configure self-signed or enterprise CA SSL certificates, and proxy downstream traffic to target containers.
3. **Domain Sync:**
   - Link with Azarestan AD domain controller using LDAP/LDAPS.`
  },
  {
    id: "security-checklist",
    titleFa: "۶. چک‌لیست امنیت اطلاعات (Security Audit)",
    titleEn: "6. Enterprise Security and RBAC Checklist",
    contentFa: `چک‌لیست ده‌گانه راستی‌آزمایی امنیت اطلاعات در بستر عمران آذرستان:

* [✔] **اتصال امن HTTPS:** کلیه تبادلات روی پروتکل TLS 1.3 انجام می‌گیرد.
* [✔] **اعتبارسنجی با Active Directory:** عدم ذخیره‌سازی رمزهای عبور کاربران در دیتابیس لوکال و احراز هویت از طریق LDAP امن.
* [✔] **مدیریت نقش‌ها (RBAC):** سطوح دسترسی شامل راهبرسی، مترجمان برای تایید نهایی اصطلاحات و مهندسان ناظر برای مشاهده.
* [✔] **محدودسازی نرخ فراخوانی (Rate Limiting):** برپایی توکن باکِت در سطح گیت‌وی به منظور دفع حملات منع سرویس توزیع شده (DDoS).
* [✔] **رمزنگاری در حال سکون (At-Rest Encryption):** پایگاه‌های داده PostgreSQL با کلیدهای AES-256 رمزنگاری درایو ویندوز (BitLocker) محافظت می‌شوند.
* [✔] **امنیت توکن‌های JWT:** استفاده از الگوریتم امضای نامتقارن RS256 برای تایید درستی امضای دیجیتال توکن‌های نشست کاربر.`,
    contentEn: `Key items of Enterprise Security & Data Encryption implemented in the system:

* [✔] **Transport Layer Security:** Complete system operations are bound to HTTPS using TLS 1.3 standard.
* [✔] **Active Directory SSO Validation:** No local storage of user passwords; all validations run on encrypted LDAPS protocol.
* [✔] **Role-Based Access Control (RBAC):** Strict boundaries between general engineers, department managers, translators, and administrators.
* [✔] **Gateway Rate Limiting:** Configured on Nginx proxy to protect local GPU infrastructure from concurrent usage spikes.
* [✔] **Data Encryption at Rest:** PostgreSQL database files and cached documents secured with BitLocker AES-256 drive encryption.
* [✔] **Session JWT Security:** Tokens signed using RS256 asymmetric keys with a configurable 12-hour automated expiration.`
  },
  {
    id: "disaster-recovery",
    titleFa: "۷. طرح پشتیبان‌گیری و تداوم عملیات (Backup & DB Recovery)",
    titleEn: "7. Incremental Backup & Disaster Recovery Blueprint",
    contentFa: `طرح جامع تداوم کسب و کار به منظور جلوگیری از دست رفتن تلاش‌های مترجمین:

1. **پشتیبان‌گیری از دیتابیس رابطه‌ای (پایگاه داده واژه‌نامه مترجمین):**
   - پشتیبان‌گیری تماماً incremental روزانه در ساعت ۲ بامداد روی سرور فایل مجهز به RAID-5 به کمک ابزار \`pg_dump\`.
   - اسکریپت خودکار زیر روی سرور اجرا می‌شود:
   \`\`\`bash
   pg_dump -U admin -h localhost azarestan_trans | gzip > D:/db_backups/azarestan_$(date +%F).sql.gz
   \`\`\`
2. **پشتیبان‌گیری از واژگان برداری (Qdrant Database):**
   - ایجاد اسنپ‌شات هفتگی از فایل‌های ایندکس برداری به منظور بازیابی سریع ساختار جستجوی واژه‌ها.
3. **امتحان طرح بازیابی (Recovery Testing):**
   - پیاده‌سازی آزمایشی شبیه‌سازی سناریوی تخریب سرور اصلی هر ۶ ماه یکبار روی یک کلون جداگانه برای بازیابی مطمئن داده‌ها در کمتر از ۲ ساعت.`,
    contentEn: `Our multi-layered business continuity plan to avoid data loss on specialized construction vocabulary:

1. **Relational Database Backups:**
   - Daily incremental snapshotting configured at 2:00 AM using \`pg_dump\` on PostgreSQL. Backups are exported to an isolated corporate NAS.
   - Script executing under task scheduler of Windows Server:
   \`\`\`bash
   pg_dump -U admin -h localhost azarestan_trans | gzip > D:/db_backups/azarestan_$(date +%F).sql.gz
   \`\`\`
2. **Vector Index snap-shots:**
   - Weekly vector backups of Qdrant collection vectors to ensure search capabilities are preserved.
3. **Disaster Recovery (DR) testing:**
   - Dry runs conducted bi-annually on staging environments to confirm a recovery time objective (RTO) of less than 2 hours.`
  }
];
