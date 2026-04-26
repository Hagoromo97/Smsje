import { useQuery } from "@tanstack/react-query";

interface UsageResponse {
  messagesSent: number;
  messagesDelivered: number;
  messagesFailed: number;
  successRate: number;
  totalSpent: string;
}

export function useAccountUsage() {
  const { data, isLoading, error, refetch } = useQuery<UsageResponse>({
    queryKey: ["/api/account/usage"],
    refetchInterval: 60000, // Refetch every minute
    retry: 1,
  });

  return {
    messagesSent: data?.messagesSent ?? 0,
    messagesDelivered: data?.messagesDelivered ?? 0,
    messagesFailed: data?.messagesFailed ?? 0,
    successRate: data?.successRate ?? 0,
    totalSpent: data?.totalSpent ?? "$0.00",
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
}