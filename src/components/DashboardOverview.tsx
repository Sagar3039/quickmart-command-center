
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  const stats = [
    { title: 'Total Orders Today', value: '1,234', change: '+12%', trend: 'up', icon: ShoppingCart },
    { title: 'Active Users', value: '8,543', change: '+3%', trend: 'up', icon: Users },
    { title: 'Products in Stock', value: '2,156', change: '-2%', trend: 'down', icon: Package },
    { title: 'Active Riders', value: '67', change: '+8%', trend: 'up', icon: Users },
  ];

  const categoryStats = [
    { name: 'Essentials', orders: 456, revenue: '$12,340', color: 'bg-blue-500' },
    { name: 'Local Foods', orders: 234, revenue: '$8,920', color: 'bg-green-500' },
    { name: 'Alcohol', orders: 89, revenue: '$4,560', color: 'bg-amber-500' },
  ];

  const recentOrders = [
    { id: '#ORD-001', customer: 'John Doe', status: 'delivered', category: 'Essentials', time: '2 min ago' },
    { id: '#ORD-002', customer: 'Jane Smith', status: 'in-transit', category: 'Local Foods', time: '5 min ago' },
    { id: '#ORD-003', customer: 'Mike Johnson', status: 'preparing', category: 'Alcohol', time: '8 min ago' },
    { id: '#ORD-004', customer: 'Sarah Wilson', status: 'confirmed', category: 'Essentials', time: '12 min ago' },
  ];

  const lowStockItems = [
    { name: 'Organic Milk', stock: 5, category: 'Essentials' },
    { name: 'Fresh Bread', stock: 8, category: 'Local Foods' },
    { name: 'Premium Wine', stock: 3, category: 'Alcohol' },
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'in-transit': { color: 'bg-blue-100 text-blue-800', icon: Clock },
      preparing: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      confirmed: { color: 'bg-gray-100 text-gray-800', icon: Clock },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
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
                    <span className="font-medium">{category.revenue}</span>
                  </div>
                  <Progress value={(category.orders / 500) * 100} className="h-2" />
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
              {recentOrders.map((order, index) => (
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
              ))}
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
              {lowStockItems.map((item, index) => (
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
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
