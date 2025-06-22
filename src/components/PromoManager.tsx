import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Search, 
  Filter, 
  Bell,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Play,
  Pause,
  Target
} from "lucide-react";

export function PromoManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('banners');

  const promoBanners = [
    {
      id: 1,
      title: '50% Off Local Foods',
      description: 'Fresh local produce at amazing prices',
      category: 'Local Foods',
      discount: 50,
      type: 'percentage',
      status: 'active',
      startDate: '2024-06-20',
      endDate: '2024-06-30',
      views: 12400,
      clicks: 890,
      conversions: 156
    },
    {
      id: 2,
      title: 'Free Delivery Weekend',
      description: 'No delivery fees on orders over $25',
      category: 'All',
      discount: 0,
      type: 'free_delivery',
      status: 'scheduled',
      startDate: '2024-06-25',
      endDate: '2024-06-27',
      views: 0,
      clicks: 0,
      conversions: 0
    },
    {
      id: 3,
      title: 'Premium Wine Sale',
      description: 'Exclusive wines at special prices',
      category: 'Alcohol',
      discount: 30,
      type: 'percentage',
      status: 'paused',
      startDate: '2024-06-15',
      endDate: '2024-06-22',
      views: 8500,
      clicks: 450,
      conversions: 78
    },
  ];

  const pushNotifications = [
    {
      id: 1,
      title: 'Flash Sale Alert!',
      message: '2 hours left on our mega sale. Shop now!',
      audience: 'All Users',
      scheduled: '2024-06-22 18:00',
      status: 'sent',
      delivered: 8543,
      opened: 3421,
      clicked: 567
    },
    {
      id: 2,
      title: 'Weekend Special',
      message: 'Free delivery on all weekend orders',
      audience: 'Premium Users',
      scheduled: '2024-06-24 09:00',
      status: 'scheduled',
      delivered: 0,
      opened: 0,
      clicked: 0
    },
    {
      id: 3,
      title: 'New Products Alert',
      message: 'Check out our fresh local produce selection',
      audience: 'Local Food Lovers',
      scheduled: '2024-06-21 12:00',
      status: 'draft',
      delivered: 0,
      opened: 0,
      clicked: 0
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-800">Paused</Badge>;
      case 'expired':
        return <Badge className="bg-gray-100 text-gray-800">Expired</Badge>;
      case 'sent':
        return <Badge className="bg-green-100 text-green-800">Sent</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Essentials': return 'bg-blue-100 text-blue-800';
      case 'Local Foods': return 'bg-green-100 text-green-800';
      case 'Alcohol': return 'bg-amber-100 text-amber-800';
      case 'All': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConversionRate = (conversions: number, clicks: number) => {
    if (clicks === 0) return '0%';
    return `${((conversions / clicks) * 100).toFixed(1)}%`;
  };

  const getOpenRate = (opened: number, delivered: number) => {
    if (delivered === 0) return '0%';
    return `${((opened / delivered) * 100).toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Promotions & Marketing</h1>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Campaign
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="banners">Promo Banners</TabsTrigger>
          <TabsTrigger value="notifications">Push Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="banners" className="space-y-6">
          {/* Banner Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{promoBanners.filter(b => b.status === 'active').length}</p>
                  <p className="text-sm text-gray-600">Active Banners</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {promoBanners.reduce((sum, banner) => sum + banner.views, 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">Total Views</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {promoBanners.reduce((sum, banner) => sum + banner.clicks, 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">Total Clicks</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {promoBanners.reduce((sum, banner) => sum + banner.conversions, 0)}
                  </p>
                  <p className="text-sm text-gray-600">Conversions</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <div className="flex items-center justify-between">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input 
                placeholder="Search banners..." 
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

          {/* Banners List */}
          <div className="space-y-4">
            {promoBanners.map(banner => (
              <Card key={banner.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Banner Info */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">{banner.title}</h3>
                      <p className="text-sm text-gray-600">{banner.description}</p>
                      <div className="flex gap-2">
                        {getStatusBadge(banner.status)}
                        <Badge className={getCategoryColor(banner.category)}>
                          {banner.category}
                        </Badge>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">Discount: </span>
                        <span className="font-medium">
                          {banner.type === 'percentage' ? `${banner.discount}%` : 'Free Delivery'}
                        </span>
                      </div>
                    </div>

                    {/* Schedule */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Start: {banner.startDate}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">End: {banner.endDate}</span>
                      </div>
                    </div>

                    {/* Performance */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <p className="font-bold">{banner.views.toLocaleString()}</p>
                          <p className="text-gray-600">Views</p>
                        </div>
                        <div>
                          <p className="font-bold">{banner.clicks}</p>
                          <p className="text-gray-600">Clicks</p>
                        </div>
                        <div>
                          <p className="font-bold">{banner.conversions}</p>
                          <p className="text-gray-600">Sales</p>
                        </div>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">Conversion: </span>
                        <span className="font-medium text-green-600">
                          {getConversionRate(banner.conversions, banner.clicks)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      {banner.status === 'active' ? (
                        <Button size="sm" variant="outline">
                          <Pause className="w-4 h-4 mr-2" />
                          Pause
                        </Button>
                      ) : (
                        <Button size="sm">
                          <Play className="w-4 h-4 mr-2" />
                          Activate
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          {/* Notification Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{pushNotifications.filter(n => n.status === 'sent').length}</p>
                  <p className="text-sm text-gray-600">Sent Today</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {pushNotifications.reduce((sum, notif) => sum + notif.delivered, 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">Total Delivered</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {pushNotifications.reduce((sum, notif) => sum + notif.opened, 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">Total Opened</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {getOpenRate(
                      pushNotifications.reduce((sum, notif) => sum + notif.opened, 0),
                      pushNotifications.reduce((sum, notif) => sum + notif.delivered, 0)
                    )}
                  </p>
                  <p className="text-sm text-gray-600">Open Rate</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notifications List */}
          <div className="space-y-4">
            {pushNotifications.map(notification => (
              <Card key={notification.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Notification Info */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">{notification.title}</h3>
                      <p className="text-sm text-gray-600">{notification.message}</p>
                      <div className="flex gap-2">
                        {getStatusBadge(notification.status)}
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">Audience: </span>
                        <span className="font-medium">{notification.audience}</span>
                      </div>
                    </div>

                    {/* Schedule */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Scheduled: {notification.scheduled}</span>
                      </div>
                    </div>

                    {/* Performance */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <p className="font-bold">{notification.delivered.toLocaleString()}</p>
                          <p className="text-gray-600">Delivered</p>
                        </div>
                        <div>
                          <p className="font-bold">{notification.opened.toLocaleString()}</p>
                          <p className="text-gray-600">Opened</p>
                        </div>
                        <div>
                          <p className="font-bold">{notification.clicked}</p>
                          <p className="text-gray-600">Clicked</p>
                        </div>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">Open Rate: </span>
                        <span className="font-medium text-green-600">
                          {getOpenRate(notification.opened, notification.delivered)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      {notification.status === 'draft' || notification.status === 'scheduled' ? (
                        <Button size="sm">
                          <Bell className="w-4 h-4 mr-2" />
                          Send Now
                        </Button>
                      ) : null}
                      <Button size="sm" variant="outline" className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
