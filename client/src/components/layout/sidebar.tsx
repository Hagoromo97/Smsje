import { MessageSquare, History, Users, Settings, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAccountBalance } from "@/hooks/useAccountBalance";

type Tab = "compose" | "history" | "contacts" | "settings";

interface SidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { id: "compose" as const, label: "Compose", icon: MessageSquare },
  { id: "history" as const, label: "Message History", icon: History },
  { id: "contacts" as const, label: "Contacts", icon: Users },
  { id: "settings" as const, label: "Settings", icon: Settings },
];

export default function Sidebar({ activeTab, onTabChange, isOpen, onClose }: SidebarProps) {
  const { balance, isLoading: balanceLoading, error: balanceError, refetch: refetchBalance } = useAccountBalance();

  return (
    <aside
      id="sidebar"
      className={cn(
        "sidebar-transition w-64 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-r border-gray-600 flex-shrink-0 shadow-xl",
        "fixed inset-y-0 left-0 z-50 transform overflow-y-auto transition-all duration-500 ease-out md:relative md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo and Brand */}
        <div className="p-6 border-b border-gray-600 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white">Textbelt</span>
              <span className="text-sm text-gray-400">Pro SMS</span>
            </div>
          </div>
        </div>
        
        {/* Navigation Menu */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <li key={item.id}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start space-x-3 text-sm font-medium rounded-lg transition-all duration-300 ease-out relative group",
                      isActive 
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/25" 
                        : "text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-gray-700 hover:to-gray-600 hover:shadow-lg"
                    )}
                    onClick={() => {
                      onTabChange(item.id);
                      onClose();
                    }}
                    data-testid={`nav-${item.id}`}
                  >
                    <Icon className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                    <span className="font-medium">{item.label}</span>
                    {isActive && <div className="absolute right-2 w-1 h-4 bg-white/30 rounded-full"></div>}
                  </Button>
                </li>
              );
            })}
          </ul>
        </nav>
        
        {/* Account Balance */}
        <div className="p-4 border-t border-gray-600">
          <div className="p-4 bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-xl border border-gray-600/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <p className="text-sm font-medium text-gray-300 uppercase tracking-wide">Balance</p>
              </div>
              {!balanceLoading && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => refetchBalance()}
                  className="h-auto p-1.5 text-gray-300 hover:text-white hover:bg-gray-600 rounded-lg transition-all duration-200"
                  data-testid="button-refresh-balance"
                >
                  <RefreshCw className="h-3 w-3 hover:rotate-180 transition-transform duration-300" />
                </Button>
              )}
            </div>
            <p className="text-sm font-bold text-white" data-testid="text-balance">
              {balanceLoading ? (
                <span className="text-gray-400 animate-pulse">Loading...</span>
              ) : balanceError ? (
                <span className="text-orange-400 text-sm font-medium">Config needed</span>
              ) : balance ? (
                <span className="text-green-400">{balance}</span>
              ) : (
                <span className="text-gray-400">--</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
