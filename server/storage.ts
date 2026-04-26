import { type Contact, type InsertContact, type Message, type InsertMessage, type ServerInsertMessage, type Settings, type InsertSettings, type UpdateSettings, type User, type UpsertUser, users, contacts, messages, settings } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: { email: string; password: string; name: string }): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Contacts
  getContacts(): Promise<Contact[]>;
  getContact(id: string): Promise<Contact | undefined>;
  getContactByPhone(phone: string): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: string, contact: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: string): Promise<boolean>;
  
  // Messages
  getMessages(): Promise<Message[]>;
  getMessage(id: string): Promise<Message | undefined>;
  createMessage(message: ServerInsertMessage): Promise<Message>;
  updateMessage(id: string, updates: Partial<Message>): Promise<Message | undefined>;
  deleteMessage(id: string): Promise<boolean>;
  
  // Settings
  getSettings(): Promise<Settings | undefined>;
  createSettings(settings: InsertSettings): Promise<Settings>;
  updateSettings(settings: UpdateSettings): Promise<Settings | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private contacts: Map<string, Contact>;
  private messages: Map<string, Message>;
  private settings: Settings | undefined;

  constructor() {
    this.users = new Map();
    this.contacts = new Map();
    this.messages = new Map();
    this.settings = undefined;
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  async createUser(userData: { email: string; password: string; name: string }): Promise<User> {
    const id = crypto.randomUUID();
    const newUser: User = {
      id,
      email: userData.email,
      password: userData.password,
      name: userData.name,
      profileImageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    if (!userData.id) {
      throw new Error("User ID is required");
    }
    
    const existingUser = this.users.get(userData.id);
    
    if (existingUser) {
      const updatedUser: User = {
        ...existingUser,
        ...userData,
        id: userData.id,
        updatedAt: new Date(),
      };
      this.users.set(userData.id, updatedUser);
      return updatedUser;
    } else {
      const newUser: User = {
        id: userData.id,
        email: userData.email,
        password: userData.password,
        name: userData.name,
        profileImageUrl: userData.profileImageUrl ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.users.set(userData.id, newUser);
      return newUser;
    }
  }

  // Contacts
  async getContacts(): Promise<Contact[]> {
    return Array.from(this.contacts.values()).sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return a.name.localeCompare(b.name);
    });
  }

  async getContact(id: string): Promise<Contact | undefined> {
    return this.contacts.get(id);
  }

  async getContactByPhone(phone: string): Promise<Contact | undefined> {
    return Array.from(this.contacts.values()).find(
      (contact) => contact.phone === phone,
    );
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const id = randomUUID();
    const contact: Contact = { 
      ...insertContact,
      id,
      isFavorite: insertContact.isFavorite ?? false,
      createdAt: new Date()
    };
    this.contacts.set(id, contact);
    return contact;
  }

  async updateContact(id: string, contactUpdate: Partial<InsertContact>): Promise<Contact | undefined> {
    const existingContact = this.contacts.get(id);
    if (!existingContact) return undefined;
    
    const updatedContact = { ...existingContact, ...contactUpdate };
    this.contacts.set(id, updatedContact);
    return updatedContact;
  }

  async deleteContact(id: string): Promise<boolean> {
    return this.contacts.delete(id);
  }

  // Messages
  async getMessages(): Promise<Message[]> {
    return Array.from(this.messages.values()).sort((a, b) => 
      new Date(b.sentAt!).getTime() - new Date(a.sentAt!).getTime()
    );
  }

  async getMessage(id: string): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async createMessage(insertMessage: ServerInsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = { 
      ...insertMessage,
      recipientName: insertMessage.recipientName ?? null,
      cost: insertMessage.cost ?? "0.04",
      textbeltId: insertMessage.textbeltId ?? null,
      errorMessage: insertMessage.errorMessage ?? null,
      id,
      sentAt: new Date()
    };
    this.messages.set(id, message);
    return message;
  }

  async updateMessage(id: string, updates: Partial<Message>): Promise<Message | undefined> {
    const existingMessage = this.messages.get(id);
    if (!existingMessage) return undefined;
    
    const updatedMessage = { ...existingMessage, ...updates };
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }

  async deleteMessage(id: string): Promise<boolean> {
    return this.messages.delete(id);
  }

  // Settings
  async getSettings(): Promise<Settings | undefined> {
    return this.settings;
  }

  async createSettings(insertSettings: InsertSettings): Promise<Settings> {
    const id = randomUUID();
    const settings: Settings = { 
      ...insertSettings,
      id,
      apiKey: insertSettings.apiKey ?? null,
      token: insertSettings.token ?? null,
      apiEndpoint: insertSettings.apiEndpoint ?? "https://textbelt.com/text",
      defaultCountryCode: insertSettings.defaultCountryCode ?? "+60",
      autoSaveDrafts: insertSettings.autoSaveDrafts ?? true,
      messageConfirmations: insertSettings.messageConfirmations ?? false
    };
    this.settings = settings;
    return settings;
  }

  async updateSettings(settingsUpdate: UpdateSettings): Promise<Settings | undefined> {
    if (!this.settings) {
      // Create default settings if none exist
      this.settings = {
        id: randomUUID(),
        apiKey: null,
        token: null,
        apiEndpoint: "https://textbelt.com/text",
        defaultCountryCode: "+60",
        autoSaveDrafts: true,
        messageConfirmations: false
      };
    }
    
    this.settings = { ...this.settings, ...settingsUpdate };
    return this.settings;
  }
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: { email: string; password: string; name: string }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Contacts
  async getContacts(): Promise<Contact[]> {
    return await db.select().from(contacts).orderBy(desc(contacts.isFavorite), contacts.name);
  }

  async getContact(id: string): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact;
  }

  async getContactByPhone(phone: string): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.phone, phone));
    return contact;
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const [contact] = await db
      .insert(contacts)
      .values(insertContact)
      .returning();
    return contact;
  }

  async updateContact(id: string, contactUpdate: Partial<InsertContact>): Promise<Contact | undefined> {
    const [contact] = await db
      .update(contacts)
      .set(contactUpdate)
      .where(eq(contacts.id, id))
      .returning();
    return contact;
  }

  async deleteContact(id: string): Promise<boolean> {
    const result = await db.delete(contacts).where(eq(contacts.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Messages
  async getMessages(): Promise<Message[]> {
    return await db.select().from(messages).orderBy(desc(messages.sentAt));
  }

  async getMessage(id: string): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message;
  }

  async createMessage(insertMessage: ServerInsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async updateMessage(id: string, updates: Partial<Message>): Promise<Message | undefined> {
    const [message] = await db
      .update(messages)
      .set(updates)
      .where(eq(messages.id, id))
      .returning();
    return message;
  }

  async deleteMessage(id: string): Promise<boolean> {
    const result = await db
      .delete(messages)
      .where(eq(messages.id, id));
    
    return (result.rowCount ?? 0) > 0;
  }

  // Settings
  async getSettings(): Promise<Settings | undefined> {
    const [settingsRecord] = await db.select().from(settings).limit(1);
    return settingsRecord;
  }

  async createSettings(insertSettings: InsertSettings): Promise<Settings> {
    const [settingsRecord] = await db
      .insert(settings)
      .values(insertSettings)
      .returning();
    return settingsRecord;
  }

  async updateSettings(settingsUpdate: UpdateSettings): Promise<Settings | undefined> {
    // Try to update existing settings first
    const [updated] = await db
      .update(settings)
      .set(settingsUpdate)
      .returning();
    
    if (updated) {
      return updated;
    }
    
    // If no settings exist, create default settings for Malaysia/Asia
    const defaultSettings: InsertSettings = {
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
}

export const storage = new DatabaseStorage();
