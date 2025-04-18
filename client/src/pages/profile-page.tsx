import { useState } from "react";
import Header from "@/components/header";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Eye, EyeOff, User, Key } from "lucide-react";
import { ThemeProvider } from "@/hooks/use-theme";

const apiKeysSchema = z.object({
  newsApiKey: z.string().optional(),
  geminiApiKey: z.string().optional(),
});

type ApiKeysFormValues = z.infer<typeof apiKeysSchema>;

export default function ProfilePage() {
  const { user, updateApiKeysMutation } = useAuth();
  const [showNewsApiKey, setShowNewsApiKey] = useState(false);
  const [showGeminiApiKey, setShowGeminiApiKey] = useState(false);

  const form = useForm<ApiKeysFormValues>({
    resolver: zodResolver(apiKeysSchema),
    defaultValues: {
      newsApiKey: user?.newsApiKey || "",
      geminiApiKey: user?.geminiApiKey || "",
    },
  });

  const onSubmit = (data: ApiKeysFormValues) => {
    updateApiKeysMutation.mutate(data);
  };

  return (
    <ThemeProvider>
      <div className="bg-neutral-50 text-neutral-800 min-h-screen flex flex-col dark:bg-neutral-800 dark:text-neutral-100">
        <Header />
        
        <main className="flex-1 container mx-auto px-4 py-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-neutral-800 dark:text-white">Your Profile</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* User Info Card */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Account Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Username</div>
                      <div className="text-lg font-medium mt-1">{user?.username}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Member Since</div>
                      <div className="text-lg font-medium mt-1">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* API Keys Card */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    API Keys
                  </CardTitle>
                  <CardDescription>
                    Configure your API keys to enable all features of NewsFlow. We never share your API keys with third parties.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="newsApiKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>NewsAPI Key</FormLabel>
                            <div className="relative">
                              <FormControl>
                                <Input
                                  type={showNewsApiKey ? "text" : "password"}
                                  {...field}
                                  placeholder="Enter your NewsAPI key"
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full"
                                onClick={() => setShowNewsApiKey(!showNewsApiKey)}
                              >
                                {showNewsApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                            <FormDescription>
                              <a
                                href="https://newsapi.org/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary dark:text-primary-light"
                              >
                                Get a free API key from NewsAPI.org
                              </a>
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="geminiApiKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Google Gemini API Key</FormLabel>
                            <div className="relative">
                              <FormControl>
                                <Input
                                  type={showGeminiApiKey ? "text" : "password"}
                                  {...field}
                                  placeholder="Enter your Gemini API key"
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full"
                                onClick={() => setShowGeminiApiKey(!showGeminiApiKey)}
                              >
                                {showGeminiApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                            <FormDescription>
                              <a
                                href="https://ai.google.dev/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary dark:text-primary-light"
                              >
                                Get a Gemini API key from Google AI
                              </a>
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        disabled={updateApiKeysMutation.isPending}
                      >
                        {updateApiKeysMutation.isPending ? "Saving..." : "Save API Keys"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}
