import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useFirebaseCollection } from "@/hooks/useFirebaseData";
import { 
  Search, 
  Filter, 
  Shield, 
  ShieldOff, 
  Eye, 
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  UserCheck,
  UserX,
  Crown,
  TrendingUp,
  DollarSign,
  MoreVertical,
  Download,
  RefreshCw,
  Star,
  Clock,
  Activity,
  X
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Helper to format address objects or strings
function formatAddress(addr) {
  if (!addr) return '';
  if (typeof addr === 'string') return addr;
  if (typeof addr === 'object') {
    return [
      addr.address,
      addr.city,
      addr.state,
      addr.pincode
    ].filter(Boolean).join(', ');
  }
  return '';
}

export function UserManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  
  const { data: users, loading, error, updateDocument, deleteDocument } = useFirebaseCollection('users');
  const { data: orders } = useFirebaseCollection('orders');

  // Enhanced user stats with real data
  const userStats = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'active' || !u.status).length;
    const bannedUsers = users.filter(u => u.status === 'banned').length;
    const premiumUsers = users.filter(u => u.category === 'Premium').length;
    
    // Calculate total revenue from orders
    const totalRevenue = orders.reduce((sum, order) => {
      let orderTotal = 0;
      if (order.items && Array.isArray(order.items)) {
        orderTotal += order.items.reduce((itemSum, item) => 
          itemSum + (parseFloat(item.price || 0) * (parseInt(item.quantity) || 1)), 0);
      }
      if (order.deliveryFee) orderTotal += parseFloat(order.deliveryFee) || 0;
      if (order.tip) orderTotal += parseFloat(order.tip) || 0;
      if (order.tax) orderTotal += parseFloat(order.tax) || 0;
      return sum + orderTotal;
    }, 0);

    // Calculate average order value
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    return {
      total: totalUsers,
      active: activeUsers,
      banned: bannedUsers,
      premium: premiumUsers,
      totalRevenue,
      avgOrderValue,
      totalOrders: orders.length
    };
  }, [users, orders]);

  // Enhanced filtering and sorting
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter(user => {
      const matchesSearch = (
        (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.phone || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
      const matchesCategory = filterCategory === 'all' || user.category === filterCategory;
      
      return matchesSearch && matchesStatus && matchesCategory;
    });

    // Sort users
    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'recent':
        filtered.sort((a, b) => {
          const aDate = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(0);
          const bDate = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(0);
          return bDate.getTime() - aDate.getTime();
        });
        break;
      case 'orders':
        filtered.sort((a, b) => (b.totalOrders || 0) - (a.totalOrders || 0));
        break;
      case 'spent':
        filtered.sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0));
        break;
      default:
        break;
    }

    return filtered;
  }, [users, searchTerm, filterStatus, filterCategory, sortBy]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 flex items-center gap-1"><UserCheck className="w-3 h-3" />Active</Badge>;
      case 'banned':
        return <Badge className="bg-red-100 text-red-800 flex items-center gap-1"><UserX className="w-3 h-3" />Banned</Badge>;
      case 'suspended':
        return <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1"><Clock className="w-3 h-3" />Suspended</Badge>;
      default:
        return <Badge className="bg-green-100 text-green-800 flex items-center gap-1"><UserCheck className="w-3 h-3" />Active</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'Premium':
        return <Badge className="bg-purple-100 text-purple-800 flex items-center gap-1"><Crown className="w-3 h-3" />Premium</Badge>;
      case 'Regular':
        return <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1"><Users className="w-3 h-3" />Regular</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1"><Users className="w-3 h-3" />Regular</Badge>;
    }
  };

  const getUserActivityLevel = (user: any) => {
    const orderCount = user.totalOrders || 0;
    if (orderCount >= 10) return { level: 'High', color: 'text-green-600', icon: <Activity className="w-4 h-4" /> };
    if (orderCount >= 5) return { level: 'Medium', color: 'text-yellow-600', icon: <Activity className="w-4 h-4" /> };
    return { level: 'Low', color: 'text-gray-600', icon: <Activity className="w-4 h-4" /> };
  };

  const handleUserStatusToggle = async (userId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'banned' : 'active';
      await updateDocument(userId, { status: newStatus });
      console.log('User status updated successfully');
    } catch (error) {
      console.error('Failed to update user status:', error);
    }
  };

  const handleExportUsers = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Status', 'Category', 'Total Orders', 'Total Spent', 'Join Date'].join(','),
      ...filteredAndSortedUsers.map(user => [
        user.name || 'Unknown',
        user.email || '',
        user.phone || '',
        user.status || 'active',
        user.category || 'Regular',
        user.totalOrders || 0,
        user.totalSpent || 0,
        user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users-export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <div className="text-lg">Loading users...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Error loading users: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-600 mt-1">Manage and monitor your customer base</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportUsers}>
            <Download className="w-4 h-4 mr-2" />
            Export Users
          </Button>
        </div>
      </div>

      {/* Enhanced User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600">{userStats.total}</p>
                <p className="text-sm text-blue-700">Total Users</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">{userStats.active}</p>
                <p className="text-sm text-green-700">Active Users</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-600">{userStats.premium}</p>
                <p className="text-sm text-purple-700">Premium Users</p>
              </div>
              <Crown className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-orange-50 to-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-600">₹{userStats.totalRevenue.toFixed(2)}</p>
                <p className="text-sm text-orange-700">Total Revenue</p>
              </div>
              <DollarSign className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-lg font-bold text-gray-800">₹{userStats.avgOrderValue.toFixed(2)}</p>
              <p className="text-sm text-gray-600">Average Order Value</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-lg font-bold text-gray-800">{userStats.totalOrders}</p>
              <p className="text-sm text-gray-600">Total Orders</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-lg font-bold text-red-600">{userStats.banned}</p>
              <p className="text-sm text-gray-600">Banned Users</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Filters & Search</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              {showAdvancedFilters ? 'Hide' : 'Show'} Advanced
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input 
                placeholder="Search users..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="banned">Banned</option>
              <option value="suspended">Suspended</option>
            </select>
            
            <select 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="all">All Categories</option>
              <option value="Regular">Regular</option>
              <option value="Premium">Premium</option>
            </select>
            
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="recent">Most Recent</option>
              <option value="name">Name A-Z</option>
              <option value="orders">Most Orders</option>
              <option value="spent">Highest Spent</option>
            </select>
          </div>
          
          {showAdvancedFilters && (
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Activity Level</label>
                  <select className="w-full px-3 py-2 border rounded-md">
                    <option value="all">All Levels</option>
                    <option value="high">High Activity</option>
                    <option value="medium">Medium Activity</option>
                    <option value="low">Low Activity</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Join Date</label>
                  <select className="w-full px-3 py-2 border rounded-md">
                    <option value="all">All Time</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                    <option value="90d">Last 90 Days</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order Range</label>
                  <select className="w-full px-3 py-2 border rounded-md">
                    <option value="all">All Orders</option>
                    <option value="0-5">0-5 Orders</option>
                    <option value="6-20">6-20 Orders</option>
                    <option value="20+">20+ Orders</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {filteredAndSortedUsers.length} of {users.length} users
        </p>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <TrendingUp className="w-4 h-4" />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {filteredAndSortedUsers.map(user => {
          const activityLevel = getUserActivityLevel(user);
          const joinDate = user.createdAt?.seconds ? new Date(user.createdAt.seconds * 1000) : null;
          const userDisplayName =
            user.name?.trim() ||
            user.fullName?.trim() ||
            user.displayName?.trim() ||
            user.email?.split('@')[0] ||
            user.phone ||
            'Unknown User';
          const userOrders = orders.filter(order => order.userId === user.id);
          const totalOrders = userOrders.length;
          const totalSpent = userOrders.reduce((sum, order) => {
            let orderTotal = 0;
            if (order.items && Array.isArray(order.items)) {
              orderTotal += order.items.reduce((itemSum, item) =>
                itemSum + (parseFloat(item.price || 0) * (parseInt(item.quantity) || 1)), 0);
            }
            if (order.deliveryFee) orderTotal += parseFloat(order.deliveryFee) || 0;
            if (order.tip) orderTotal += parseFloat(order.tip) || 0;
            if (order.tax) orderTotal += parseFloat(order.tax) || 0;
            return sum + orderTotal;
          }, 0);
          let userAddress = user.address || user.deliveryAddress || user.homeAddress || user.location?.address;
          if (!userAddress && userOrders.length > 0) {
            const latestOrder = userOrders[0];
            userAddress = latestOrder?.deliveryAddress || latestOrder?.address;
          }
          const userAddressString = formatAddress(userAddress) || 'No address provided';

          // Minimal user card
          return (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-4 justify-between">
                <div className="flex items-center gap-4 min-w-0">
                  <Avatar className="w-12 h-12 border-2 border-gray-200 flex-shrink-0">
                    <AvatarFallback className="text-lg font-semibold">
                      {(userDisplayName || 'U').split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="font-semibold text-lg truncate">{userDisplayName}</div>
                    <div className="text-sm text-gray-600 truncate">{user.email || 'No email'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(user.status)}
                  <Button size="sm" variant="outline" onClick={() => { setSelectedUser({ ...user, userOrders, totalOrders, totalSpent, userAddressString, activityLevel, joinDate }); setProfileOpen(true); }}>
                    <Eye className="w-4 h-4 mr-2" />
                    View Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filteredAndSortedUsers.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600">
                {searchTerm || filterStatus !== 'all' || filterCategory !== 'all' 
                  ? 'Try adjusting your search criteria or filters.'
                  : 'No users have been registered yet.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* User Profile Modal */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-2xl">
          {/* Hide default dialog close button if present */}
          <style>{`[data-radix-dialog-close] { display: none !important; }`}</style>
          {/* Custom close button, only one X */}
          <button
            aria-label="Close"
            className="absolute right-2 top-2 rounded-full p-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 border-0 shadow-none"
            type="button"
            style={{ boxShadow: 'none', border: 'none' }}
            onClick={() => setProfileOpen(false)}
          >
            
          </button>
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 border-2 border-gray-200 flex-shrink-0">
                  <AvatarFallback className="text-lg font-semibold">
                    {(selectedUser.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-xl">{selectedUser.name || selectedUser.fullName || selectedUser.displayName || selectedUser.email?.split('@')[0] || selectedUser.phone || 'Unknown User'}</div>
                  <div className="text-sm text-gray-600">{selectedUser.email || 'No email'}</div>
                  <div className="flex gap-2 mt-1">
                    {getStatusBadge(selectedUser.status)}
                    {getCategoryBadge(selectedUser.category)}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="font-medium text-gray-900 mb-1">Order Statistics</div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Orders:</span>
                      <span className="font-semibold text-lg">{selectedUser.totalOrders}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Spent:</span>
                      <span className="font-semibold text-lg text-green-600">₹{selectedUser.totalSpent.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Activity Level:</span>
                      <div className={`flex items-center gap-1 ${selectedUser.activityLevel.color}`}>
                        {selectedUser.activityLevel.icon}
                        <span className="text-sm font-medium">{selectedUser.activityLevel.level}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="font-medium text-gray-900 mb-1">Location & Details</div>
                  <div className="space-y-1">
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 line-clamp-2 break-words max-w-[180px]">
                        {selectedUser.userAddressString}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        {selectedUser.joinDate ? `Joined ${selectedUser.joinDate.toLocaleDateString()}` : 'Join date unknown'}
                      </span>
                    </div>
                    {selectedUser.joinDate && (
                      <div className="text-xs text-gray-500">
                        {Math.floor((Date.now() - selectedUser.joinDate.getTime()) / (1000 * 60 * 60 * 24))} days ago
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="font-medium text-gray-900 mb-1">Recent Activity</div>
                <div className="space-y-1">
                  <div className="text-sm">
                    <span className="text-gray-600">Last Order: </span>
                    <span className="font-medium">
                      {selectedUser.userOrders[0]?.createdAt?.seconds ? new Date(selectedUser.userOrders[0].createdAt.seconds * 1000).toLocaleDateString() : 'Never'}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">Avg Order: </span>
                    <span className="font-medium">
                      ₹{selectedUser.totalOrders > 0 ? (selectedUser.totalSpent / selectedUser.totalOrders).toFixed(2) : '0'}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">Status: </span>
                    <span className={`font-medium ${
                      selectedUser.status === 'active' ? 'text-green-600' : 
                      selectedUser.status === 'banned' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {selectedUser.status || 'active'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="font-medium text-gray-900 mb-1">Actions</div>
                <div className="flex gap-2 flex-wrap">
                  {(selectedUser.status === 'active' || !selectedUser.status) ? (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => { handleUserStatusToggle(selectedUser.id, selectedUser.status || 'active'); setProfileOpen(false); }}
                    >
                      <ShieldOff className="w-4 h-4 mr-2" />
                      Ban User
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() => { handleUserStatusToggle(selectedUser.id, selectedUser.status); setProfileOpen(false); }}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Unban User
                    </Button>
                  )}
                  <Button size="sm" variant="outline">
                    <Mail className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                  <Button size="sm" variant="outline">
                    <MoreVertical className="w-4 h-4 mr-2" />
                    More Options
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
