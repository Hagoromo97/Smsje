import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PaperAirplaneIcon, BookmarkIcon, CalendarIcon, PaperClipIcon, UserIcon } from "@heroicons/react/24/outline";

const messageSchema = z.object({
  recipientPhone: z.string().min(1, "Phone number is required"),
  recipientName: z.string().optional(),
  content: z.string().min(1, "Message content is required").max(1600, "Message too long"),
});

type MessageFormData = z.infer<typeof messageSchema>;

interface ComposeFormProps {
  onShowContacts: () => void;
}

export default function ComposeForm({ onShowContacts }: ComposeFormProps) {
  const [charCount, setCharCount] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      recipientPhone: "",
      recipientName: "",
      content: "",
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: MessageFormData) => {
      const response = await apiRequest("POST", "/api/messages/send", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Message sent successfully!",
        description: "Your SMS has been delivered.",
      });
      form.reset();
      setCharCount(0);
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send message",
        description: error.message || "Please check your settings and try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MessageFormData) => {
    sendMessageMutation.mutate(data);
  };

  const handleContentChange = (value: string) => {
    setCharCount(value.length);
    form.setValue("content", value);
  };

  const smsCount = Math.ceil(charCount / 160) || 1;
  const estimatedCost = (smsCount * 0.04).toFixed(2);

  // Listen for contact selection events
  useEffect(() => {
    const handleSelectContact = (event: CustomEvent) => {
      const { phone, name } = event.detail;
      form.setValue("recipientPhone", phone);
      form.setValue("recipientName", name || "");
    };

    window.addEventListener('selectContact', handleSelectContact as EventListener);
    
    return () => {
      window.removeEventListener('selectContact', handleSelectContact as EventListener);
    };
  }, [form]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send New Message</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="recipientPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="+60123456789"
                        data-testid="input-phone"
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-0 h-full"
                      onClick={onShowContacts}
                      data-testid="button-select-contact"
                    >
                      <UserIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Enter phone number with country code
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={4}
                      placeholder="Type your message here..."
                      className="resize-none"
                      onChange={(e) => {
                        field.onChange(e);
                        handleContentChange(e.target.value);
                      }}
                      data-testid="textarea-message"
                    />
                  </FormControl>
                  <div className="flex justify-between items-center text-sm">
                    <span 
                      className={cn(
                        "text-muted-foreground",
                        charCount > 160 && "text-warning"
                      )}
                      data-testid="text-char-count"
                    >
                      {charCount}/160 characters
                    </span>
                    <span className="text-muted-foreground" data-testid="text-cost-estimate">
                      Est. cost: ${estimatedCost}
                    </span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <Button 
                type="button" 
                variant="secondary" 
                size="sm"
                onClick={onShowContacts}
                data-testid="button-select-from-contacts"
              >
                <UserIcon className="h-3 w-3 mr-1" />
                Select Contact
              </Button>
              <Button 
                type="button" 
                variant="secondary" 
                size="sm"
                data-testid="button-template"
              >
                <CalendarIcon className="h-3 w-3 mr-1" />
                Template
              </Button>
              <Button 
                type="button" 
                variant="secondary" 
                size="sm"
                data-testid="button-schedule"
              >
                <CalendarIcon className="h-3 w-3 mr-1" />
                Schedule
              </Button>
              <Button 
                type="button" 
                variant="secondary" 
                size="sm"
                data-testid="button-attach"
              >
                <PaperClipIcon className="h-3 w-3 mr-1" />
                Attach
              </Button>
            </div>

            {/* Send Button */}
            <div className="flex space-x-3 pt-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={sendMessageMutation.isPending}
                data-testid="button-send-message"
              >
                <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                data-testid="button-save-draft"
              >
                <BookmarkIcon className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
