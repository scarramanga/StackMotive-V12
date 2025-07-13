import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useAuth() {
  const queryClient = useQueryClient();
  
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/user"],
    retry: false,
  });

  // Regular login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await apiRequest("POST", "/api/login", credentials);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    }
  });

  // Demo login mutation (no credentials needed)
  const demoLoginMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/demo-login", {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    }
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/logout", {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    }
  });

  // Simple wrapper functions for the mutations with callbacks
  const login = async (
    credentials: { username: string; password: string }, 
    options?: { onSuccess?: () => void; onError?: (error: any) => void; }
  ) => {
    return loginMutation.mutate(credentials, options);
  };

  const demoLogin = async (
    options?: { onSuccess?: () => void; onError?: (error: any) => void; }
  ) => {
    return demoLoginMutation.mutate(undefined, options);
  };

  const logout = async (
    options?: { onSuccess?: () => void; onError?: (error: any) => void; }
  ) => {
    return logoutMutation.mutate(undefined, options);
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    demoLogin,
    logout,
    loginMutation,
    demoLoginMutation,
    logoutMutation
  };
}