# 🚀 Deployment Guide - Vercel & Textbelt Setup

## 📋 Prerequisites

1. **GitHub Account** - Repository connected to GitHub
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
3. **Textbelt API Key** - Get from [textbelt.com](https://textbelt.com)
4. **Neon PostgreSQL** - Already configured (from .env)

---

## 🔧 Step 1: Textbelt Setup

### 1.1 Get API Key
1. Visit [textbelt.com](https://textbelt.com)
2. Click **"Get API Key"**
3. Purchase credits:
   - $10 = ~75 international SMS
   - $25 = ~190 international SMS
   - $50 = ~380 international SMS
4. Copy your API key (format: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

### 1.2 Test API Key
```bash
# Test with your API key
curl -X POST https://textbelt.com/text \
  -d phone=+60123456789 \
  -d message="Test from Textbelt" \
  -d key=YOUR_API_KEY_HERE
```

Expected response:
```json
{
  "success": true,
  "textId": "12345678901234567",
  "quotaRemaining": 75
}
```

---

## ☁️ Step 2: Deploy to Vercel

### 2.1 Connect Repository
1. Login ke [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Import repository: `Faizzz7348/sms-gateway`
4. Configure project:
   - **Framework Preset**: Other
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/public`
   - **Install Command**: `npm install`

### 2.2 Add Environment Variables

In Vercel Project Settings → Environment Variables, add:

```bash
# Database
DATABASE_URL=postgresql://neondb_owner:npg_vydkjA10PDnV@ep-dawn-dust-a4cz4abn-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

PGHOST=ep-dawn-dust-a4cz4abn-pooler.us-east-1.aws.neon.tech
PGDATABASE=neondb
PGUSER=neondb_owner
PGPASSWORD=npg_vydkjA10PDnV
PGSSLMODE=require
PGCHANNELBINDING=require

# Session (CHANGE THIS!)
SESSION_SECRET=generate-random-secret-here-change-this

# Node Environment
NODE_ENV=production
```

### 2.3 Generate Secure Session Secret
```bash
# Generate random session secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy output dan set sebagai `SESSION_SECRET`

### 2.4 Deploy
Click **"Deploy"** button. Vercel akan:
1. ✅ Install dependencies
2. ✅ Build application
3. ✅ Deploy to production
4. ✅ Provide URL (e.g., `https://sms-gateway-xxx.vercel.app`)

---

## 🔐 Step 3: Configure Application

### 3.1 Login
1. Visit your Vercel URL
2. Enter password: **`Acun97`**

### 3.2 Configure Settings
1. Navigate to **Settings** page
2. Fill in:
   - **API Key**: Your Textbelt API key
   - **API Endpoint**: `https://textbelt.com/text` (auto-filled)
   - **Default Country Code**: `+60` (Malaysia)
3. Click **Save Settings**

### 3.3 Test SMS
1. Go to **Compose** page
2. Enter:
   - **Phone**: `0123456789` (or with +60)
   - **Message**: Test message
3. Click **Send**
4. Check **Message History** for status

---

## 🛠️ Troubleshooting

### Issue: "API key not configured"
**Solution**: Go to Settings and enter your Textbelt API key

### Issue: "Invalid API endpoint" (404)
**Solution**: Ensure endpoint is `https://textbelt.com/text` (not `/intl`)

### Issue: "Insufficient credits"
**Solution**: 
1. Check quota: `curl https://textbelt.com/quota/YOUR_API_KEY`
2. Purchase more credits at [textbelt.com](https://textbelt.com)

### Issue: "Invalid phone number"
**Solution**: 
- Ensure phone has country code (+60 for Malaysia)
- Format: `+60123456789` or `0123456789` (auto-adds +60)

### Issue: "Unauthorized" errors
**Solution**: 
- Clear browser cookies
- Login again with password: `Acun97`

### Issue: Database connection failed
**Solution**: 
- Verify all `PG*` environment variables in Vercel
- Check Neon database is active

---

## 📊 Check Deployment Status

### Check Build Logs
1. Vercel Dashboard → Your Project
2. Click latest deployment
3. View **Build Logs** tab

### Check Function Logs
1. Vercel Dashboard → Your Project
2. Click **Functions** tab
3. View real-time logs

### Check Environment Variables
```bash
# In Vercel project
vercel env ls
```

---

## 🔄 Update Deployment

### Auto Deploy (Recommended)
- Push to `main` branch
- Vercel auto-deploys

### Manual Deploy
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

---

## 💰 Cost Estimates

### Vercel
- **Hobby Plan**: FREE
  - 100GB bandwidth/month
  - Unlimited deployments
  - Perfect for personal use

### Textbelt
- **Pay-per-SMS**:
  - International (Malaysia): ~$0.13 per SMS
  - US/Canada: ~$0.04 per SMS
- **Recommended**: Start with $10 (~75 SMS)

### Neon PostgreSQL
- **FREE Tier**:
  - 0.5GB storage
  - 1 project
  - Sufficient for this app

**Total**: ~$0-10/month (depending on SMS usage)

---

## 🔗 Important URLs

- **Live App**: `https://your-app.vercel.app`
- **Vercel Dashboard**: `https://vercel.com/dashboard`
- **Textbelt Dashboard**: `https://textbelt.com`
- **Neon Dashboard**: `https://console.neon.tech`
- **GitHub Repo**: `https://github.com/Faizzz7348/sms-gateway`

---

## ✅ Checklist

- [ ] Vercel account created
- [ ] Repository connected to Vercel
- [ ] Environment variables added
- [ ] Textbelt API key purchased
- [ ] Application deployed successfully
- [ ] Settings configured in app
- [ ] Test SMS sent successfully
- [ ] Message history showing correctly

---

## 📞 Support

Jika ada masalah:
1. Check Vercel Function Logs
2. Check browser Console (F12)
3. Verify all environment variables
4. Test Textbelt API with curl command
5. Check Neon database connection

**Ready to deploy! 🚀**
