import { useQuery } from "@tanstack/react-query";
import { type Contact } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickContactsProps {
  onSelectContact: (phone: string) => void;
}

export default function QuickContacts({ onSelectContact }: QuickContactsProps) {
  const { data: contacts = [], isLoading } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  const favoriteContacts = contacts.filter(contact => contact.isFavorite).slice(0, 3);

  const handleContactClick = (contact: Contact) => {
    // Dispatch custom event that ComposeForm can listen to
    window.dispatchEvent(new CustomEvent('selectContact', { 
      detail: { phone: contact.phone, name: contact.name } 
    }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Quick Contacts
            <Button variant="ghost" size="sm" data-testid="button-add-contact">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 border border-border rounded-md animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Quick Contacts
          <Button variant="ghost" size="sm" data-testid="button-add-contact">
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {favoriteContacts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No favorite contacts yet
            </p>
          ) : (
            favoriteContacts.map((contact) => (
              <div
                key={contact.id}
                className="p-3 border border-border rounded-md hover:bg-accent cursor-pointer transition-colors"
                onClick={() => handleContactClick(contact)}
                data-testid={`contact-${contact.id}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground text-sm" data-testid={`text-contact-name-${contact.id}`}>
                      {contact.name}
                    </p>
                    <p className="text-sm text-muted-foreground" data-testid={`text-contact-phone-${contact.id}`}>
                      {contact.phone}
                    </p>
                  </div>
                  <Star className="h-4 w-4 text-warning fill-current" />
                </div>
              </div>
            ))
          )}
        </div>
        
        {favoriteContacts.length > 0 && (
          <Button 
            variant="outline" 
            className="w-full mt-4" 
            size="sm"
            data-testid="button-view-all-contacts"
          >
            View All Contacts
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
