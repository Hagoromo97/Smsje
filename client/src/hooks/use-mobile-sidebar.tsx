import { useState, useEffect } from "react";
import { useIsMobile } from "./use-mobile";

export function useMobileSidebar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  useEffect(() => {
    if (!isMobile) {
      setIsSidebarOpen(false);
    }
  }, [isMobile]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('sidebar');
      const menuButton = document.querySelector('[data-testid="button-mobile-menu"]');
      
      if (isMobile && isSidebarOpen && sidebar && menuButton) {
        if (!sidebar.contains(event.target as Node) && 
            !menuButton.contains(event.target as Node)) {
          closeSidebar();
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobile, isSidebarOpen]);

  return {
    isSidebarOpen,
    toggleSidebar,
    closeSidebar
  };
}
