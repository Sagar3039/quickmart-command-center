
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  Search, 
  Filter, 
  MapPin, 
  Star, 
  Truck,
  Phone,
  Shield,
  Clock,
  CheckCircle,
  User
} from "lucide-react";

export function RiderManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const riders = [
    {
      id: 1,
      name: 'Mike Rodriguez',
      phone: '+1 234-567-8900',
      status: 'online',
      zone: 'Downtown',
      rating: 4.8,
      totalDeliveries: 1250,
      completionRate: 98.5,
      averageTime: '18 min',
      earnings: 3420.50,
      alcoholEligible: true,
      currentOrder: '#ORD-001',
      joinDate: '2023-06-15'
    },
    {
      id: 2,
      name: 'Sarah Lopez',
      phone: '+1 234-567-8901',
      status: 'busy',
      zone: 'Midtown',
      rating: 4.9,
      totalDeliveries: 890,
      completionRate: 99.2,
      averageTime: '16 min',
      earnings: 2150.80,
      alcoholEligible: true,
      currentOrder: '#ORD-002',
      joinDate: '2023-08-20'
    },
    {
      id: 3,
      name: 'James Chen',
      phone: '+1 234-567-8902',
      status: 'offline',
      zone: 'Uptown',
      rating: 4.6,
      totalDeliveries: 456,
      completionRate: 95.8,
      averageTime: '22 min',
      earnings: 1890.30,
      alcoholEligible: false,
      currentOrder: null,
      joinDate: '2024-01-10'
    },
    {
      id: 4,
      name: 'Maria Garcia',
      phone: '+1 234-567-8903',
      status: 'online',
      zone: 'Suburbs',
      rating: 4.7,
      totalDeliveries: 678,
      completionRate: 97.3,
      averageTime: '20 min',
      earnings: 2340.70,
      alcoholEligible: true,
      currentOrder: null,
      joinDate: '2023-11-05'
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          Online
        </Badge>;
      case 'busy':
        return <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
          <Truck className="w-3 h-3" />
          Busy
        </Badge>;
      case 'offline':
        return <Badge className="bg-gray-100 text-gray-800">Offline</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const getZoneColor = (zone: string) => {
    switch (zone) {
      case 'Downtown': return 'bg-blue-100 text-blue-800';
      case 'Midtown': return 'bg-green-100 text-green-800';
      case 'Uptown': return 'bg-purple-100 text-purple-800';
      case 'Suburbs': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRiders = riders.filter(rider => 
    (filterStatus === 'all' || rider.status === filterStatus) &&
    rider.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const riderStats = {
    total: riders.length,
    online: riders.filter(r => r.status === 'online').length,
    busy: riders.filter(r => r.status === 'busy').length,
    alcoholEligible: riders.filter(r => r.alcoholEligible).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Rider Management</h1>
        <div className="flex gap-2">
          <Button>Add New Rider</Button>
          <Button variant="outline">
            <MapPin className="w-4 h-4 mr-2" />
            Zone Map
          </Button>
        </div>
      </div>

      {/* Rider Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{riderStats.total}</p>
              <p className="text-sm text-gray-600">Total Riders</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{riderStats.online}</p>
              <p className="text-sm text-gray-600">Online Now</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{riderStats.busy}</p>
              <p className="text-sm text-gray-600">On Delivery</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">{riderStats.alcoholEligible}</p>
              <p className="text-sm text-gray-600">Alcohol Eligible</p>
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
              placeholder="Search riders..." 
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
            <option value="online">Online</option>
            <option value="busy">Busy</option>
            <option value="offline">Offline</option>
          </select>
        </div>
        <Button variant="outline" size="sm">
          <Filter className="w-4 h-4 mr-2" />
          More Filters
        </Button>
      </div>

      {/* Riders List */}
      <div className="space-y-4">
        {filteredRiders.map(rider => (
          <Card key={rider.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Rider Info */}
                <div className="flex items-start gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback>{rider.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg">{rider.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{rider.phone}</span>
                    </div>
                    <div className="flex gap-2">
                      {getStatusBadge(rider.status)}
                      <Badge className={getZoneColor(rider.zone)}>
                        <MapPin className="w-3 h-3 mr-1" />
                        {rider.zone}
                      </Badge>
                    </div>
                    {rider.alcoholEligible && (
                      <Badge className="bg-amber-100 text-amber-800">
                        <Shield className="w-3 h-3 mr-1" />
                        Alcohol Eligible
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="font-semibold">{rider.rating}</span>
                    <span className="text-sm text-gray-600">rating</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Completion Rate</span>
                      <span className="font-medium">{rider.completionRate}%</span>
                    </div>
                    <Progress value={rider.completionRate} className="h-2" />
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">Avg Delivery: </span>
                    <span className="font-medium">{rider.averageTime}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-gray-600">Total Deliveries: </span>
                    <span className="font-semibold">{rider.totalDeliveries}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">Earnings: </span>
                    <span className="font-semibold">${rider.earnings}</span>
                  </div>
                  {rider.currentOrder && (
                    <div className="flex items-center gap-2 text-sm">
                      <Truck className="w-4 h-4 text-blue-500" />
                      <span className="text-blue-600">Current: {rider.currentOrder}</span>
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    Joined: {rider.joinDate}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <Button size="sm" variant="outline">
                    <User className="w-4 h-4 mr-2" />
                    View Profile
                  </Button>
                  <Button size="sm" variant="outline">
                    Contact Rider
                  </Button>
                  {rider.status === 'online' && !rider.currentOrder && (
                    <Button size="sm">
                      Assign Order
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="text-red-600">
                    Suspend
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
