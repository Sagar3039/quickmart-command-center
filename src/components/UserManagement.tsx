
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

  const users = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@email.com',
      phone: '+1 234-567-8900',
      status: 'active',
      joinDate: '2024-01-15',
      totalOrders: 24,
      totalSpent: 450.80,
      lastOrder: '2 days ago',
      address: '123 Main St, Downtown',
      category: 'Premium'
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane.smith@email.com',
      phone: '+1 234-567-8901',
      status: 'active',
      joinDate: '2024-02-20',
      totalOrders: 12,
      totalSpent: 280.50,
      lastOrder: '1 day ago',
      address: '456 Oak Ave, Midtown',
      category: 'Regular'
    },
    {
      id: 3,
      name: 'Mike Johnson',
      email: 'mike.johnson@email.com',
      phone: '+1 234-567-8902',
      status: 'banned',
      joinDate: '2024-01-10',
      totalOrders: 8,
      totalSpent: 120.30,
      lastOrder: '2 weeks ago',
      address: '789 Pine St, Uptown',
      category: 'Regular'
    },
    {
      id: 4,
      name: 'Sarah Wilson',
      email: 'sarah.wilson@email.com',
      phone: '+1 234-567-8903',
      status: 'active',
      joinDate: '2024-03-05',
      totalOrders: 35,
      totalSpent: 680.90,
      lastOrder: '3 hours ago',
      address: '321 Elm St, Suburbs',
      category: 'Premium'
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'banned':
        return <Badge className="bg-red-100 text-red-800">Banned</Badge>;
      case 'suspended':
        return <Badge className="bg-yellow-100 text-yellow-800">Suspended</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'Premium':
        return <Badge className="bg-purple-100 text-purple-800">Premium</Badge>;
      case 'Regular':
        return <Badge className="bg-blue-100 text-blue-800">Regular</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Basic</Badge>;
    }
  };

  const filteredUsers = users.filter(user => 
    (filterStatus === 'all' || user.status === filterStatus) &&
    (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const userStats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    banned: users.filter(u => u.status === 'banned').length,
    premium: users.filter(u => u.category === 'Premium').length,
  };

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
                    <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg">{user.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{user.phone}</span>
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
                    <span className="font-semibold">{user.totalOrders}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">Total Spent: </span>
                    <span className="font-semibold">${user.totalSpent}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Last order: {user.lastOrder}
                  </div>
                </div>

                {/* Address & Join Date */}
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span className="text-gray-600">{user.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Joined {user.joinDate}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <Button size="sm" variant="outline">
                    <Eye className="w-4 h-4 mr-2" />
                    View Profile
                  </Button>
                  {user.status === 'active' ? (
                    <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                      <ShieldOff className="w-4 h-4 mr-2" />
                      Ban User
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700">
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
