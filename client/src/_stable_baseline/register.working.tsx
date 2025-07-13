import React from "react";
import { Link, useLocation } from "wouter";
import { Logo } from "@/components/logo";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/context/auth-context";
import { apiRequest } from "@/lib/queryClient";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

// Password strength checker
const getPasswordStrength = (password: string): { score: number; text: string; color: string } => {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { score: 0, text: "Very Weak", color: "text-red-500" },
    { score: 1, text: "Weak", color: "text-red-400" },
    { score: 2, text: "Fair", color: "text-yellow-500" },
    { score: 3, text: "Good", color: "text-blue-500" },
    { score: 4, text: "Strong", color: "text-green-500" },
    { score: 5, text: "Very Strong", color: "text-green-600" },
  ];

  return levels[Math.min(score, 5)];
};

const Register: React.FC = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [emailCheckLoading, setEmailCheckLoading] = React.useState(false);
  const [emailExists, setEmailExists] = React.useState<boolean | null>(null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  
  const password = form.watch('password');
  const email = form.watch('email');
  const passwordStrength = password ? getPasswordStrength(password) : null;

  // Check email uniqueness with debounce
  const checkEmailUniqueness = React.useCallback(
    React.useMemo(() => {
      let timeoutId: NodeJS.Timeout;
      return (email: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          if (email && z.string().email().safeParse(email).success) {
            setEmailCheckLoading(true);
            try {
              await apiRequest('POST', '/api/check-email', { email });
              setEmailExists(false); // Email available
            } catch (error: any) {
              if (error.status === 409) {
                setEmailExists(true); // Email taken
              } else {
                setEmailExists(null); // Error checking
              }
            } finally {
              setEmailCheckLoading(false);
            }
          } else {
            setEmailExists(null);
          }
        }, 500);
      };
    }, []),
    []
  );

  React.useEffect(() => {
    if (email) {
      checkEmailUniqueness(email);
    } else {
      setEmailExists(null);
    }
  }, [email, checkEmailUniqueness]);
  
  const onSubmit = async (values: FormValues) => {
    // Prevent submission if form has validation errors or email exists
    if (!form.formState.isValid || emailExists) {
      console.log('Form has validation errors or email exists, not submitting');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Step 1: Register the user
      console.log('Starting registration for:', values.email);
      const registerData = await apiRequest('POST', '/api/register', {
        email: values.email,
        password: values.password,
      });
      
      // Verify registration succeeded
      if (!registerData || !registerData.user_id) {
        throw new Error('Registration failed - no user ID returned');
      }
      
      console.log('Registration successful, user ID:', registerData.user_id);
      
      // Show success message for registration
      toast({
        title: 'Registration Successful',
        description: 'Account created! Logging you in...',
        variant: 'default',
      });
      
      // Step 2: Automatic login after successful registration
      console.log('Attempting automatic login for:', values.email);
      
      // Use the login function from auth context instead of direct API call
      await login({
        email: values.email,
        password: values.password,
      });
      
      console.log('Login successful, redirecting to onboarding');
      
      toast({
        title: 'Welcome to StackMotive!',
        description: 'Taking you to onboarding...',
        variant: 'default',
      });
      
      // Navigate to onboarding since new users need to complete onboarding
      navigate('/onboarding');
      
    } catch (error: any) {
      console.error('Registration/Login error:', error);
      
      // Determine which step failed and show appropriate message
      let errorTitle = 'Registration Failed';
      let errorDescription = error.message || 'An error occurred during registration';
      
      // If the error mentions login or token, it's likely a login failure after successful registration
      if (error.message?.toLowerCase().includes('login') || 
          error.message?.toLowerCase().includes('token') ||
          error.message?.toLowerCase().includes('unauthorized')) {
        errorTitle = 'Login Failed';
        errorDescription = 'Account was created but automatic login failed. Please try logging in manually.';
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: 'destructive',
        duration: 10000, // Keep error visible longer
      });
      
      // DO NOT navigate away on any error - keep user on registration form
      
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <Logo className="mb-4" size="lg" />
          <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
          <CardDescription className="text-center">
            Enter your details to register for StackMotive
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Error Summary - Show validation errors prominently */}
              {Object.keys(form.formState.errors).length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                  <h3 className="text-sm font-medium text-red-800 mb-1">Please fix the following errors:</h3>
                  <ul className="text-sm text-red-700 space-y-1">
                    {Object.entries(form.formState.errors).map(([field, error]) => (
                      <li key={field} className="flex items-start">
                        <span className="mr-1">•</span>
                        <span className="capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}: {error?.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type="email" placeholder="your.email@example.com" {...field} />
                        {emailCheckLoading && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    {emailExists === true && (
                      <p className="text-sm text-red-600">This email is already registered. <Link to="/login" className="underline">Sign in instead?</Link></p>
                    )}
                    {emailExists === false && email && (
                      <p className="text-sm text-green-600">✓ Email is available</p>
                    )}
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
                    {passwordStrength && password.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span>Password strength:</span>
                          <span className={passwordStrength.color}>{passwordStrength.text}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              passwordStrength.score <= 1 ? 'bg-red-500' :
                              passwordStrength.score <= 2 ? 'bg-yellow-500' :
                              passwordStrength.score <= 3 ? 'bg-blue-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-600">
                          Try: 8+ chars, uppercase, lowercase, numbers, symbols
                        </p>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
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
                disabled={isLoading || !form.formState.isValid || emailExists === true || Object.keys(form.formState.errors).length > 0}
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></div>
                    Creating account...
                  </>
                ) : (
                  "Sign Up"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-neutral-500 dark:text-neutral-400">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Register;
