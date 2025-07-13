import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { 
  Eye,
  Users,
  Share2,
  Plus,
  Edit,
  Trash2,
  Lock,
  Unlock,
  Star,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface WatchlistItem {
  symbol: string;
  name: string;
  price: number;
  change_24h: number;
  market_cap?: number;
  addedAt: string;
  notes?: string;
}

interface Watchlist {
  id: string;
  name: string;
  description?: string;
  items: WatchlistItem[];
  ownerId: string;
  sharedWith: string[];
  isPublic: boolean;
  isReadOnly: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SharedWatchlistResponse {
  watchlist: Watchlist;
  sharedBy: string;
  sharedAt: string;
  canEdit: boolean;
}

export default function WatchlistPanel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // State management
  const [selectedTab, setSelectedTab] = useState<'owned' | 'shared'>('owned');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedWatchlist, setSelectedWatchlist] = useState<Watchlist | null>(null);
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [newWatchlistDescription, setNewWatchlistDescription] = useState('');
  const [shareUserId, setShareUserId] = useState('');
  const [shareReadOnly, setShareReadOnly] = useState(false);

  // Fetch watchlists
  const { data: watchlistData, isLoading, error } = useQuery({
    queryKey: ['/api/watchlist', (user as any)?.id],
    queryFn: async () => {
      const userId = (user as any)?.id || '1';
      const res = await fetch(`/api/watchlist?user_id=${userId}&include_shared=true`);
      if (!res.ok) throw new Error('Failed to fetch watchlists');
      return res.json();
    },
    enabled: !!user,
    refetchInterval: 60000,
  });

  // Create watchlist mutation
  const createWatchlistMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; isPublic: boolean }) => {
      const userId = (user as any)?.id || '1';
      const res = await fetch(`/api/watchlist?user_id=${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          isPublic: data.isPublic,
          items: []
        })
      });
      if (!res.ok) throw new Error('Failed to create watchlist');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/watchlist'] });
      setShowCreateModal(false);
      setNewWatchlistName('');
      setNewWatchlistDescription('');
    }
  });

  // Share watchlist mutation
  const shareWatchlistMutation = useMutation({
    mutationFn: async (data: { watchlistId: string; recipientId: string; readOnly: boolean }) => {
      const userId = (user as any)?.id || '1';
      const res = await fetch(`/api/watchlist/share?user_id=${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to share watchlist');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/watchlist'] });
      setShowShareModal(false);
      setShareUserId('');
      setShareReadOnly(false);
    }
  });

  // Delete watchlist mutation
  const deleteWatchlistMutation = useMutation({
    mutationFn: async (watchlistId: string) => {
      const userId = (user as any)?.id || '1';
      const res = await fetch(`/api/watchlist/${watchlistId}?user_id=${userId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete watchlist');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/watchlist'] });
    }
  });

  // Handle create watchlist
  const handleCreateWatchlist = () => {
    if (!newWatchlistName.trim()) return;
    
    createWatchlistMutation.mutate({
      name: newWatchlistName,
      description: newWatchlistDescription,
      isPublic: false
    });
  };

  // Handle share watchlist
  const handleShareWatchlist = () => {
    if (!selectedWatchlist || !shareUserId.trim()) return;
    
    shareWatchlistMutation.mutate({
      watchlistId: selectedWatchlist.id,
      recipientId: shareUserId,
      readOnly: shareReadOnly
    });
  };

  // Handle delete watchlist
  const handleDeleteWatchlist = (watchlist: Watchlist) => {
    if (confirm(`Are you sure you want to delete "${watchlist.name}"?`)) {
      deleteWatchlistMutation.mutate(watchlist.id);
    }
  };

  // Open share modal
  const openShareModal = (watchlist: Watchlist) => {
    setSelectedWatchlist(watchlist);
    setShowShareModal(true);
  };

  const ownedWatchlists: Watchlist[] = watchlistData?.owned || [];
  const sharedWatchlists: SharedWatchlistResponse[] = watchlistData?.shared || [];

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading watchlists: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Watchlists
              <Badge variant="secondary" className="text-xs">
                {ownedWatchlists.length + sharedWatchlists.length} total
              </Badge>
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Watchlist
            </Button>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <div className="flex gap-4 border-b">
        <button
          onClick={() => setSelectedTab('owned')}
          className={`px-4 py-2 font-medium ${
            selectedTab === 'owned' 
              ? 'border-b-2 border-primary text-primary' 
              : 'text-muted-foreground'
          }`}
        >
          My Watchlists ({ownedWatchlists.length})
        </button>
        <button
          onClick={() => setSelectedTab('shared')}
          className={`px-4 py-2 font-medium ${
            selectedTab === 'shared' 
              ? 'border-b-2 border-primary text-primary' 
              : 'text-muted-foreground'
          }`}
        >
          Shared with me ({sharedWatchlists.length})
        </button>
      </div>

      {/* Content */}
      {selectedTab === 'owned' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-48 bg-muted rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : ownedWatchlists.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No watchlists yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first watchlist to track your favorite assets
                </p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Watchlist
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ownedWatchlists.map((watchlist) => (
                <Card key={watchlist.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{watchlist.name}</span>
                        {watchlist.isPublic && (
                          <Badge variant="outline" className="text-xs">Public</Badge>
                        )}
                        {watchlist.sharedWith.length > 0 && (
                          <Badge className="bg-blue-100 text-blue-800 text-xs">
                            Shared
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openShareModal(watchlist)}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteWatchlist(watchlist)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                    {watchlist.description && (
                      <p className="text-sm text-muted-foreground">{watchlist.description}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-sm">
                        <strong>{watchlist.items.length}</strong> assets
                      </div>
                      
                      {watchlist.items.slice(0, 3).map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{item.symbol}</div>
                            <div className="text-xs text-muted-foreground">{item.name}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">${item.price.toLocaleString()}</div>
                            <div className={`text-xs flex items-center gap-1 ${
                              item.change_24h >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {item.change_24h >= 0 ? (
                                <TrendingUp className="h-3 w-3" />
                              ) : (
                                <TrendingDown className="h-3 w-3" />
                              )}
                              {item.change_24h.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {watchlist.items.length > 3 && (
                        <div className="text-xs text-muted-foreground text-center">
                          +{watchlist.items.length - 3} more assets
                        </div>
                      )}

                      {watchlist.sharedWith.length > 0 && (
                        <div className="pt-2 border-t">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              Shared with {watchlist.sharedWith.length} user{watchlist.sharedWith.length > 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedTab === 'shared' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-muted rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : sharedWatchlists.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No shared watchlists</h3>
                <p className="text-muted-foreground">
                  Watchlists shared with you will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sharedWatchlists.map((sharedItem) => {
                const watchlist = sharedItem.watchlist;
                return (
                  <Card key={watchlist.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="truncate">{watchlist.name}</span>
                          {!sharedItem.canEdit && (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          Shared
                        </Badge>
                      </CardTitle>
                      {watchlist.description && (
                        <p className="text-sm text-muted-foreground">{watchlist.description}</p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="text-sm">
                          <strong>{watchlist.items.length}</strong> assets
                        </div>
                        
                        {watchlist.items.slice(0, 3).map((item, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{item.symbol}</div>
                              <div className="text-xs text-muted-foreground">{item.name}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">${item.price.toLocaleString()}</div>
                              <div className={`text-xs flex items-center gap-1 ${
                                item.change_24h >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {item.change_24h >= 0 ? (
                                  <TrendingUp className="h-3 w-3" />
                                ) : (
                                  <TrendingDown className="h-3 w-3" />
                                )}
                                {item.change_24h.toFixed(2)}%
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {watchlist.items.length > 3 && (
                          <div className="text-xs text-muted-foreground text-center">
                            +{watchlist.items.length - 3} more assets
                          </div>
                        )}

                        <div className="pt-2 border-t">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Shared by {sharedItem.sharedBy}</span>
                            <span>{sharedItem.canEdit ? 'Can edit' : 'Read only'}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Create Watchlist Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Watchlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={newWatchlistName}
                onChange={(e) => setNewWatchlistName(e.target.value)}
                placeholder="Enter watchlist name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description (optional)</label>
              <Input
                value={newWatchlistDescription}
                onChange={(e) => setNewWatchlistDescription(e.target.value)}
                placeholder="Enter description"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateWatchlist}
                disabled={!newWatchlistName.trim() || createWatchlistMutation.isPending}
              >
                {createWatchlistMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Watchlist Modal */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Watchlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">User ID to share with</label>
              <Input
                value={shareUserId}
                onChange={(e) => setShareUserId(e.target.value)}
                placeholder="Enter user ID"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="readOnly"
                checked={shareReadOnly}
                onChange={(e) => setShareReadOnly(e.target.checked)}
              />
              <label htmlFor="readOnly" className="text-sm">Read-only access</label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowShareModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleShareWatchlist}
                disabled={!shareUserId.trim() || shareWatchlistMutation.isPending}
              >
                {shareWatchlistMutation.isPending ? 'Sharing...' : 'Share'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 