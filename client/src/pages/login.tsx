import React from "react";
import { Link, useLocation } from "wouter";
import { Logo } from "@/components/logo";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSessionStore } from '../store/session';
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loading } from "@/components/ui/loading";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormValues = z.infer<typeof formSchema>;

const Login: React.FC = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const user = useSessionStore(s => s.user);
  const setSession = useSessionStore(s => s.setSession);
  const [isLoginPending, setIsLoginPending] = React.useState(false);
  const [isDemoLoginPending, setIsDemoLoginPending] = React.useState(false);

  // Let auth-context handle all redirects
  // No manual navigation needed here

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setIsLoginPending(true);
      // Mock user and token
      const user = { id: 'mock-id', email: values.email };
      const token = 'mock-token';
      await setSession(user, token);
      toast({ 
        title: "Welcome back!", 
        description: "You have successfully logged in." 
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Please check your credentials and try again",
        variant: "destructive",
      });
    } finally {
      setIsLoginPending(false);
    }
  };

  const handleDemoLogin = async () => {
    try {
      setIsDemoLoginPending(true);
      // Demo login with predefined credentials
      const user = { id: 'demo-id', email: 'demo@stackmotive.ai' };
      const token = 'demo-token';
      await setSession(user, token);
      toast({ 
        title: "Demo login successful!", 
        description: "You are now logged in with the demo account." 
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Demo login error:', error);
      toast({
        title: "Demo login failed",
        description: error instanceof Error ? error.message : "Failed to login with demo account",
        variant: "destructive",
      });
    } finally {
      setIsDemoLoginPending(false);
    }
  };

  // Always show the login form on /login page
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <Logo className="mb-4" size="lg" />
          <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter your email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoginPending || isDemoLoginPending}
              >
                {isLoginPending ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white dark:bg-neutral-900 px-2 text-gray-500 dark:text-gray-400">
                    or continue with
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleDemoLogin}
                disabled={isDemoLoginPending || isLoginPending}
              >
                {isDemoLoginPending ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent" />
                    Logging in as demo user...
                  </>
                ) : (
                  "Try Demo Account"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-neutral-500 dark:text-neutral-400">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;

