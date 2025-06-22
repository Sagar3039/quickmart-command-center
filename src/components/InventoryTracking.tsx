
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFirebaseCollection } from "@/hooks/useFirebaseData";
import { 
  Search, 
  Filter, 
  AlertTriangle, 
  Package,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Bell
} from "lucide-react";

export function InventoryTracking() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  
  const { data: products, loading, error } = useFirebaseCollection('products');

  // Transform Firebase data to match inventory structure
  const inventory = products.map((product, index) => ({
    id: index + 1,
    name: product.name || 'Unknown Product',
    category: product.category || 'Essentials',
    currentStock: Math.floor(Math.random() * 50) + 10, // Random stock for demo
    minStock: 20,
    maxStock: 100,
    unit: 'units',
    price: product.price || 0,
    supplier: 'Local Supplier',
    lastRestock: new Date().toISOString().split('T')[0],
    dailyUsage: Math.floor(Math.random() * 10) + 1,
    trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)]
  }));

  const getStockStatus = (current: number, min: number) => {
    if (current <= min * 0.5) return 'critical';
    if (current <= min) return 'low';
    return 'good';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'critical':
        return <Badge className="bg-red-100 text-red-800">Critical</Badge>;
      case 'low':
        return <Badge className="bg-yellow-100 text-yellow-800">Low Stock</Badge>;
      case 'good':
        return <Badge className="bg-green-100 text-green-800">In Stock</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Essentials': return 'bg-blue-100 text-blue-800';
      case 'Local Foods': return 'bg-green-100 text-green-800';
      case 'Alcohol': return 'bg-amber-100 text-amber-800';
      case 'daily_essential': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <div className="w-4 h-4 bg-gray-300 rounded-full"></div>;
    }
  };

  const getDaysUntilOut = (current: number, dailyUsage: number): number => {
    if (dailyUsage === 0) return 999;
    return Math.floor(current / dailyUsage);
  };

  const filteredInventory = inventory.filter(item => 
    (filterCategory === 'all' || item.category === filterCategory) &&
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const inventoryStats = {
    total: inventory.length,
    lowStock: inventory.filter(item => getStockStatus(item.currentStock, item.minStock) === 'low').length,
    critical: inventory.filter(item => getStockStatus(item.currentStock, item.minStock) === 'critical').length,
    totalValue: inventory.reduce((sum, item) => sum + (item.currentStock * item.price), 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading inventory data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Error loading data: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Inventory Tracking</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync Inventory
          </Button>
          <Button>
            <Bell className="w-4 h-4 mr-2" />
            Set Alerts
          </Button>
        </div>
      </div>

      {/* Inventory Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{inventoryStats.total}</p>
              <p className="text-sm text-gray-600">Total Items</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{inventoryStats.lowStock}</p>
              <p className="text-sm text-gray-600">Low Stock</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{inventoryStats.critical}</p>
              <p className="text-sm text-gray-600">Critical</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">${inventoryStats.totalValue.toFixed(2)}</p>
              <p className="text-sm text-gray-600">Total Value</p>
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
              placeholder="Search inventory..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">All Categories</option>
            <option value="Essentials">Essentials</option>
            <option value="Local Foods">Local Foods</option>
            <option value="Alcohol">Alcohol</option>
            <option value="daily_essential">Daily Essential</option>
          </select>
        </div>
        <Button variant="outline" size="sm">
          <Filter className="w-4 h-4 mr-2" />
          More Filters
        </Button>
      </div>

      {/* Inventory List */}
      <div className="space-y-4">
        {filteredInventory.map(item => {
          const status = getStockStatus(item.currentStock, item.minStock);
          const daysUntilOut = getDaysUntilOut(item.currentStock, item.dailyUsage);
          
          return (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  {/* Product Info */}
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center">
                      <Package className="w-6 h-6 text-gray-500" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      <div className="flex gap-2">
                        {getStatusBadge(status)}
                        <Badge className={getCategoryColor(item.category)}>
                          {item.category}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        Supplier: {item.supplier}
                      </div>
                    </div>
                  </div>

                  {/* Stock Levels */}
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-gray-600">Current: </span>
                      <span className="font-semibold">{item.currentStock} {item.unit}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Min: </span>
                      <span>{item.minStock} {item.unit}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Max: </span>
                      <span>{item.maxStock} {item.unit}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          status === 'critical' ? 'bg-red-500' : 
                          status === 'low' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min((item.currentStock / item.maxStock) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Usage & Trends */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      {getTrendIcon(item.trend)}
                      <span className="text-gray-600">Daily Usage: {item.dailyUsage}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Days left: </span>
                      <span className={`font-medium ${daysUntilOut < 3 ? 'text-red-600' : daysUntilOut < 7 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {daysUntilOut}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Last restock: {item.lastRestock}
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-gray-600">Unit Price: </span>
                      <span className="font-semibold">${item.price}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Total Value: </span>
                      <span className="font-semibold">${(item.currentStock * item.price).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Button size="sm">
                      Reorder Stock
                    </Button>
                    <Button size="sm" variant="outline">
                      Edit Details
                    </Button>
                    {status === 'critical' && (
                      <Button size="sm" variant="outline" className="text-red-600">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Urgent Order
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
