var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import "dotenv/config";
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import bcrypt from "bcryptjs";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  contacts: () => contacts,
  insertContactSchema: () => insertContactSchema,
  insertMessageSchema: () => insertMessageSchema,
  insertSettingsSchema: () => insertSettingsSchema,
  loginSchema: () => loginSchema,
  messages: () => messages,
  registerSchema: () => registerSchema,
  serverInsertMessageSchema: () => serverInsertMessageSchema,
  sessions: () => sessions,
  settings: () => settings,
  updateSettingsSchema: () => updateSettingsSchema,
  users: () => users
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, decimal, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: text("password").notNull(),
  name: varchar("name").notNull(),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var contacts = pgTable("contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  isFavorite: boolean("is_favorite").default(false),
  createdAt: timestamp("created_at").defaultNow()
});
var messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recipientPhone: text("recipient_phone").notNull(),
  recipientName: text("recipient_name"),
  content: text("content").notNull(),
  status: text("status").notNull(),
  // 'pending', 'delivered', 'failed'
  sentAt: timestamp("sent_at").defaultNow(),
  cost: decimal("cost", { precision: 10, scale: 4 }),
  textbeltId: text("textbelt_id"),
  errorMessage: text("error_message")
});
var settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  apiKey: text("api_key"),
  token: text("token"),
  apiEndpoint: text("api_endpoint").default("https://textbelt.com/text"),
  defaultCountryCode: text("default_country_code").default("+60"),
  autoSaveDrafts: boolean("auto_save_drafts").default(true),
  messageConfirmations: boolean("message_confirmations").default(false)
});
var insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true
});
var insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  sentAt: true,
  status: true,
  textbeltId: true,
  errorMessage: true
});
var serverInsertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  sentAt: true
});
var insertSettingsSchema = createInsertSchema(settings).omit({
  id: true
});
var updateSettingsSchema = insertSettingsSchema.partial();
var registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters")
});
var loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, desc } from "drizzle-orm";
var DatabaseStorage = class {
  // Users
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserById(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  async createUser(userData) {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }
  async upsertUser(userData) {
    const [user] = await db.insert(users).values(userData).onConflictDoUpdate({
      target: users.id,
      set: {
        ...userData,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return user;
  }
  // Contacts
  async getContacts() {
    return await db.select().from(contacts).orderBy(desc(contacts.isFavorite), contacts.name);
  }
  async getContact(id) {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact;
  }
  async getContactByPhone(phone) {
    const [contact] = await db.select().from(contacts).where(eq(contacts.phone, phone));
    return contact;
  }
  async createContact(insertContact) {
    const [contact] = await db.insert(contacts).values(insertContact).returning();
    return contact;
  }
  async updateContact(id, contactUpdate) {
    const [contact] = await db.update(contacts).set(contactUpdate).where(eq(contacts.id, id)).returning();
    return contact;
  }
  async deleteContact(id) {
    const result = await db.delete(contacts).where(eq(contacts.id, id));
    return (result.rowCount ?? 0) > 0;
  }
  // Messages
  async getMessages() {
    return await db.select().from(messages).orderBy(desc(messages.sentAt));
  }
  async getMessage(id) {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message;
  }
  async createMessage(insertMessage) {
    const [message] = await db.insert(messages).values(insertMessage).returning();
    return message;
  }
  async updateMessage(id, updates) {
    const [message] = await db.update(messages).set(updates).where(eq(messages.id, id)).returning();
    return message;
  }
  async deleteMessage(id) {
    const result = await db.delete(messages).where(eq(messages.id, id));
    return (result.rowCount ?? 0) > 0;
  }
  // Settings
  async getSettings() {
    const [settingsRecord] = await db.select().from(settings).limit(1);
    return settingsRecord;
  }
  async createSettings(insertSettings) {
    const [settingsRecord] = await db.insert(settings).values(insertSettings).returning();
    return settingsRecord;
  }
  async updateSettings(settingsUpdate) {
    const [updated] = await db.update(settings).set(settingsUpdate).returning();
    if (updated) {
      return updated;
    }
    const defaultSettings = {
      apiKey: null,
      token: null,
      apiEndpoint: "https://textbelt.com/intl",
      defaultCountryCode: "+60",
      autoSaveDrafts: true,
      messageConfirmations: false,
      ...settingsUpdate
    };
    return await this.createSettings(defaultSettings);
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import { z as z2 } from "zod";
var PgSession = connectPgSimple(session);
var sessionStore = new PgSession({
  pool,
  // Use the database connection pool
  tableName: "sessions",
  createTableIfMissing: true
});
var sessionMiddleware = session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || "simple-sms-app-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1e3
    // 24 hours
  }
});
var isAuthenticated = (req, res, next) => {
  if (req.session && (req.session.authenticated || req.session.userId)) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};
async function registerRoutes(app2) {
  app2.use(sessionMiddleware);
  app2.get("/migrate", async (req, res) => {
    const fs2 = await import("fs");
    const path3 = await import("path");
    const migrateHtmlPath = path3.join(process.cwd(), "client", "migrate.html");
    if (fs2.existsSync(migrateHtmlPath)) {
      res.sendFile(migrateHtmlPath);
    } else {
      res.status(404).send("Migration page not found");
    }
  });
  app2.post("/api/migrate", async (req, res) => {
    try {
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);
      console.log("\u{1F680} Running database migration...");
      const { stdout, stderr } = await execAsync("npx drizzle-kit push --yes");
      console.log(stdout);
      if (stderr && !stderr.includes("warning")) {
        console.error(stderr);
      }
      res.json({
        success: true,
        message: "Database migration completed successfully!",
        output: stdout
      });
    } catch (error) {
      console.error("Migration error:", error);
      res.status(500).json({
        success: false,
        message: "Migration failed",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      const user = await storage.createUser({
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name
      });
      req.session.userId = user.id;
      req.session.authenticated = true;
      res.status(201).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to register", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const user = await storage.getUserByEmail(validatedData.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      const isValidPassword = await bcrypt.compare(validatedData.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      req.session.userId = user.id;
      req.session.authenticated = true;
      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Failed to login", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });
  app2.post("/api/access", async (req, res) => {
    try {
      const { password } = req.body;
      if (password === "Acun97") {
        req.session.authenticated = true;
        res.json({ success: true });
      } else {
        res.status(401).json({ message: "Incorrect password" });
      }
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/auth/status", async (req, res) => {
    if (req.session && (req.session.authenticated || req.session.userId)) {
      const userId = req.session.userId;
      if (userId) {
        const user = await storage.getUserById(userId);
        if (user) {
          return res.json({
            authenticated: true,
            user: {
              id: user.id,
              email: user.email,
              name: user.name
            }
          });
        }
      }
      res.json({ authenticated: true });
    } else {
      res.status(401).json({ authenticated: false });
    }
  });
  app2.post("/api/logout", async (req, res) => {
    req.session?.destroy((err) => {
      if (err) {
        res.status(500).json({ message: "Failed to logout" });
      } else {
        res.json({ success: true });
      }
    });
  });
  app2.get("/api/contacts", isAuthenticated, async (req, res) => {
    try {
      const contacts2 = await storage.getContacts();
      res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
      res.json(contacts2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });
  app2.post("/api/contacts", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(validatedData);
      res.status(201).json(contact);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid contact data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create contact" });
      }
    }
  });
  app2.patch("/api/contacts/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertContactSchema.partial().parse(req.body);
      const contact = await storage.updateContact(id, updates);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      res.json(contact);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid contact data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update contact" });
      }
    }
  });
  app2.delete("/api/contacts/:id", isAuthenticated, async (req, res) => {
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
  app2.get("/api/messages", isAuthenticated, async (req, res) => {
    try {
      const messages2 = await storage.getMessages();
      res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
      res.json(messages2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });
  app2.post("/api/messages/send", isAuthenticated, async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      const settings2 = await storage.getSettings();
      if (!settings2?.apiKey) {
        return res.status(400).json({
          message: "API key not configured. Please configure your Textbelt API key in settings.",
          hint: "Get your API key from https://textbelt.com and add credits"
        });
      }
      let phoneNumber = messageData.recipientPhone.trim();
      if (!phoneNumber.startsWith("+")) {
        const defaultCode = settings2.defaultCountryCode || "+60";
        if (phoneNumber.startsWith("0")) {
          phoneNumber = phoneNumber.substring(1);
        }
        phoneNumber = defaultCode + phoneNumber;
        console.log(`\u{1F4DE} Added country code: ${phoneNumber}`);
      }
      const message = await storage.createMessage({
        recipientPhone: phoneNumber,
        // Use formatted phone number
        recipientName: messageData.recipientName,
        content: messageData.content,
        status: "pending",
        cost: null,
        textbeltId: null,
        errorMessage: null
      });
      try {
        const textbeltEndpoint = settings2.apiEndpoint || "https://textbelt.com/text";
        const textbeltBody = new URLSearchParams({
          phone: phoneNumber,
          // Use formatted phone number
          message: messageData.content,
          key: settings2.apiKey
        });
        console.log("\u{1F680} Sending SMS Request:");
        console.log("   Endpoint:", textbeltEndpoint);
        console.log("   Phone:", phoneNumber);
        console.log("   Message:", messageData.content);
        console.log("   API Key:", settings2.apiKey ? `${settings2.apiKey.substring(0, 8)}...` : "NOT SET");
        const textbeltResponse = await fetch(textbeltEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: textbeltBody.toString()
        });
        console.log("\u{1F4E1} Response Status:", textbeltResponse.status);
        console.log("\u{1F4E1} Response Headers:", Object.fromEntries(textbeltResponse.headers.entries()));
        const textbeltResult = await textbeltResponse.json();
        console.log("\u{1F4F1} Textbelt Response:", JSON.stringify(textbeltResult, null, 2));
        if (!textbeltResponse.ok) {
          const errorMsg = textbeltResult.error || `HTTP ${textbeltResponse.status}`;
          await storage.updateMessage(message.id, {
            status: "failed",
            errorMessage: errorMsg
          });
          console.log("\u274C SMS Failed - HTTP Error!");
          console.log("   Status:", textbeltResponse.status);
          console.log("   Error:", errorMsg);
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
            hint,
            details: textbeltResult
          });
        }
        console.log("\u{1F4DE} Sent to:", phoneNumber);
        console.log("\u{1F4AC} Message:", messageData.content);
        console.log("\u{1F511} Endpoint:", textbeltEndpoint);
        if (textbeltResult.success) {
          await storage.updateMessage(message.id, {
            status: "delivered",
            textbeltId: textbeltResult.textId,
            cost: textbeltResult.cost || "0.04"
          });
          console.log("\u2705 SMS Sent Successfully!");
          console.log("   TextID:", textbeltResult.textId);
          console.log("   Quota Left:", textbeltResult.quotaRemaining);
          res.status(201).json({
            ...message,
            status: "delivered",
            textbeltId: textbeltResult.textId,
            quotaRemaining: textbeltResult.quotaRemaining
          });
        } else {
          await storage.updateMessage(message.id, {
            status: "failed",
            errorMessage: textbeltResult.error || "Unknown error"
          });
          console.log("\u274C SMS Failed!");
          console.log("   Error:", textbeltResult.error);
          console.log("   Quota Left:", textbeltResult.quotaRemaining);
          res.status(400).json({
            message: "Failed to send SMS",
            error: textbeltResult.error || "Unknown error from Textbelt",
            quotaRemaining: textbeltResult.quotaRemaining
          });
        }
      } catch (apiError) {
        console.log("\u{1F525} Network/API Error:");
        console.log("   Error Type:", apiError.name);
        console.log("   Error Message:", apiError.message);
        console.log("   Error Code:", apiError.code);
        console.log("   Full Error:", apiError);
        await storage.updateMessage(message.id, {
          status: "failed",
          errorMessage: `Network error: ${apiError.message || "Cannot reach Textbelt API"}`
        });
        const endpoint = settings2.apiEndpoint || "https://textbelt.com/text";
        res.status(500).json({
          message: "Failed to communicate with SMS service",
          error: apiError.message || "Network error reaching Textbelt API",
          details: {
            type: apiError.name,
            code: apiError.code,
            endpoint
          },
          hint: "Check internet connection or firewall settings. The server cannot reach textbelt.com"
        });
      }
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid message data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to send message" });
      }
    }
  });
  app2.delete("/api/messages/:id", isAuthenticated, async (req, res) => {
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
  app2.get("/api/messages/status/:textbeltId", isAuthenticated, async (req, res) => {
    try {
      const { textbeltId } = req.params;
      res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
      if (!textbeltId || textbeltId === "null") {
        return res.status(400).json({ message: "Invalid textbelt ID" });
      }
      try {
        const statusResponse = await fetch(`https://textbelt.com/status/${textbeltId}`);
        const statusData = await statusResponse.json();
        console.log("\u{1F4CA} Textbelt Status Check:", JSON.stringify(statusData, null, 2));
        res.json({
          success: true,
          status: statusData.status || "UNKNOWN",
          details: statusData
        });
      } catch (apiError) {
        console.log("\u{1F525} Status Check Error:", apiError);
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
  app2.get("/api/settings", isAuthenticated, async (req, res) => {
    try {
      const settings2 = await storage.getSettings();
      res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
      if (!settings2) {
        const defaultSettings = {
          id: "",
          apiKey: null,
          apiEndpoint: "https://textbelt.com/text",
          defaultCountryCode: "+60",
          autoSaveDrafts: true,
          messageConfirmations: false
        };
        res.json(defaultSettings);
      } else {
        res.json(settings2);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });
  app2.post("/api/settings", isAuthenticated, async (req, res) => {
    try {
      const validatedData = updateSettingsSchema.parse(req.body);
      const settings2 = await storage.updateSettings(validatedData);
      res.json(settings2);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid settings data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update settings" });
      }
    }
  });
  app2.get("/api/account/balance", isAuthenticated, async (req, res) => {
    try {
      res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
      const settings2 = await storage.getSettings();
      if (!settings2?.apiKey) {
        return res.status(400).json({
          message: "API key not configured",
          balance: null
        });
      }
      try {
        const balanceResponse = await fetch(`https://textbelt.com/quota/${settings2.apiKey}`);
        const balanceData = await balanceResponse.json();
        if (balanceData.success) {
          res.json({
            success: true,
            quotaRemaining: balanceData.quotaRemaining,
            balance: `$${(balanceData.quotaRemaining * 0.04).toFixed(2)}`
            // Assuming $0.04 per SMS
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
  app2.get("/api/account/usage", isAuthenticated, async (req, res) => {
    try {
      res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
      const messages2 = await storage.getMessages();
      const totalMessages = messages2.length;
      const deliveredMessages = messages2.filter((m) => m.status === "delivered").length;
      const failedMessages = messages2.filter((m) => m.status === "failed").length;
      const successRate = totalMessages > 0 ? Math.round(deliveredMessages / totalMessages * 100) : 0;
      const totalSpent = (deliveredMessages * 0.04).toFixed(2);
      res.json({
        messagesSent: totalMessages,
        messagesDelivered: deliveredMessages,
        messagesFailed: failedMessages,
        successRate,
        totalSpent: `$${totalSpent}`
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch usage statistics"
      });
    }
  });
  app2.post("/api/settings/test", isAuthenticated, async (req, res) => {
    try {
      const { apiKey, apiEndpoint } = req.body;
      if (!apiKey) {
        return res.status(400).json({ message: "API key is required" });
      }
      const endpoint = apiEndpoint || "https://textbelt.com/text";
      const testResponse = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          phone: "5555551234",
          message: "Test message",
          key: apiKey
        })
      });
      const result = await testResponse.json();
      if (result.success || result.error?.includes("Invalid phone number")) {
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
  app2.post("/api/account/purchase", isAuthenticated, async (req, res) => {
    try {
      const { quantity } = req.body;
      if (!quantity || quantity < 1) {
        return res.status(400).json({
          message: "Quantity must be at least 1"
        });
      }
      const settings2 = await storage.getSettings();
      if (!settings2?.apiKey) {
        return res.status(400).json({
          message: "API key not configured"
        });
      }
      const purchaseUrl = `https://textbelt.com/purchase/${settings2.apiKey}?quantity=${quantity}`;
      console.log("\u{1F4B3} Purchase URL Generated:", purchaseUrl);
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
  app2.post("/api/phone/verify", isAuthenticated, async (req, res) => {
    try {
      const { phone } = req.body;
      if (!phone) {
        return res.status(400).json({
          message: "Phone number is required"
        });
      }
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      const isValid = phoneRegex.test(phone.replace(/[\s-()]/g, ""));
      const settings2 = await storage.getSettings();
      let textbeltValidation = null;
      if (settings2?.apiKey) {
        try {
          const endpoint = settings2.apiEndpoint || "https://textbelt.com/text";
          const testResponse = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
              phone,
              message: "Verification test",
              key: settings2.apiKey
            }).toString()
          });
          const result = await testResponse.json();
          textbeltValidation = {
            accepted: result.success || !result.error?.toLowerCase().includes("invalid"),
            message: result.error || "Phone number format accepted"
          };
        } catch (e) {
        }
      }
      console.log("\u{1F4F1} Phone Verification:", phone);
      console.log("   Local Validation:", isValid);
      console.log("   Textbelt Validation:", textbeltValidation);
      res.json({
        success: true,
        phone,
        isValidFormat: isValid,
        textbeltCheck: textbeltValidation,
        normalized: phone.replace(/[\s-()]/g, "")
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to verify phone number"
      });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-hook-form"],
          "ui-vendor": ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", "@radix-ui/react-select"],
          "chart-vendor": ["recharts"]
        }
      }
    }
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
