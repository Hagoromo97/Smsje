import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useMessageStatus(textbeltId: string | null) {
  return useQuery({
    queryKey: ["message-status", textbeltId],
    queryFn: () => textbeltId ? api.messages.checkStatus(textbeltId) : null,
    enabled: !!textbeltId && textbeltId !== "null",
    refetchInterval: false, // Manual refresh only
  });
}
