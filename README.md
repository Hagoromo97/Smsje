# SMS Gateway dengan Textbelt API

Aplikasi SMS Gateway yang menggunakan Textbelt API untuk menghantar SMS ke Malaysia dan negara lain.

## ✨ Features

- 📱 Hantar SMS ke mana-mana negara (Malaysia +60 by default)
- 📊 Message history dengan status tracking
- 👥 Contact management
- 🔄 Resend messages
- ⚙️ Settings management
- 🎨 Modern UI dengan shadcn/ui
- 🔐 Session-based authentication
- 📈 Account balance dan usage tracking

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/Faizzz7348/sms-gateway.git
cd sms-gateway
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
```bash
cp .env.example .env
```

Edit `.env` dengan database credentials anda.

### 4. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:5000`

### 5. Login
- Password: `Acun97`

### 6. Configure Settings
1. Navigate to **Settings** page
2. Enter Textbelt API Key (dapatkan dari [textbelt.com](https://textbelt.com))
3. API Endpoint: `https://textbelt.com/text`
4. Default Country: `Malaysia +60`
5. Save Settings

### 7. Send SMS
1. Go to **Compose** page
2. Enter phone number (e.g., `0123456789`)
3. Write message
4. Click Send!

## 📦 Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL (Neon)
- **UI**: shadcn/ui + Tailwind CSS
- **SMS API**: Textbelt
- **Deployment**: Vercel

## 🌍 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment guide to Vercel.

Quick deploy:
1. Connect repository to Vercel
2. Add environment variables
3. Deploy!

## 📝 Environment Variables

```bash
DATABASE_URL=postgresql://...
SESSION_SECRET=your-secret-key
NODE_ENV=production
```

## 🔑 Default Credentials

- **Password**: `Acun97`

## 💰 Textbelt Pricing

- **International SMS** (Malaysia, Singapore, etc): ~$0.13 per SMS
- **US/Canada SMS**: ~$0.04 per SMS
- **Recommended**: Purchase $10 for ~75 international SMS

Get API key: [textbelt.com](https://textbelt.com)

## 📖 API Documentation

### Send SMS
```bash
POST /api/messages/send
{
  "recipientPhone": "+60123456789",
  "recipientName": "John Doe",
  "content": "Hello from SMS Gateway!"
}
```

### Get Messages
```bash
GET /api/messages
```

### Check Balance
```bash
GET /api/account/balance
```

## 🛠️ Development

### Project Structure
```
sms-gateway/
├── client/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── lib/
├── server/          # Express backend
│   ├── routes.ts
│   ├── storage.ts
│   └── db.ts
├── shared/          # Shared schemas
└── vercel.json      # Vercel config
```

### Scripts
```bash
npm run dev          # Development server
npm run build        # Build for production
npm run check        # Type checking
```

## 🐛 Troubleshooting

### Issue: "Invalid API endpoint" (404)
- ✅ Use `https://textbelt.com/text` (NOT `/intl`)
- Textbelt API has changed, only `/text` endpoint works now

### Issue: "Insufficient credits"
- Check quota: `curl https://textbelt.com/quota/YOUR_KEY`
- Purchase credits at [textbelt.com](https://textbelt.com)

### Issue: Phone format error
- Use format: `+60123456789` or `0123456789`
- App auto-adds country code (+60)

## 📄 License

MIT

## 👤 Author

**Faizzz7348**

- GitHub: [@Faizzz7348](https://github.com/Faizzz7348)

## 🙏 Acknowledgments

- [Textbelt](https://textbelt.com) - SMS API provider
- [shadcn/ui](https://ui.shadcn.com) - UI components
- [Neon](https://neon.tech) - PostgreSQL database

---

**Happy texting! 📱✨**
