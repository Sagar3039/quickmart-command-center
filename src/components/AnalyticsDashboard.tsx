
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Button } from "@/components/ui/button";
import { Calendar, Download, TrendingUp, DollarSign, Package, Users } from "lucide-react";

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('7d');

  // Sample data - in real app this would come from API
  const salesData = [
    { name: 'Mon', Essentials: 4000, 'Local Foods': 2400, Alcohol: 1200 },
    { name: 'Tue', Essentials: 3000, 'Local Foods': 1398, Alcohol: 800 },
    { name: 'Wed', Essentials: 2000, 'Local Foods': 3800, Alcohol: 1500 },
    { name: 'Thu', Essentials: 2780, 'Local Foods': 3908, Alcohol: 1800 },
    { name: 'Fri', Essentials: 1890, 'Local Foods': 4800, Alcohol: 2200 },
    { name: 'Sat', Essentials: 2390, 'Local Foods': 3800, Alcohol: 2500 },
    { name: 'Sun', Essentials: 3490, 'Local Foods': 4300, Alcohol: 2100 },
  ];

  const categoryData = [
    { name: 'Essentials', value: 45, color: '#3B82F6' },
    { name: 'Local Foods', value: 35, color: '#10B981' },
    { name: 'Alcohol', value: 20, color: '#F59E0B' },
  ];

  const zonePerformance = [
    { zone: 'Downtown', orders: 450, revenue: 12340, avgTime: '18 min' },
    { zone: 'Midtown', orders: 320, revenue: 8920, avgTime: '22 min' },
    { zone: 'Uptown', orders: 280, revenue: 7650, avgTime: '25 min' },
    { zone: 'Suburbs', orders: 190, revenue: 5430, avgTime: '28 min' },
  ];

  const riderPerformance = [
    { name: 'Mike R.', deliveries: 45, rating: 4.8, earnings: 890 },
    { name: 'Sarah L.', deliveries: 38, rating: 4.9, earnings: 760 },
    { name: 'James C.', deliveries: 32, rating: 4.6, earnings: 640 },
    { name: 'Maria G.', deliveries: 28, rating: 4.7, earnings: 560 },
  ];

  const hourlyTrends = [
    { hour: '6AM', orders: 12 }, { hour: '7AM', orders: 45 }, { hour: '8AM', orders: 78 },
    { hour: '9AM', orders: 65 }, { hour: '10AM', orders: 52 }, { hour: '11AM', orders: 98 },
    { hour: '12PM', orders: 156 }, { hour: '1PM', orders: 134 }, { hour: '2PM', orders: 98 },
    { hour: '3PM', orders: 76 }, { hour: '4PM', orders: 45 }, { hour: '5PM', orders: 87 },
    { hour: '6PM', orders: 123 }, { hour: '7PM', orders: 198 }, { hour: '8PM', orders: 234 },
    { hour: '9PM', orders: 156 }, { hour: '10PM', orders: 98 }, { hour: '11PM', orders: 45 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <div className="flex gap-2">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold">$34,250</p>
                <div className="flex items-center text-sm text-green-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +12.5%
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-3xl font-bold">1,240</p>
                <div className="flex items-center text-sm text-green-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +8.2%
                </div>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Order Value</p>
                <p className="text-3xl font-bold">$27.62</p>
                <div className="flex items-center text-sm text-green-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +3.8%
                </div>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Customers</p>
                <p className="text-3xl font-bold">8,543</p>
                <div className="flex items-center text-sm text-green-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +15.3%
                </div>
              </div>
              <Users className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sales">Sales Analytics</TabsTrigger>
          <TabsTrigger value="categories">Category Performance</TabsTrigger>
          <TabsTrigger value="zones">Zone Analytics</TabsTrigger>
          <TabsTrigger value="riders">Rider Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sales by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="Essentials" fill="#3B82F6" />
                    <Bar dataKey="Local Foods" fill="#10B981" />
                    <Bar dataKey="Alcohol" fill="#F59E0B" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hourly Order Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={hourlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="orders" stroke="#3B82F6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryData.map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{category.value}%</p>
                        <p className="text-sm text-gray-600">of total orders</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="zones" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Zone Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {zonePerformance.map((zone, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-semibold">{zone.zone}</h4>
                      <p className="text-sm text-gray-600">Avg delivery: {zone.avgTime}</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold">{zone.orders}</p>
                      <p className="text-sm text-gray-600">Orders</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${zone.revenue}</p>
                      <p className="text-sm text-gray-600">Revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="riders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Riders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {riderPerformance.map((rider, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-semibold">{rider.name}</h4>
                      <div className="flex items-center gap-1 text-sm">
                        <span className="text-yellow-500">★</span>
                        <span>{rider.rating}</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="font-bold">{rider.deliveries}</p>
                      <p className="text-sm text-gray-600">Deliveries</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${rider.earnings}</p>
                      <p className="text-sm text-gray-600">Earnings</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
