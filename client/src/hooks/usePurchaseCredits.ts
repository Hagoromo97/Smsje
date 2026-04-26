import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function usePurchaseCredits() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (quantity: number) => api.account.purchase(quantity),
    onSuccess: (data) => {
      toast({
        title: "Purchase Link Generated",
        description: `Click to purchase ${data.quantity} texts for ${data.estimatedCost}`,
      });
      
      // Open purchase URL in new tab
      if (data.purchaseUrl) {
        window.open(data.purchaseUrl, "_blank");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to generate purchase link",
        variant: "destructive",
      });
    },
  });
}
