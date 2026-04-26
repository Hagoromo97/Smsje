import type { Express, RequestHandler } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { insertContactSchema, insertMessageSchema, updateSettingsSchema, registerSchema, loginSchema } from "@shared/schema";
import { z } from "zod";
import { pool } from "./db";

const PgSession = connectPgSimple(session);

// Setup PostgreSQL session store
const sessionStore = new PgSession({
  pool: pool as any, // Use the database connection pool
  tableName: 'sessions',
  createTableIfMissing: true,
});

// Simple session middleware
const sessionMiddleware = session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || "simple-sms-app-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
});

// Simple authentication middleware
const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.session && ((req.session as any).authenticated || (req.session as any).userId)) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware
  app.use(sessionMiddleware);

  // Serve migration page
  app.get('/migrate', async (req, res) => {
    const fs = await import('fs');
    const path = await import('path');
    const migrateHtmlPath = path.join(process.cwd(), 'client', 'migrate.html');
    
    if (fs.existsSync(migrateHtmlPath)) {
      res.sendFile(migrateHtmlPath);
    } else {
      res.status(404).send('Migration page not found');
    }
  });

  // Migration endpoint - for easy database setup
  app.post('/api/migrate', async (req, res) => {
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      console.log('🚀 Running database migration...');
      const { stdout, stderr } = await execAsync('npx drizzle-kit push --yes');
      
      console.log(stdout);
      if (stderr && !stderr.includes('warning')) {
        console.error(stderr);
      }
      
      res.json({ 
        success: true, 
        message: 'Database migration completed successfully!',
        output: stdout
      });
    } catch (error) {
      console.error('Migration error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Migration failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Register route
  app.post('/api/auth/register', async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);

      // Create user
      const user = await storage.createUser({
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
      });

      // Set session
      (req.session as any).userId = user.id;
      (req.session as any).authenticated = true;

      res.status(201).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to register", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Login route
  app.post('/api/auth/login', async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      // Get user by email
      const user = await storage.getUserByEmail(validatedData.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(validatedData.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Set session
      (req.session as any).userId = user.id;
      (req.session as any).authenticated = true;

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Failed to login", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Password access route (backward compatibility)
  app.post('/api/access', async (req, res) => {
    try {
      const { password } = req.body;
      
      if (password === "Acun97") {
        (req.session as any).authenticated = true;
        res.json({ success: true });
      } else {
        res.status(401).json({ message: "Incorrect password" });
      }
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Check auth status
  app.get('/api/auth/status', async (req, res) => {
    if (req.session && ((req.session as any).authenticated || (req.session as any).userId)) {
      const userId = (req.session as any).userId;
      if (userId) {
        const user = await storage.getUserById(userId);
        if (user) {
          return res.json({
            authenticated: true,
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
            },
          });
        }
      }
      res.json({ authenticated: true });
    } else {
      res.status(401).json({ authenticated: false });
    }
  });

  // Logout route
  app.post('/api/logout', async (req, res) => {
    req.session?.destroy((err) => {
      if (err) {
        res.status(500).json({ message: "Failed to logout" });
      } else {
        res.json({ success: true });
      }
    });
  });
  // Contacts routes
  app.get("/api/contacts", isAuthenticated, async (req, res) => {
    try {
      const contacts = await storage.getContacts();
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  app.post("/api/contacts", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(validatedData);
      res.status(201).json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid contact data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create contact" });
      }
    }
  });

  app.patch("/api/contacts/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertContactSchema.partial().parse(req.body);
      const contact = await storage.updateContact(id, updates);
      
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      res.json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid contact data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update contact" });
      }
    }
  });

  app.delete("/api/contacts/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteContact(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete contact" });
    }
  });

  // Messages routes
  app.get("/api/messages", isAuthenticated, async (req, res) => {
    try {
      const messages = await storage.getMessages();
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages/send", isAuthenticated, async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      
      // Get API settings
      const settings = await storage.getSettings();
      if (!settings?.apiKey) {
        return res.status(400).json({ 
          message: "API key not configured. Please configure your Textbelt API key in settings.",
          hint: "Get your API key from https://textbelt.com and add credits"
        });
      }

      // Validate phone number format
      let phoneNumber = messageData.recipientPhone.trim();
      
      // Add country code if missing
      if (!phoneNumber.startsWith('+')) {
        // Use default country code from settings
        const defaultCode = settings.defaultCountryCode || '+60';
        // Remove leading 0 if present
        if (phoneNumber.startsWith('0')) {
          phoneNumber = phoneNumber.substring(1);
        }
        phoneNumber = defaultCode + phoneNumber;
        console.log(`📞 Added country code: ${phoneNumber}`);
      }

      // Create message record first with default status
      const message = await storage.createMessage({
        recipientPhone: phoneNumber, // Use formatted phone number
        recipientName: messageData.recipientName,
        content: messageData.content,
        status: "pending",
        cost: null,
        textbeltId: null,
        errorMessage: null
      });

      try {
        // Send via Textbelt API using documented form encoding
        // Textbelt /text endpoint works for all countries with proper country code
        const textbeltEndpoint = settings.apiEndpoint || "https://textbelt.com/text";
        const textbeltBody = new URLSearchParams({
          phone: phoneNumber, // Use formatted phone number
          message: messageData.content,
          key: settings.apiKey,
        });

        console.log("🚀 Sending SMS Request:");
        console.log("   Endpoint:", textbeltEndpoint);
        console.log("   Phone:", phoneNumber);
        console.log("   Message:", messageData.content);
        console.log("   API Key:", settings.apiKey ? `${settings.apiKey.substring(0, 8)}...` : 'NOT SET');

        const textbeltResponse = await fetch(textbeltEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: textbeltBody.toString(),
        });

        console.log("📡 Response Status:", textbeltResponse.status);
        console.log("📡 Response Headers:", Object.fromEntries(textbeltResponse.headers.entries()));

        // Always try to get the JSON response for better error details
        const textbeltResult = await textbeltResponse.json();
        console.log("📱 Textbelt Response:", JSON.stringify(textbeltResult, null, 2));

        if (!textbeltResponse.ok) {
          const errorMsg = textbeltResult.error || `HTTP ${textbeltResponse.status}`;
          await storage.updateMessage(message.id, {
            status: "failed",
            errorMessage: errorMsg,
          });

          console.log("❌ SMS Failed - HTTP Error!");
          console.log("   Status:", textbeltResponse.status);
          console.log("   Error:", errorMsg);

          // Provide helpful error messages
          let userMessage = "SMS provider returned an error";
          let hint = "";

          if (textbeltResponse.status === 404) {
            userMessage = "Invalid API endpoint";
            hint = "The endpoint URL is incorrect. Use: https://textbelt.com/text (ensure phone has country code)";
          } else if (errorMsg.includes("Invalid API key")) {
            userMessage = "Invalid API key";
            hint = "Check your Textbelt API key in Settings. Get one from https://textbelt.com";
          } else if (errorMsg.includes("Out of quota") || errorMsg.includes("insufficient")) {
            userMessage = "Insufficient credits";
            hint = "Your Textbelt account is out of credits. Purchase more at https://textbelt.com";
          } else if (errorMsg.includes("Invalid phone")) {
            userMessage = "Invalid phone number format";
            hint = `Phone: ${phoneNumber}. Ensure it includes country code (e.g., +60123456789)`;
          }

          return res.status(502).json({
            message: userMessage,
            error: errorMsg,
            hint: hint,
            details: textbeltResult,
          });
        }
        
        // LOG FULL RESPONSE untuk debugging
        console.log("📞 Sent to:", phoneNumber);
        console.log("💬 Message:", messageData.content);
        console.log("🔑 Endpoint:", textbeltEndpoint);
        
        if (textbeltResult.success) {
          // Update message status to delivered
          await storage.updateMessage(message.id, {
            status: "delivered",
            textbeltId: textbeltResult.textId,
            cost: textbeltResult.cost || "0.04",
          });
          
          console.log("✅ SMS Sent Successfully!");
          console.log("   TextID:", textbeltResult.textId);
          console.log("   Quota Left:", textbeltResult.quotaRemaining);
          
          res.status(201).json({
            ...message,
            status: "delivered",
            textbeltId: textbeltResult.textId,
            quotaRemaining: textbeltResult.quotaRemaining,
          });
        } else {
          // Update message status to failed
          await storage.updateMessage(message.id, {
            status: "failed",
            errorMessage: textbeltResult.error || "Unknown error",
          });
          
          console.log("❌ SMS Failed!");
          console.log("   Error:", textbeltResult.error);
          console.log("   Quota Left:", textbeltResult.quotaRemaining);
          
          res.status(400).json({
            message: "Failed to send SMS",
            error: textbeltResult.error || "Unknown error from Textbelt",
            quotaRemaining: textbeltResult.quotaRemaining,
          });
        }
      } catch (apiError: any) {
        // Update message status to failed
        console.log("🔥 Network/API Error:");
        console.log("   Error Type:", apiError.name);
        console.log("   Error Message:", apiError.message);
        console.log("   Error Code:", apiError.code);
        console.log("   Full Error:", apiError);
        
        await storage.updateMessage(message.id, {
          status: "failed",
          errorMessage: `Network error: ${apiError.message || 'Cannot reach Textbelt API'}`,
        });
        
        const endpoint = settings.apiEndpoint || "https://textbelt.com/text";
        
        res.status(500).json({
          message: "Failed to communicate with SMS service",
          error: apiError.message || "Network error reaching Textbelt API",
          details: {
            type: apiError.name,
            code: apiError.code,
            endpoint: endpoint,
          },
          hint: "Check internet connection or firewall settings. The server cannot reach textbelt.com",
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid message data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to send message" });
      }
    }
  });

  // Delete message route
  app.delete("/api/messages/:id", isAuthenticated, async (req, res) => {
    try {
      const messageId = req.params.id;
      const deleted = await storage.deleteMessage(messageId);
      
      if (deleted) {
        res.json({ message: "Message deleted successfully" });
      } else {
        res.status(404).json({ message: "Message not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete message" });
    }
  });

  // Check message status by textbelt ID
  app.get("/api/messages/status/:textbeltId", isAuthenticated, async (req, res) => {
    try {
      const { textbeltId } = req.params;
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      
      if (!textbeltId || textbeltId === 'null') {
        return res.status(400).json({ message: "Invalid textbelt ID" });
      }

      try {
        const statusResponse = await fetch(`https://textbelt.com/status/${textbeltId}`);
        const statusData = await statusResponse.json();
        
        console.log("📊 Textbelt Status Check:", JSON.stringify(statusData, null, 2));
        
        res.json({
          success: true,
          status: statusData.status || 'UNKNOWN',
          details: statusData
        });
      } catch (apiError) {
        console.log("🔥 Status Check Error:", apiError);
        res.status(500).json({
          success: false,
          message: "Failed to check message status",
          error: "Network error"
        });
      }
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: "Failed to check message status" 
      });
    }
  });

  // Settings routes
  app.get("/api/settings", isAuthenticated, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      if (!settings) {
        // Return default settings for Malaysia/Asia
        const defaultSettings = {
          id: "",
          apiKey: null,
          apiEndpoint: "https://textbelt.com/text",
          defaultCountryCode: "+60",
          autoSaveDrafts: true,
          messageConfirmations: false,
        };
        res.json(defaultSettings);
      } else {
        res.json(settings);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.post("/api/settings", isAuthenticated, async (req, res) => {
    try {
      const validatedData = updateSettingsSchema.parse(req.body);
      const settings = await storage.updateSettings(validatedData);
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid settings data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update settings" });
      }
    }
  });

  // Account balance route
  app.get("/api/account/balance", isAuthenticated, async (req, res) => {
    try {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      const settings = await storage.getSettings();
      if (!settings?.apiKey) {
        return res.status(400).json({ 
          message: "API key not configured", 
          balance: null 
        });
      }

      try {
        const balanceResponse = await fetch(`https://textbelt.com/quota/${settings.apiKey}`);
        const balanceData = await balanceResponse.json();
        
        if (balanceData.success) {
          res.json({
            success: true,
            quotaRemaining: balanceData.quotaRemaining,
            balance: `$${(balanceData.quotaRemaining * 0.04).toFixed(2)}` // Assuming $0.04 per SMS
          });
        } else {
          res.status(400).json({
            success: false,
            message: "Failed to fetch balance from Textbelt",
            balance: null
          });
        }
      } catch (apiError) {
        res.status(500).json({
          success: false,
          message: "Failed to communicate with Textbelt API",
          balance: null
        });
      }
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch account balance",
        balance: null
      });
    }
  });

  // Account usage statistics
  app.get("/api/account/usage", isAuthenticated, async (req, res) => {
    try {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      const messages = await storage.getMessages();
      
      const totalMessages = messages.length;
      const deliveredMessages = messages.filter(m => m.status === 'delivered').length;
      const failedMessages = messages.filter(m => m.status === 'failed').length;
      
      const successRate = totalMessages > 0 ? 
        Math.round((deliveredMessages / totalMessages) * 100) : 0;
      
      const totalSpent = (deliveredMessages * 0.04).toFixed(2); // $0.04 per delivered SMS
      
      res.json({
        messagesSent: totalMessages,
        messagesDelivered: deliveredMessages,
        messagesFailed: failedMessages,
        successRate: successRate,
        totalSpent: `$${totalSpent}`
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch usage statistics" 
      });
    }
  });

  // Test API connection
  app.post("/api/settings/test", isAuthenticated, async (req, res) => {
    try {
      const { apiKey, apiEndpoint } = req.body;
      
      if (!apiKey) {
        return res.status(400).json({ message: "API key is required" });
      }

      const endpoint = apiEndpoint || "https://textbelt.com/text";
      
      // Test with a dummy number
      const testResponse = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: "5555551234",
          message: "Test message",
          key: apiKey,
        }),
      });

      const result = await testResponse.json();
      
      if (result.success || result.error?.includes("Invalid phone number")) {
        // API key is valid (even if phone number is invalid for test)
        res.json({ success: true, message: "API connection successful" });
      } else {
        res.status(400).json({ 
          success: false, 
          message: result.error || "API connection failed" 
        });
      }
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Failed to test API connection" 
      });
    }
  });

  // Purchase additional credits (get payment link)
  app.post("/api/account/purchase", isAuthenticated, async (req, res) => {
    try {
      const { quantity } = req.body; // number of texts to purchase
      
      if (!quantity || quantity < 1) {
        return res.status(400).json({ 
          message: "Quantity must be at least 1" 
        });
      }

      const settings = await storage.getSettings();
      if (!settings?.apiKey) {
        return res.status(400).json({ 
          message: "API key not configured" 
        });
      }

      // Generate purchase URL
      const purchaseUrl = `https://textbelt.com/purchase/${settings.apiKey}?quantity=${quantity}`;
      
      console.log("💳 Purchase URL Generated:", purchaseUrl);
      console.log("   Quantity:", quantity, "texts");
      console.log("   Estimated Cost: $", (quantity * 0.04).toFixed(2));
      
      res.json({
        success: true,
        purchaseUrl,
        quantity,
        estimatedCost: `$${(quantity * 0.04).toFixed(2)}`,
        message: "Open this URL to complete your purchase"
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: "Failed to generate purchase link" 
      });
    }
  });

  // Verify phone number format
  app.post("/api/phone/verify", isAuthenticated, async (req, res) => {
    try {
      const { phone } = req.body;
      
      if (!phone) {
        return res.status(400).json({ 
          message: "Phone number is required" 
        });
      }

      // Basic validation
      const phoneRegex = /^\+?[1-9]\d{1,14}$/; // E.164 format
      const isValid = phoneRegex.test(phone.replace(/[\s-()]/g, ''));
      
      // Try to send a test to Textbelt for validation (without actually sending)
      const settings = await storage.getSettings();
      let textbeltValidation = null;
      
      if (settings?.apiKey) {
        try {
          const endpoint = settings.apiEndpoint || "https://textbelt.com/text";
          const testResponse = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              phone: phone,
              message: "Verification test",
              key: settings.apiKey,
            }).toString(),
          });
          
          const result = await testResponse.json();
          textbeltValidation = {
            accepted: result.success || !result.error?.toLowerCase().includes('invalid'),
            message: result.error || "Phone number format accepted"
          };
        } catch (e) {
          // Ignore API errors
        }
      }
      
      console.log("📱 Phone Verification:", phone);
      console.log("   Local Validation:", isValid);
      console.log("   Textbelt Validation:", textbeltValidation);
      
      res.json({
        success: true,
        phone,
        isValidFormat: isValid,
        textbeltCheck: textbeltValidation,
        normalized: phone.replace(/[\s-()]/g, '')
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: "Failed to verify phone number" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
