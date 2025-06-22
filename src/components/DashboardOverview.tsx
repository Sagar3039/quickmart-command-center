
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useFirebaseCollection } from "@/hooks/useFirebaseData";
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  ShoppingCart, 
  Users, 
  AlertTriangle,
  Clock,
  CheckCircle
} from "lucide-react";

export function DashboardOverview() {
  const { data: orders } = useFirebaseCollection('orders');
  const { data: users } = useFirebaseCollection('users');
  const { data: products } = useFirebaseCollection('products');
  const { data: riders } = useFirebaseCollection('riders');

  const stats = [
    { 
      title: 'Total Orders Today', 
      value: orders.length.toString(), 
      change: '+12%', 
      trend: 'up', 
      icon: ShoppingCart 
    },
    { 
      title: 'Active Users', 
      value: users.filter(u => u.status === 'active' || !u.status).length.toString(), 
      change: '+3%', 
      trend: 'up', 
      icon: Users 
    },
    { 
      title: 'Products in Stock', 
      value: products.length.toString(), 
      change: '-2%', 
      trend: 'down', 
      icon: Package 
    },
    { 
      title: 'Active Riders', 
      value: riders.filter(r => r.status === 'online').length.toString(), 
      change: '+8%', 
      trend: 'up', 
      icon: Users 
    },
  ];

  const categoryStats = [
    { 
      name: 'Essentials', 
      orders: orders.filter(o => o.category === 'Essentials').length, 
      revenue: orders.filter(o => o.category === 'Essentials').reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0), 
      color: 'bg-blue-500' 
    },
    { 
      name: 'Local Foods', 
      orders: orders.filter(o => o.category === 'Local Foods').length, 
      revenue: orders.filter(o => o.category === 'Local Foods').reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0), 
      color: 'bg-green-500' 
    },
    { 
      name: 'Alcohol', 
      orders: orders.filter(o => o.category === 'Alcohol').length, 
      revenue: orders.filter(o => o.category === 'Alcohol').reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0), 
      color: 'bg-amber-500' 
    },
  ];

  const recentOrders = orders.slice(0, 4).map(order => ({
    id: `#${order.id?.toString().slice(-6) || 'N/A'}`,
    customer: order.customer?.toString() || 'Unknown Customer',
    status: order.status?.toString() || 'confirmed',
    category: order.category?.toString() || 'Essentials',
    time: order.createdAt ? 'Recently' : 'Unknown time'
  }));

  const lowStockItems = products.filter(product => (parseInt(product.stock) || 0) < 10).slice(0, 3).map(product => ({
    name: product.name?.toString() || 'Unknown Product',
    stock: parseInt(product.stock) || 0,
    category: product.category?.toString() || 'Essentials'
  }));

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'in-transit': { color: 'bg-blue-100 text-blue-800', icon: Clock },
      preparing: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      confirmed: { color: 'bg-gray-100 text-gray-800', icon: Clock },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.confirmed;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <div className={`flex items-center text-sm ${
                      stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <TrendIcon className="w-4 h-4 mr-1" />
                      {stat.change}
                    </div>
                  </div>
                  <Icon className="w-8 h-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Category Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Category Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categoryStats.map((category, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                  <h4 className="font-semibold">{category.name}</h4>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Orders</span>
                    <span className="font-medium">{category.orders}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Revenue</span>
                    <span className="font-medium">${category.revenue.toFixed(2)}</span>
                  </div>
                  <Progress value={(category.orders / Math.max(orders.length, 1)) * 100} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.length > 0 ? recentOrders.map((order, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{order.id}</p>
                    <p className="text-sm text-gray-600">{order.customer}</p>
                    <p className="text-xs text-gray-500">{order.category}</p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(order.status)}
                    <p className="text-xs text-gray-500 mt-1">{order.time}</p>
                  </div>
                </div>
              )) : (
                <p className="text-gray-500">No recent orders</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockItems.length > 0 ? lowStockItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">{item.category}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-amber-600">{item.stock}</span>
                    <p className="text-xs text-gray-500">units left</p>
                  </div>
                </div>
              )) : (
                <p className="text-gray-500">All products are well stocked</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
