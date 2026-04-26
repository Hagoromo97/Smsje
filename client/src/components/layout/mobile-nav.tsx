import { MessageSquare, History, Users, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Tab = "compose" | "history" | "contacts" | "settings";

interface MobileNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const navigation = [
  { id: "compose" as const, label: "Compose", icon: MessageSquare },
  { id: "history" as const, label: "History", icon: History },
  { id: "contacts" as const, label: "Contacts", icon: Users },
  { id: "settings" as const, label: "Settings", icon: Settings },
];

export default function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 z-40">
      <div className="flex items-center justify-around py-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              className={cn(
                "flex flex-col items-center p-2 h-auto",
                isActive ? "text-blue-400" : "text-gray-400 hover:text-white"
              )}
              onClick={() => onTabChange(item.id)}
              data-testid={`mobile-nav-${item.id}`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm mt-1">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
