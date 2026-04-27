import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";
import LoadingIntro from "@/components/loading-intro";

// Force rebuild after removing auth page

function Router() {
  const [showIntro, setShowIntro] = useState(true);
  const [introComplete, setIntroComplete] = useState(false);

  useEffect(() => {
    // Initialize dark theme immediately
    document.documentElement.classList.add('dark');
  }, []);

  if (showIntro && !introComplete) {
    return (
      <LoadingIntro 
        onComplete={() => {
          setIntroComplete(true);
          setTimeout(() => setShowIntro(false), 100);
        }} 
      />
    );
  }

  return (
    <div className={`transition-all duration-700 ease-out ${introComplete ? 'opacity-100 transform-none' : 'opacity-0 scale-95'}`}>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
