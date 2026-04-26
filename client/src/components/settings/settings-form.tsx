import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type Settings, updateSettingsSchema, type UpdateSettings } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Eye, EyeOff, Plug, Save, RefreshCw, ShoppingCart, Phone } from "lucide-react";
import { useState, useEffect } from "react";
import { useAccountUsage } from "@/hooks/useAccountUsage";
import { usePurchaseCredits } from "@/hooks/usePurchaseCredits";
import { usePhoneVerify } from "@/hooks/usePhoneVerify";

export default function SettingsForm() {
  const [showApiKey, setShowApiKey] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [purchaseQuantity, setPurchaseQuantity] = useState(10);
  const [phoneToVerify, setPhoneToVerify] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { 
    messagesSent, 
    successRate, 
    totalSpent, 
    isLoading: usageLoading,
    refetch: refetchUsage
  } = useAccountUsage();
  
  const purchaseMutation = usePurchaseCredits();
  const verifyPhoneMutation = usePhoneVerify();

  const { data: settings, isLoading, refetch: refetchSettings } = useQuery<Settings>({
    queryKey: ["/api/settings"],
  });

  const form = useForm<UpdateSettings>({
    resolver: zodResolver(updateSettingsSchema),
    defaultValues: {
      apiKey: "",
      token: "",
      apiEndpoint: "https://textbelt.com/text",
      defaultCountryCode: "+60",
      autoSaveDrafts: true,
      messageConfirmations: false,
    },
  });

  // Update form when settings data loads
  useEffect(() => {
    if (settings) {
      form.reset({
        apiKey: settings.apiKey || "",
        token: settings.token || "",
        apiEndpoint: settings.apiEndpoint || "https://textbelt.com/text",
        defaultCountryCode: settings.defaultCountryCode || "+60",
        autoSaveDrafts: settings.autoSaveDrafts ?? true,
        messageConfirmations: settings.messageConfirmations ?? false,
      });
    }
  }, [settings, form]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: UpdateSettings) => {
      const response = await apiRequest("POST", "/api/settings", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save settings",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: async (data: { apiKey: string; apiEndpoint: string }) => {
      const response = await apiRequest("POST", "/api/settings/test", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Connection successful",
        description: "Your API key is valid and working.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Connection failed",
        description: error.message || "Please check your API key and try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UpdateSettings) => {
    updateSettingsMutation.mutate(data);
  };

  const handleTestConnection = () => {
    const apiKey = form.getValues("apiKey");
    const apiEndpoint = form.getValues("apiEndpoint");
    
    if (!apiKey) {
      toast({
        title: "API key required",
        description: "Please enter your API key before testing.",
        variant: "destructive",
      });
      return;
    }

    testConnectionMutation.mutate({ apiKey, apiEndpoint: apiEndpoint || "https://textbelt.com/text" });
  };

  const handlePurchase = () => {
    if (purchaseQuantity < 1) {
      toast({
        title: "Invalid quantity",
        description: "Please enter a quantity of at least 1",
        variant: "destructive",
      });
      return;
    }
    purchaseMutation.mutate(purchaseQuantity);
  };

  const handleVerifyPhone = () => {
    if (!phoneToVerify) {
      toast({
        title: "Phone number required",
        description: "Please enter a phone number to verify",
        variant: "destructive",
      });
      return;
    }
    verifyPhoneMutation.mutate(phoneToVerify, {
      onSuccess: (data) => {
        toast({
          title: "Phone Verification",
          description: `Format: ${data.isValidFormat ? '✅ Valid' : '❌ Invalid'}\nNormalized: ${data.normalized}`,
        });
      },
      onError: (error: any) => {
        toast({
          title: "Verification failed",
          description: error.message || "Please try again.",
          variant: "destructive",
        });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-10 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-10 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* API Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>API Configuration</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetchSettings()}
              className="text-gray-500 hover:text-gray-700"
              data-testid="button-refresh-settings"
            >
              <RefreshCw className="h-4 w-4 hover:rotate-180 transition-transform duration-300" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="apiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Textbelt API Key</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          type={showApiKey ? "text" : "password"}
                          placeholder="Enter your API key"
                          data-testid="input-api-key"
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-0 h-full"
                        onClick={() => setShowApiKey(!showApiKey)}
                        data-testid="button-toggle-api-key"
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <FormDescription>
                      Get your API key from{" "}
                      <a 
                        href="https://textbelt.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        textbelt.com
                      </a>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="token"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Authentication Token</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          type={showToken ? "text" : "password"}
                          placeholder="Enter your authentication token"
                          data-testid="input-token"
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-0 h-full"
                        onClick={() => setShowToken(!showToken)}
                        data-testid="button-toggle-token"
                      >
                        {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <FormDescription>
                      Optional authentication token for additional security
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="apiEndpoint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Endpoint</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? "https://textbelt.com/text"}
                        type="url"
                        readOnly
                        data-testid="input-api-endpoint"
                        className="bg-muted"
                      />
                    </FormControl>
                    <FormDescription>
                      Textbelt uses <strong>/text</strong> endpoint for all countries. Include country code in phone number (e.g., +60 for Malaysia).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={testConnectionMutation.isPending}
                  data-testid="button-test-connection"
                >
                  <Plug className="h-4 w-4 mr-2" />
                  {testConnectionMutation.isPending ? "Testing..." : "Test Connection"}
                </Button>
                <Button
                  type="submit"
                  disabled={updateSettingsMutation.isPending}
                  data-testid="button-save-settings"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Message Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Message Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="defaultCountryCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Country Code</FormLabel>
                    <Select value={field.value ?? "+60"} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-country-code">
                          <SelectValue placeholder="Select country code" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="+60">Malaysia (+60)</SelectItem>
                        <SelectItem value="+1">United States (+1)</SelectItem>
                        <SelectItem value="+44">United Kingdom (+44)</SelectItem>
                        <SelectItem value="+49">Germany (+49)</SelectItem>
                        <SelectItem value="+33">France (+33)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="autoSaveDrafts"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm">Auto-save drafts</FormLabel>
                      <FormDescription>
                        Automatically save message drafts while typing
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value ?? true}
                        onCheckedChange={field.onChange}
                        data-testid="switch-auto-save"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="messageConfirmations"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm">Message confirmations</FormLabel>
                      <FormDescription>
                        Show confirmation dialog before sending
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value ?? true}
                        onCheckedChange={field.onChange}
                        data-testid="switch-confirmations"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </Form>
        </CardContent>
      </Card>

      {/* Account Usage */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Account Usage</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetchUsage()}
              className="text-gray-500 hover:text-gray-700"
              data-testid="button-refresh-usage"
            >
              <RefreshCw className="h-4 w-4 hover:rotate-180 transition-transform duration-300" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-sm font-bold text-foreground" data-testid="text-messages-sent">
                {usageLoading ? (
                  <span className="animate-pulse">--</span>
                ) : (
                  messagesSent
                )}
              </p>
              <p className="text-sm text-muted-foreground">Messages Sent</p>
            </div>
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-sm font-bold text-foreground" data-testid="text-total-spent">
                {usageLoading ? (
                  <span className="animate-pulse">--</span>
                ) : (
                  totalSpent
                )}
              </p>
              <p className="text-sm text-muted-foreground">Total Spent</p>
            </div>
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-sm font-bold text-foreground" data-testid="text-success-rate">
                {usageLoading ? (
                  <span className="animate-pulse">--</span>
                ) : (
                  messagesSent > 0 ? `${successRate}%` : "--"
                )}
              </p>
              <p className="text-sm text-muted-foreground">Success Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Credits */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Credits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="purchase-quantity">Number of texts to purchase</Label>
              <div className="flex space-x-2 mt-2">
                <Input
                  id="purchase-quantity"
                  type="number"
                  min="1"
                  value={purchaseQuantity}
                  onChange={(e) => setPurchaseQuantity(parseInt(e.target.value) || 1)}
                  className="flex-1"
                  data-testid="input-purchase-quantity"
                />
                <Button
                  onClick={handlePurchase}
                  disabled={purchaseMutation.isPending}
                  data-testid="button-purchase"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {purchaseMutation.isPending ? "Processing..." : "Purchase"}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Estimated cost: ${(purchaseQuantity * 0.04).toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phone Verification */}
      <Card>
        <CardHeader>
          <CardTitle>Phone Number Verification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="phone-verify">Phone number to verify</Label>
              <div className="flex space-x-2 mt-2">
                <Input
                  id="phone-verify"
                  type="tel"
                  placeholder="+60123456789"
                  value={phoneToVerify}
                  onChange={(e) => setPhoneToVerify(e.target.value)}
                  className="flex-1"
                  data-testid="input-phone-verify"
                />
                <Button
                  onClick={handleVerifyPhone}
                  disabled={verifyPhoneMutation.isPending}
                  data-testid="button-verify-phone"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  {verifyPhoneMutation.isPending ? "Verifying..." : "Verify"}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Check if a phone number format is valid before sending
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
