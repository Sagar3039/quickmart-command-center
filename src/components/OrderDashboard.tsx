
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFirebaseCollection } from "@/hooks/useFirebaseData";
import { 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  CheckCircle, 
  Truck,
  Package,
  User
} from "lucide-react";

export function OrderDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  const { data: orders, loading, error, updateDocument } = useFirebaseCollection('orders');

  const statusOptions = ['all', 'confirmed', 'preparing', 'in-transit', 'delivered', 'cancelled'];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      confirmed: { color: 'bg-gray-100 text-gray-800', icon: Clock },
      preparing: { color: 'bg-yellow-100 text-yellow-800', icon: Package },
      'in-transit': { color: 'bg-blue-100 text-blue-800', icon: Truck },
      delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: Clock },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.confirmed;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status?.replace('-', ' ') || 'confirmed'}
      </Badge>
    );
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Essentials': return 'bg-blue-100 text-blue-800';
      case 'Local Foods': return 'bg-green-100 text-green-800';
      case 'Alcohol': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await updateDocument(orderId, { status: newStatus });
      console.log('Order status updated successfully');
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const filteredOrders = orders.filter(order => 
    (selectedStatus === 'all' || order.status === selectedStatus) &&
    ((order.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
     (order.customer || '').toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const statusCounts = {
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    'in-transit': orders.filter(o => o.status === 'in-transit').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading orders...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Error loading orders: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Order Management</h1>
        <Button variant="outline">
          <MapPin className="w-4 h-4 mr-2" />
          Live Map
        </Button>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(statusCounts).map(([status, count]) => (
          <Card key={status}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 capitalize">
                    {status.replace('-', ' ')}
                  </p>
                  <p className="text-2xl font-bold">{count}</p>
                </div>
                {getStatusBadge(status)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
        <div className="flex items-center justify-between">
          <TabsList>
            {statusOptions.map(status => (
              <TabsTrigger key={status} value={status} className="capitalize">
                {status === 'all' ? 'All Orders' : status.replace('-', ' ')}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input 
                placeholder="Search orders..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        {statusOptions.map(status => (
          <TabsContent key={status} value={status}>
            <div className="space-y-4">
              {filteredOrders.map(order => (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                      {/* Order Info */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">#{order.id?.slice(-6) || 'N/A'}</span>
                          {getStatusBadge(order.status)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="w-4 h-4" />
                          <span>{order.customer || 'Unknown Customer'}</span>
                        </div>
                        <div className="text-sm text-gray-600">{order.phone || 'No phone'}</div>
                        <Badge className={getCategoryColor(order.category || 'Essentials')}>
                          {order.category || 'Essentials'}
                        </Badge>
                      </div>

                      {/* Order Details */}
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="text-gray-600">Items: </span>
                          <span className="font-medium">{order.items || 0}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-600">Total: </span>
                          <span className="font-bold text-lg">${order.total || 0}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 'No date'}
                        </div>
                      </div>

                      {/* Delivery Info */}
                      <div className="space-y-2">
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                          <span className="text-gray-600">{order.address || 'No address'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Truck className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">
                            Rider: <span className="font-medium">{order.rider || 'Not assigned'}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">ETA: {order.estimatedDelivery || '30 min'}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                        <Button size="sm" variant="outline">
                          Contact Customer
                        </Button>
                        {order.status === 'confirmed' && (
                          <Button size="sm" onClick={() => handleStatusUpdate(order.id, 'preparing')}>
                            Start Preparing
                          </Button>
                        )}
                        {order.status === 'preparing' && (
                          <Button size="sm" onClick={() => handleStatusUpdate(order.id, 'in-transit')}>
                            Assign Rider
                          </Button>
                        )}
                        {order.status === 'in-transit' && (
                          <Button size="sm" onClick={() => handleStatusUpdate(order.id, 'delivered')}>
                            Mark Delivered
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
