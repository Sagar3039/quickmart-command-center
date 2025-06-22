
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFirebaseCollection } from "@/hooks/useFirebaseData";
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Image,
  Package,
  AlertTriangle
} from "lucide-react";

export function ProductManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const { data: products, loading, error } = useFirebaseCollection('products');

  // Transform Firebase data to match product structure
  const transformedProducts = products.map((product, index) => ({
    id: index + 1,
    name: product.name || 'Unknown Product',
    category: product.category || 'Essentials',
    price: product.price || 0,
    stock: Math.floor(Math.random() * 50) + 1, // Random stock for demo
    status: product.inStock ? 'active' : 'out-of-stock',
    image: product.image || '/placeholder.svg',
    lowStock: Math.random() > 0.7 // Random low stock status for demo
  }));

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category || 'Essentials')))];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Essentials': return 'bg-blue-100 text-blue-800';
      case 'Local Foods': return 'bg-green-100 text-green-800';
      case 'Alcohol': return 'bg-amber-100 text-amber-800';
      case 'daily_essential': return 'bg-blue-100 text-blue-800';
      case 'snacks': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadge = (status: string, lowStock: boolean) => {
    if (status === 'out-of-stock') return <Badge className="bg-red-100 text-red-800">Out of Stock</Badge>;
    if (lowStock) return <Badge className="bg-yellow-100 text-yellow-800">Low Stock</Badge>;
    return <Badge className="bg-green-100 text-green-800">In Stock</Badge>;
  };

  const filteredProducts = transformedProducts.filter(product => 
    (selectedCategory === 'all' || product.category === selectedCategory) &&
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading products...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Error loading products: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Product Management</h1>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Product
        </Button>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <div className="flex items-center justify-between">
          <TabsList>
            {categories.map(category => (
              <TabsTrigger key={category} value={category} className="capitalize">
                {category === 'all' ? 'All Categories' : category}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input 
                placeholder="Search products..." 
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

        {categories.map(category => (
          <TabsContent key={category} value={category}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map(product => (
                <Card key={product.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="relative mb-4">
                      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                        {product.image && product.image !== '/placeholder.svg' ? (
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <Image className="w-12 h-12 text-gray-400" />
                        )}
                      </div>
                      {product.lowStock && (
                        <div className="absolute -top-2 -right-2">
                          <AlertTriangle className="w-6 h-6 text-amber-500 bg-white rounded-full p-1" />
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-sm">{product.name}</h3>
                        <span className="text-lg font-bold">${product.price}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={getCategoryColor(product.category)}>
                          {product.category}
                        </Badge>
                        {getStatusBadge(product.status, product.lowStock)}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Package className="w-4 h-4" />
                        <span>{product.stock} units</span>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
