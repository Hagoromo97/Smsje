import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { insertContactSchema, type InsertContact, type Contact } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingContact?: Contact | null;
}

export default function ContactModal({ isOpen, onClose, editingContact }: ContactModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertContact>({
    resolver: zodResolver(insertContactSchema),
    defaultValues: {
      name: "",
      phone: "",
      isFavorite: false,
    },
  });

  const createContactMutation = useMutation({
    mutationFn: async (data: InsertContact) => {
      const response = await apiRequest("POST", "/api/contacts", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Contact added",
        description: "New contact has been saved successfully.",
      });
      form.reset();
      onClose();
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add contact",
        description: error.message || "Please check the information and try again.",
        variant: "destructive",
      });
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: async (data: InsertContact) => {
      const response = await apiRequest("PATCH", `/api/contacts/${editingContact?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Contact updated",
        description: "Contact has been updated successfully.",
      });
      form.reset();
      onClose();
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update contact",
        description: error.message || "Please check the information and try again.",
        variant: "destructive",
      });
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (editingContact) {
      form.reset({
        name: editingContact.name,
        phone: editingContact.phone,
        isFavorite: editingContact.isFavorite ?? false,
      });
    } else {
      form.reset({
        name: "",
        phone: "",
        isFavorite: false,
      });
    }
  }, [editingContact, form]);

  const onSubmit = (data: InsertContact) => {
    if (editingContact) {
      updateContactMutation.mutate(data);
    } else {
      createContactMutation.mutate(data);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-testid="modal-add-contact">
        <DialogHeader>
          <DialogTitle>{editingContact ? "Edit Contact" : "Add New Contact"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter contact name"
                      data-testid="input-contact-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      data-testid="input-contact-phone"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isFavorite"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                      data-testid="checkbox-favorite"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Add to favorites</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            
            <div className="flex space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={handleClose}
                data-testid="button-cancel-contact"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={createContactMutation.isPending || updateContactMutation.isPending}
                data-testid="button-save-contact"
              >
                {(createContactMutation.isPending || updateContactMutation.isPending) 
                  ? "Saving..." 
                  : editingContact 
                    ? "Update Contact" 
                    : "Save Contact"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
