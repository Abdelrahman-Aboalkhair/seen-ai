# Environment Variables Checklist

This document lists ALL environment variables you need to set for your Smart Recruiter application.

## 📍 **FRONTEND (Client-Side) Environment Variables**

### **Location:** `.env.local` file in your project root

### **Required Variables:**

```bash
# Supabase Configuration (REQUIRED)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### **Optional Variables:**

```bash
# App Configuration (Optional - have defaults)
VITE_APP_URL=http://localhost:5173
VITE_APP_NAME=Smart Recruiter
VITE_APP_VERSION=1.0.0

# External APIs (Optional - for client-side features)
VITE_OPENAI_API_KEY=your-openai-api-key
VITE_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
```

---

## 📍 **SUPABASE EDGE FUNCTIONS Environment Variables**

### **Location:** Supabase Dashboard → Settings → Edge Functions

### **Required Variables (All Functions):**

```bash
# Supabase Configuration (REQUIRED for all functions)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### **Function-Specific Variables:**

#### **CV Analysis Function:**

```bash
OPENAI_API=your-openai-api-key-here
```

#### **Job Requirements Generator Function:**

```bash
OPENAI_API=your-openai-api-key-here
```

#### **Process Payment Function:**

```bash
STRIPE_SECRET_KEY=your-stripe-secret-key-here
```

#### **Talent Search Function:**

```bash
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/endpoint
```

### **Optional Variables:**

```bash
# Environment Detection
ENVIRONMENT=production

# Override Default API URLs (optional)
OPENAI_BASE_URL=https://api.openai.com/v1
STRIPE_BASE_URL=https://api.stripe.com/v1
```

---

## 📍 **VERCEL DEPLOYMENT Environment Variables**

### **Location:** Vercel Dashboard → Project Settings → Environment Variables

### **Production Variables:**

```bash
# Supabase Configuration (REQUIRED)
VITE_SUPABASE_URL=https://your-production-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key

# App Configuration
VITE_APP_URL=https://yourdomain.com
VITE_APP_NAME=Smart Recruiter
VITE_APP_VERSION=1.0.0

# External APIs (if needed on client-side)
VITE_OPENAI_API_KEY=your-production-openai-key
VITE_STRIPE_PUBLISHABLE_KEY=your-production-stripe-key
```

---

## 🔧 **SETUP INSTRUCTIONS**

### **Step 1: Frontend Environment (.env.local)**

1. Create `.env.local` file in your project root:

```bash
cp env.example .env.local
```

2. Edit `.env.local` with your values:

```bash
# Required
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional
VITE_APP_URL=http://localhost:5173
VITE_APP_NAME=Smart Recruiter
VITE_APP_VERSION=1.0.0
```

### **Step 2: Supabase Edge Functions**

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Edge Functions**
3. Add each environment variable:

```bash
# Required for all functions
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Function-specific
OPENAI_API=your-openai-api-key
STRIPE_SECRET_KEY=your-stripe-secret-key
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/endpoint

# Optional
ENVIRONMENT=production
```

### **Step 3: Vercel Deployment**

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add production variables:

```bash
VITE_SUPABASE_URL=https://your-production-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
VITE_APP_URL=https://yourdomain.com
```

---

## 🔍 **WHERE TO FIND YOUR VALUES**

### **Supabase Values:**

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** → `VITE_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

### **OpenAI API Key:**

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Use for both frontend and edge functions

### **Stripe Keys:**

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Copy:
   - **Publishable key** → `VITE_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** → `STRIPE_SECRET_KEY`

### **N8N Webhook URL:**

1. Your N8N instance webhook endpoint
2. Format: `https://your-n8n-instance.com/webhook/endpoint`

---

## ✅ **VERIFICATION CHECKLIST**

### **Frontend (.env.local):**

- [ ] `VITE_SUPABASE_URL` is set
- [ ] `VITE_SUPABASE_ANON_KEY` is set
- [ ] App starts without errors: `npm run dev`

### **Supabase Edge Functions:**

- [ ] `SUPABASE_URL` is set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set
- [ ] `OPENAI_API` is set (for CV analysis & job requirements)
- [ ] `STRIPE_SECRET_KEY` is set (for payments)
- [ ] `N8N_WEBHOOK_URL` is set (for talent search)

### **Vercel Production:**

- [ ] All frontend variables are set
- [ ] Production URL is correct
- [ ] Deployment succeeds

---

## 🚨 **IMPORTANT NOTES**

1. **Never commit `.env.local`** to version control
2. **Use different keys** for development and production
3. **Service role key** should only be used in edge functions, never in frontend
4. **Publishable keys** are safe for frontend use
5. **Secret keys** should only be used in edge functions

---

## 🧪 **TESTING**

After setting up all variables:

1. **Test Frontend:**

   ```bash
   npm run dev
   # Should start without errors
   ```

2. **Test Edge Functions:**

   ```bash
   supabase functions serve
   # Test each function individually
   ```

3. **Test Production:**
   ```bash
   npm run build:prod
   # Should build successfully
   ```

---

**Need Help?** Check the logs in your browser console and Supabase function logs for any missing variables.
