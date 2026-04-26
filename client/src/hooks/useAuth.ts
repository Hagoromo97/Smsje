import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthStatus {
  authenticated: boolean;
  user?: User;
}

export function useAuth() {
  const { data: authStatus, isLoading } = useQuery<AuthStatus>({
    queryKey: ["/api/auth/status"],
    retry: false,
  });

  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isAuthenticated = authStatus?.authenticated || false;
  const user = authStatus?.user;

  // Auto logout after 30 minutes of inactivity
  const resetLogoutTimer = () => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
    }
    
    if (isAuthenticated) {
      logoutTimerRef.current = setTimeout(() => {
        handleLogout();
      }, 30 * 60 * 1000); // 30 minutes
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      window.location.href = "/";
    } catch (error) {
      console.error("Auto logout error:", error);
      window.location.href = "/";
    }
  };

  useEffect(() => {
    // Only setup listeners if user is authenticated
    if (!isAuthenticated) {
      // Clear any existing timer if user is not authenticated
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
        logoutTimerRef.current = null;
      }
      return;
    }

    // Track user activity for auto logout
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const resetTimer = () => resetLogoutTimer();
    
    // Add activity listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    // No longer logout on tab switch or page navigation - allow returning without password

    // Start the inactivity timer
    resetLogoutTimer();

    return () => {
      // Cleanup all listeners and timers
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
      }
      
      activityEvents.forEach(event => {
        document.removeEventListener(event, resetTimer, true);
      });
    };
  }, [isAuthenticated]);

  return {
    isLoading,
    isAuthenticated,
    user,
  };
}