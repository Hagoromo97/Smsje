import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type Contact } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MessageSquare, Edit, Trash2, Plus, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContactGridProps {
  onAddContact: () => void;
}

export default function ContactGrid({ onAddContact }: ContactGridProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contacts = [], isLoading } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/contacts/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Contact deleted",
        description: "Contact has been removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
    },
    onError: () => {
      toast({
        title: "Failed to delete contact",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      const response = await apiRequest("PATCH", `/api/contacts/${id}`, { isFavorite: !isFavorite });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
    },
    onError: () => {
      toast({
        title: "Failed to update contact",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSendMessage = (contact: Contact) => {
    window.dispatchEvent(new CustomEvent('selectContact', { 
      detail: { phone: contact.phone, name: contact.name } 
    }));
    // Switch to compose tab
    window.dispatchEvent(new CustomEvent('switchTab', { detail: 'compose' }));
  };

  const handleEditContact = (contact: Contact) => {
    window.dispatchEvent(new CustomEvent('editContact', { 
      detail: contact 
    }));
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="p-4 border border-border rounded-lg animate-pulse">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-muted rounded-full"></div>
                      <div>
                        <div className="h-4 bg-muted rounded w-20 mb-1"></div>
                        <div className="h-3 bg-muted rounded w-24"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <CardTitle>Contact Management</CardTitle>
            <div className="flex items-center space-x-3">
              <Button onClick={onAddContact} data-testid="button-add-new-contact">
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
              <Button variant="outline" data-testid="button-import-contacts">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No contacts yet</p>
              <Button onClick={onAddContact} data-testid="button-add-first-contact">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Contact
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="p-4 border border-border rounded-lg hover:shadow-md transition-shadow"
                  data-testid={`card-contact-${contact.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground font-medium text-sm">
                          {getInitials(contact.name)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground" data-testid={`text-name-${contact.id}`}>
                          {contact.name}
                        </h3>
                        <p className="text-sm text-muted-foreground" data-testid={`text-phone-${contact.id}`}>
                          {contact.phone}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFavoriteMutation.mutate({ id: contact.id, isFavorite: contact.isFavorite || false })}
                      data-testid={`button-favorite-${contact.id}`}
                    >
                      <Star 
                        className={cn(
                          "h-4 w-4",
                          contact.isFavorite ? "text-warning fill-current" : "text-muted-foreground"
                        )}
                      />
                    </Button>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleSendMessage(contact)}
                        data-testid={`button-message-${contact.id}`}
                      >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Message
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditContact(contact)}
                        data-testid={`button-edit-${contact.id}`}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteContactMutation.mutate(contact.id)}
                        disabled={deleteContactMutation.isPending}
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        data-testid={`button-delete-${contact.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
