import { useQuery } from "@tanstack/react-query";

interface BalanceResponse {
  success: boolean;
  quotaRemaining?: number;
  balance?: string;
  message?: string;
}

export function useAccountBalance() {
  const { data, isLoading, error, refetch } = useQuery<BalanceResponse>({
    queryKey: ["/api/account/balance"],
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: 1, // Only retry once on failure
  });

  return {
    balance: data?.balance ?? null,
    quotaRemaining: data?.quotaRemaining ?? null,
    isLoading,
    error: error?.message ?? data?.message ?? null,
    isConfigured: error?.message !== "API key not configured",
    refetch,
  };
}