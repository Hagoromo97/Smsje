import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Contact } from "@shared/schema";
import { AppSidebar } from "@/components/layout/app-sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import ComposeForm from "@/components/compose/compose-form";
import QuickContacts from "@/components/compose/quick-contacts";
import MessageHistory from "@/components/history/message-history";
import ContactGrid from "@/components/contacts/contact-grid";
import SettingsForm from "@/components/settings/settings-form";
import ContactModal from "@/components/contacts/contact-modal";
import { Bell, Menu, Moon, Sun, LogOut, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type Tab = "compose" | "history" | "contacts" | "settings";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("compose");
  const [showContactModal, setShowContactModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isDark, setIsDark] = useState(true);
  const { isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Redirect to landing if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/";
    }
  }, [isAuthenticated, isLoading]);

  // Listen for tab switch events
  useEffect(() => {
    const handleSwitchTab = (event: CustomEvent) => {
      const tabName = event.detail as Tab;
      setActiveTab(tabName);
    };

    window.addEventListener('switchTab', handleSwitchTab as EventListener);
    
    return () => {
      window.removeEventListener('switchTab', handleSwitchTab as EventListener);
    };
  }, []);

  // Listen for edit contact events
  useEffect(() => {
    const handleEditContact = (event: CustomEvent) => {
      const contact = event.detail as Contact;
      setEditingContact(contact);
      setShowContactModal(true);
    };

    window.addEventListener('editContact', handleEditContact as EventListener);
    
    return () => {
      window.removeEventListener('editContact', handleEditContact as EventListener);
    };
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (newIsDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Initialize dark theme by default
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    } else {
      setIsDark(true);
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  }, []);

  const getPageTitle = (tab: Tab) => {
    const titles = {
      compose: "Compose Message",
      history: "Message History", 
      contacts: "Contact Management",
      settings: "Settings"
    };
    return titles[tab];
  };

  return (
    <SidebarProvider>
      <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">
                  Textbelt Pro
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{getPageTitle(activeTab)}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleTheme}
              data-testid="button-theme-toggle"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" data-testid="button-notifications">
              <div className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full"></span>
              </div>
            </Button>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 p-4 md:p-6">
            {activeTab === "compose" && (
              <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <ComposeForm onShowContacts={() => setShowContactModal(true)} />
                  </div>
                  <div className="lg:col-span-1">
                    <QuickContacts onSelectContact={(phone) => {
                      // This will be handled by the ComposeForm component
                    }} />
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === "history" && <MessageHistory />}
            
            {activeTab === "contacts" && (
              <ContactGrid onAddContact={() => setShowContactModal(true)} />
            )}
            
            {activeTab === "settings" && <SettingsForm />}
          </div>
        </div>
      </SidebarInset>

      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
      
      <ContactModal 
        isOpen={showContactModal} 
        onClose={() => {
          setShowContactModal(false);
          setEditingContact(null);
        }}
        editingContact={editingContact}
      />
    </SidebarProvider>
  );
}
