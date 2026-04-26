import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function usePhoneVerify() {
  return useMutation({
    mutationFn: (phone: string) => api.phone.verify(phone),
  });
}
