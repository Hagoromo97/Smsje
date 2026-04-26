import { apiRequest } from "./queryClient";
import { type InsertContact, type InsertMessage, type UpdateSettings } from "@shared/schema";

export const api = {
  // Contacts
  contacts: {
    getAll: () => fetch("/api/contacts", {
      cache: "no-cache",
      headers: {
        "Cache-Control": "no-cache",
      }
    }).then(res => res.json()),
    create: (data: InsertContact) => apiRequest("POST", "/api/contacts", data),
    update: (id: string, data: Partial<InsertContact>) => apiRequest("PATCH", `/api/contacts/${id}`, data),
    delete: (id: string) => apiRequest("DELETE", `/api/contacts/${id}`),
  },

  // Messages
  messages: {
    getAll: () => fetch("/api/messages", {
      cache: "no-cache",
      headers: {
        "Cache-Control": "no-cache",
      }
    }).then(res => res.json()),
    send: (data: InsertMessage) => apiRequest("POST", "/api/messages/send", data),
    delete: (id: string) => apiRequest("DELETE", `/api/messages/${id}`),
    checkStatus: (textbeltId: string) => fetch(`/api/messages/status/${textbeltId}`, {
      cache: "no-cache",
      headers: {
        "Cache-Control": "no-cache",
      }
    }).then(res => res.json()),
  },

  // Settings
  settings: {
    get: () => fetch("/api/settings", {
      cache: "no-cache",
      headers: {
        "Cache-Control": "no-cache",
      }
    }).then(res => res.json()),
    update: (data: UpdateSettings) => apiRequest("POST", "/api/settings", data),
    test: (data: { apiKey: string; apiEndpoint: string }) => apiRequest("POST", "/api/settings/test", data),
  },

  // Account Management
  account: {
    getBalance: () => fetch("/api/account/balance", {
      cache: "no-cache",
      headers: {
        "Cache-Control": "no-cache",
      }
    }).then(res => res.json()),
    getUsage: () => fetch("/api/account/usage", {
      cache: "no-cache",
      headers: {
        "Cache-Control": "no-cache",
      }
    }).then(res => res.json()),
    purchase: async (quantity: number) => {
      const response = await apiRequest("POST", "/api/account/purchase", { quantity });
      return response.json();
    },
  },

  // Phone Verification
  phone: {
    verify: async (phone: string) => {
      const response = await apiRequest("POST", "/api/phone/verify", { phone });
      return response.json();
    },
  },
};
