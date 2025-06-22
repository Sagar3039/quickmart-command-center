
import React, { useState } from 'react';
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
  Calendar
} from "lucide-react";

export function UserManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const { data: users, loading, error, updateDocument, deleteDocument } = useFirebaseCollection('users');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'banned':
        return <Badge className="bg-red-100 text-red-800">Banned</Badge>;
      case 'suspended':
        return <Badge className="bg-yellow-100 text-yellow-800">Suspended</Badge>;
      default:
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'Premium':
        return <Badge className="bg-purple-100 text-purple-800">Premium</Badge>;
      case 'Regular':
        return <Badge className="bg-blue-100 text-blue-800">Regular</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800">Regular</Badge>;
    }
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

  const filteredUsers = users.filter(user => 
    (filterStatus === 'all' || user.status === filterStatus) &&
    ((user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
     (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const userStats = {
    total: users.length,
    active: users.filter(u => u.status === 'active' || !u.status).length,
    banned: users.filter(u => u.status === 'banned').length,
    premium: users.filter(u => u.category === 'Premium').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading users...</div>
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">User Management</h1>
        <div className="flex gap-2">
          <Button variant="outline">Export Users</Button>
        </div>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{userStats.total}</p>
              <p className="text-sm text-gray-600">Total Users</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{userStats.active}</p>
              <p className="text-sm text-gray-600">Active Users</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{userStats.banned}</p>
              <p className="text-sm text-gray-600">Banned Users</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{userStats.premium}</p>
              <p className="text-sm text-gray-600">Premium Users</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input 
              placeholder="Search users..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
        <Button variant="outline" size="sm">
          <Filter className="w-4 h-4 mr-2" />
          More Filters
        </Button>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {filteredUsers.map(user => (
          <Card key={user.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* User Info */}
                <div className="flex items-start gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback>
                      {(user.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg">{user.name || 'Unknown User'}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{user.email || 'No email'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{user.phone || 'No phone'}</span>
                    </div>
                    <div className="flex gap-2">
                      {getStatusBadge(user.status)}
                      {getCategoryBadge(user.category)}
                    </div>
                  </div>
                </div>

                {/* Order Stats */}
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-gray-600">Total Orders: </span>
                    <span className="font-semibold">{user.totalOrders || 0}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">Total Spent: </span>
                    <span className="font-semibold">${user.totalSpent || 0}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Last order: {user.lastOrder || 'Never'}
                  </div>
                </div>

                {/* Address & Join Date */}
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span className="text-gray-600">{user.address || 'No address'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      Joined {user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <Button size="sm" variant="outline">
                    <Eye className="w-4 h-4 mr-2" />
                    View Profile
                  </Button>
                  {(user.status === 'active' || !user.status) ? (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleUserStatusToggle(user.id, user.status || 'active')}
                    >
                      <ShieldOff className="w-4 h-4 mr-2" />
                      Ban User
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-green-600 hover:text-green-700"
                      onClick={() => handleUserStatusToggle(user.id, user.status)}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Unban User
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
