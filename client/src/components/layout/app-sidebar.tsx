import * as React from "react"
import {
  MessageSquare,
  History,
  Users,
  Settings,
  RefreshCw,
  ChevronUp,
  LogOut,
  User2,
  CreditCard,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAccountBalance } from "@/hooks/useAccountBalance"
import { useAccountUsage } from "@/hooks/useAccountUsage"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"

type Tab = "compose" | "history" | "contacts" | "settings"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

const navigation = [
  {
    title: "Compose",
    icon: MessageSquare,
    id: "compose" as const,
  },
  {
    title: "Message History",
    icon: History,
    id: "history" as const,
  },
  {
    title: "Contacts",
    icon: Users,
    id: "contacts" as const,
  },
  {
    title: "Settings",
    icon: Settings,
    id: "settings" as const,
  },
]

export function AppSidebar({ activeTab, onTabChange, ...props }: AppSidebarProps) {
  const { balance, quotaRemaining, isLoading: balanceLoading, refetch: refetchBalance } = useAccountBalance()
  const { messagesSent, successRate } = useAccountUsage()
  const { user } = useAuth()

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" })
      window.location.href = "/"
    } catch (error) {
      console.error("Logout error:", error)
      window.location.href = "/"
    }
  }

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <MessageSquare className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Textbelt Pro</span>
                <span className="truncate text-xs">SMS Gateway</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onTabChange(item.id)}
                    isActive={activeTab === item.id}
                    tooltip={item.title}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-medium">Balance</span>
                </div>
                {!balanceLoading && (
                  <button
                    onClick={() => refetchBalance()}
                    className="rounded-md p-1 hover:bg-accent transition-colors"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </button>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-muted-foreground">Credits</span>
                  <span className="text-lg font-bold">
                    {balanceLoading ? (
                      <span className="animate-pulse">--</span>
                    ) : quotaRemaining !== null ? (
                      quotaRemaining
                    ) : (
                      "--"
                    )}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-muted-foreground">Amount</span>
                  <span className="text-sm font-semibold">
                    {balanceLoading ? (
                      <span className="animate-pulse">--</span>
                    ) : (
                      balance || "--"
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 rounded-lg border bg-card p-3 text-card-foreground shadow-sm">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Messages Sent</span>
                  <span className="font-medium">{messagesSent}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Success Rate</span>
                  <span className="font-medium">{messagesSent > 0 ? `${successRate}%` : "--"}</span>
                </div>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <User2 className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.name || "Account"}</span>
                    <span className="truncate text-xs">{user?.email || "Manage settings"}</span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem onClick={() => onTabChange("settings")}>
                  <Settings />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onTabChange("settings")}>
                  <CreditCard />
                  Purchase Credits
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
