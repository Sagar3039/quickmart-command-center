
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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

  const inventory = [
    {
      id: 1,
      name: 'Organic Milk',
      category: 'Essentials',
      currentStock: 15,
      minStock: 20,
      maxStock: 100,
      reorderPoint: 25,
      status: 'low',
      lastRestock: '2024-06-20',
      avgDailyUsage: 8,
      supplier: 'Fresh Dairy Co.'
    },
    {
      id: 2,
      name: 'Fresh Bread',
      category: 'Local Foods',
      currentStock: 8,
      minStock: 10,
      maxStock: 50,
      reorderPoint: 15,
      status: 'critical',
      lastRestock: '2024-06-21',
      avgDailyUsage: 12,
      supplier: 'Local Bakery'
    },
    {
      id: 3,
      name: 'Premium Wine',
      category: 'Alcohol',
      currentStock: 45,
      minStock: 15,
      maxStock: 80,
      reorderPoint: 20,
      status: 'good',
      lastRestock: '2024-06-18',
      avgDailyUsage: 3,
      supplier: 'Wine Distributors Inc.'
    },
    {
      id: 4,
      name: 'Toilet Paper',
      category: 'Essentials',
      currentStock: 0,
      minStock: 25,
      maxStock: 150,
      reorderPoint: 40,
      status: 'out',
      lastRestock: '2024-06-15',
      avgDailyUsage: 15,
      supplier: 'Household Supplies Ltd.'
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'good':
        return <Badge className="bg-green-100 text-green-800">Good Stock</Badge>;
      case 'low':
        return <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Low Stock
        </Badge>;
      case 'critical':
        return <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Critical
        </Badge>;
      case 'out':
        return <Badge className="bg-red-200 text-red-900">Out of Stock</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Essentials': return 'bg-blue-100 text-blue-800';
      case 'Local Foods': return 'bg-green-100 text-green-800';
      case 'Alcohol': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStockLevel = (currentStock: number, maxStock: number) => {
    return (currentStock / maxStock) * 100;
  };

  const getDaysUntilOut = (currentStock: number, avgDailyUsage: number) => {
    if (avgDailyUsage === 0) return '∞';
    return Math.floor(currentStock / avgDailyUsage);
  };

  const filteredInventory = inventory.filter(item => 
    (filterCategory === 'all' || item.category === filterCategory) &&
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const inventoryStats = {
    total: inventory.length,
    lowStock: inventory.filter(item => item.status === 'low' || item.status === 'critical').length,
    outOfStock: inventory.filter(item => item.status === 'out').length,
    reorderNeeded: inventory.filter(item => item.currentStock <= item.reorderPoint).length,
  };

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
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold">{inventoryStats.total}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">{inventoryStats.lowStock}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{inventoryStats.outOfStock}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Reorder Needed</p>
                <p className="text-2xl font-bold text-orange-600">{inventoryStats.reorderNeeded}</p>
              </div>
              <RefreshCw className="w-8 h-8 text-orange-500" />
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
          </select>
        </div>
        <Button variant="outline" size="sm">
          <Filter className="w-4 h-4 mr-2" />
          Advanced Filters
        </Button>
      </div>

      {/* Inventory List */}
      <div className="space-y-4">
        {filteredInventory.map(item => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Product Info */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  <Badge className={getCategoryColor(item.category)}>
                    {item.category}
                  </Badge>
                  {getStatusBadge(item.status)}
                  <div className="text-sm text-gray-600">
                    Supplier: {item.supplier}
                  </div>
                </div>

                {/* Stock Levels */}
                <div className="space-y-3">
                  <div className="text-sm">
                    <div className="flex justify-between mb-1">
                      <span>Current Stock</span>
                      <span className="font-bold">{item.currentStock}/{item.maxStock}</span>
                    </div>
                    <Progress 
                      value={getStockLevel(item.currentStock, item.maxStock)} 
                      className="h-2"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-600">Min: </span>
                      <span>{item.minStock}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Reorder: </span>
                      <span>{item.reorderPoint}</span>
                    </div>
                  </div>
                </div>

                {/* Usage Analytics */}
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-gray-600">Daily Usage: </span>
                    <span className="font-medium">{item.avgDailyUsage} units</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">Days Until Out: </span>
                    <span className={`font-medium ${
                      getDaysUntilOut(item.currentStock, item.avgDailyUsage) < 7 
                        ? 'text-red-600' 
                        : getDaysUntilOut(item.currentStock, item.avgDailyUsage) < 14 
                          ? 'text-yellow-600' 
                          : 'text-green-600'
                    }`}>
                      {getDaysUntilOut(item.currentStock, item.avgDailyUsage)} days
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Last Restock: {item.lastRestock}
                  </div>
                </div>

                {/* Trends */}
                <div className="flex items-center justify-center">
                  {item.status === 'out' || item.status === 'critical' ? (
                    <TrendingDown className="w-8 h-8 text-red-500" />
                  ) : item.status === 'low' ? (
                    <TrendingDown className="w-8 h-8 text-yellow-500" />
                  ) : (
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <Button size="sm" variant="outline">
                    Update Stock
                  </Button>
                  {item.currentStock <= item.reorderPoint && (
                    <Button size="sm">
                      Reorder Now
                    </Button>
                  )}
                  <Button size="sm" variant="outline">
                    View History
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
