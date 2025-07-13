import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useSessionStore } from '../store/session';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Users, Shield, Eye, EyeOff, RefreshCw, UserPlus } from 'lucide-react';

interface AdminUser {
  id: number;
  email: string;
  is_active: boolean;
  is_admin: boolean;
  has_completed_onboarding: boolean;
  onboarding_step: number;
  preferred_currency: string;
  created_at: string;
}

export default function AdminTestersPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = useSessionStore(s => s.user);
  const isAdmin = user?.email?.endsWith('@stackmotive.dev');
  
  // Check admin access
  // If user is needed, replace with Zustand session store usage or a placeholder.
  
  if (!isAdmin) {
    return (
      <div className='p-4'>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">You need admin privileges to access this page.</p>
              <Button onClick={() => navigate('/')} className="mt-4">
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch all users (admin only)
  const { 
    data: allUsers = [], 
    isLoading: isLoadingUsers,
    refetch: refetchUsers
  } = useQuery<AdminUser[]>({
    queryKey: ['/api/admin/users'],
    enabled: !!user && isAdmin,
    staleTime: 60000
  });

  // Toggle user admin status
  const toggleAdminMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: number; isAdmin: boolean }) => {
      return apiRequest('POST', `/api/admin/users/${userId}/toggle-admin`, { isAdmin });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User admin status updated successfully",
      });
      refetchUsers();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update user admin status",
        variant: "destructive",
      });
    }
  });

  // Reset user onboarding
  const resetOnboardingMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest('POST', `/api/admin/users/${userId}/reset-onboarding`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User onboarding reset successfully",
      });
      refetchUsers();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to reset user onboarding",
        variant: "destructive",
      });
    }
  });

  // Toggle user active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: number; isActive: boolean }) => {
      return apiRequest('POST', `/api/admin/users/${userId}/toggle-active`, { isActive });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User status updated successfully",
      });
      refetchUsers();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update user status",
        variant: "destructive",
      });
    }
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getOnboardingStatus = (user: AdminUser) => {
    if (user.has_completed_onboarding) {
      return <Badge variant="default">Completed</Badge>;
    }
    return <Badge variant="secondary">Step {user.onboarding_step}/4</Badge>;
  };

  const activeUsers = allUsers.filter(u => u.is_active);
  const inactiveUsers = allUsers.filter(u => !u.is_active);
  const adminUsers = allUsers.filter(u => u.is_admin);
  const pendingOnboarding = allUsers.filter(u => !u.has_completed_onboarding);

  return (
    <div className='p-4'>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Manage user accounts, permissions, and onboarding status</p>
          </div>
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Test User
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{allUsers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Eye className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold">{activeUsers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Admin Users</p>
                  <p className="text-2xl font-bold">{adminUsers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <RefreshCw className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Pending Onboarding</p>
                  <p className="text-2xl font-bold">{pendingOnboarding.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              All Users ({allUsers.length})
            </CardTitle>
            <CardDescription>
              Manage user accounts, permissions, and onboarding status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingUsers ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Onboarding</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allUsers.map((adminUser) => (
                    <TableRow key={adminUser.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{adminUser.email}</div>
                          <div className="text-sm text-muted-foreground">ID: {adminUser.id}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={adminUser.is_active ? "default" : "destructive"}>
                          {adminUser.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={adminUser.is_admin ? "default" : "secondary"}>
                          {adminUser.is_admin ? "Admin" : "User"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getOnboardingStatus(adminUser)}
                      </TableCell>
                      <TableCell>{adminUser.preferred_currency || 'USD'}</TableCell>
                      <TableCell>{formatDate(adminUser.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleAdminMutation.mutate({ 
                              userId: adminUser.id, 
                              isAdmin: !adminUser.is_admin 
                            })}
                            disabled={toggleAdminMutation.isPending}
                            title={adminUser.is_admin ? "Remove Admin" : "Make Admin"}
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                          
                          {!adminUser.has_completed_onboarding && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resetOnboardingMutation.mutate(adminUser.id)}
                              disabled={resetOnboardingMutation.isPending}
                              title="Reset Onboarding"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant={adminUser.is_active ? "destructive" : "default"}
                            onClick={() => toggleActiveMutation.mutate({ 
                              userId: adminUser.id, 
                              isActive: !adminUser.is_active 
                            })}
                            disabled={toggleActiveMutation.isPending}
                            title={adminUser.is_active ? "Deactivate User" : "Activate User"}
                          >
                            {adminUser.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 