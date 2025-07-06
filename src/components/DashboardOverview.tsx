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
  CheckCircle,
  MapPin,
  DollarSign
} from "lucide-react";

export function DashboardOverview() {
  const { data: orders } = useFirebaseCollection('orders');
  const { data: users } = useFirebaseCollection('users');
  const { data: products } = useFirebaseCollection('products');
  const { data: riders } = useFirebaseCollection('riders');

  // Function to calculate total amount including delivery fees and tips
  const getTotalAmount = React.useCallback((order) => {
    try {
      console.log(`=== TOTAL CALCULATION DEBUG for Order ${order.id} ===`);
      console.log('Full order object:', order);
      
      // Check all possible field names for total
      const allPossibleFields = {
        total: order.total,
        totalAmount: order.totalAmount,
        amount: order.amount,
        grandTotal: order.grandTotal,
        finalAmount: order.finalAmount,
        price: order.price,
        cost: order.cost,
        totalPrice: order.totalPrice,
        // Check nested objects
        'orderDetails.total': order.orderDetails?.total,
        'orderDetails.totalAmount': order.orderDetails?.totalAmount,
        'payment.total': order.payment?.total,
        'payment.amount': order.payment?.amount,
        // Check for any field containing 'total' or 'amount'
        ...Object.fromEntries(
          Object.entries(order).filter(([key, value]) => 
            (key.toLowerCase().includes('total') || key.toLowerCase().includes('amount')) && 
            typeof value === 'number'
          )
        )
      };
      
      console.log('All possible total fields:', allPossibleFields);
      
      // Try multiple possible field names for total amount
      const possibleTotals = [
        order.total,
        order.totalAmount,
        order.amount,
        order.grandTotal,
        order.finalAmount,
        order.price,
        order.cost,
        order.orderDetails?.total,
        order.orderDetails?.totalAmount,
        order.payment?.total,
        order.payment?.amount,
        // If items exist, calculate from items
        (order.items && Array.isArray(order.items)) ? 
          order.items.reduce((sum, item) => sum + (parseFloat(item.price || 0) * (parseInt(item.quantity) || 1)), 0) : null,
      ];
      
      console.log('Possible totals found:', possibleTotals);
      
      // Find the first valid number
      for (const total of possibleTotals) {
        if (total !== null && total !== undefined && !isNaN(parseFloat(total))) {
          console.log(`Using total from field: ${total}`);
          return parseFloat(total);
        }
      }
      
      console.log('No valid total found in fields, calculating from components...');
      
      // If no valid total found, calculate from components
      let calculatedTotal = 0;
      
      // Add subtotal from items
      if (order.items && Array.isArray(order.items)) {
        const itemsTotal = order.items.reduce((sum, item) => 
          sum + (parseFloat(item.price || 0) * (parseInt(item.quantity) || 1)), 0);
        calculatedTotal += itemsTotal;
        console.log('Items total:', itemsTotal);
      }
      
      // Add delivery fee
      if (order.deliveryFee) {
        const deliveryFee = parseFloat(order.deliveryFee) || 0;
        calculatedTotal += deliveryFee;
        console.log('Delivery fee:', deliveryFee);
      }
      
      // Add tip
      if (order.tip) {
        const tip = parseFloat(order.tip) || 0;
        calculatedTotal += tip;
        console.log('Tip:', tip);
      }
      
      // Add tax
      if (order.tax) {
        const tax = parseFloat(order.tax) || 0;
        calculatedTotal += tax;
        console.log('Tax:', tax);
      }
      
      console.log(`Final calculated total: ${calculatedTotal}`);
      console.log('=== END TOTAL CALCULATION DEBUG ===');
      
      return calculatedTotal;
    } catch (error) {
      console.error('Error calculating total amount for order:', order.id, error);
      return parseFloat(order.totalPrice) || 0;
    }
  }, []);

  // Debug: Log order data structure
  React.useEffect(() => {
    if (orders.length > 0) {
      console.log('=== DASHBOARD DEBUG ===');
      console.log('First order:', orders[0]);
      console.log('First order createdAt:', orders[0].createdAt);
      console.log('CreatedAt type:', typeof orders[0].createdAt);
      console.log('CreatedAt has toDate:', orders[0].createdAt?.toDate);
      console.log('=== END DASHBOARD DEBUG ===');
    } else {
      console.log('No orders found in database');
    }
  }, [orders]);

  // Process orders for statistics
  const processedOrders = React.useMemo(() => {
    return orders.map(order => {
      // Handle Firestore Timestamp conversion
      let createdAt;
      if (order.createdAt) {
        if (order.createdAt.toDate && typeof order.createdAt.toDate === 'function') {
          // Firestore Timestamp object
          createdAt = order.createdAt.toDate();
        } else if (order.createdAt instanceof Date) {
          // Already a Date object
          createdAt = order.createdAt;
        } else if (typeof order.createdAt === 'string') {
          // String date
          createdAt = new Date(order.createdAt);
        } else if (typeof order.createdAt === 'number') {
          // Timestamp number
          createdAt = new Date(order.createdAt);
        } else {
          // Fallback to current date
          createdAt = new Date();
        }
      } else {
        // No createdAt, use current date
        createdAt = new Date();
      }

      // Calculate total amount including delivery fees and tips
      const totalAmount = getTotalAmount(order);

      return {
        ...order,
        status: order.status || 'pending',
        totalPrice: totalAmount, // Use calculated total instead of just totalPrice
        createdAt: createdAt
      };
    });
  }, [orders, getTotalAmount]);

  // Order status counts
  const orderStatusCounts = React.useMemo(() => {
    try {
      const counts = {
        pending: 0,
        confirm: 0,
        preparing: 0,
        out_for_delivery: 0,
        delivered: 0
      };
      
      console.log('=== STATUS COUNTS DEBUG ===');
      console.log('Processing orders for status counts:', processedOrders.length);
      
      processedOrders.forEach(order => {
        const status = order.status || 'pending';
        counts[status] = (counts[status] || 0) + 1;
        console.log(`Order ${order.id}: status = ${status}, totalPrice = ${order.totalPrice}`);
      });
      
      console.log('Final status counts:', counts);
      console.log('=== END STATUS COUNTS DEBUG ===');
      
      return counts;
    } catch (error) {
      console.error('Error calculating status counts:', error);
      return { pending: 0, confirm: 0, preparing: 0, out_for_delivery: 0, delivered: 0 };
    }
  }, [processedOrders]);

  // Today's orders
  const todayOrders = React.useMemo(() => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      console.log('=== TODAY ORDERS DEBUG ===');
      console.log('Today start:', today);
      console.log('Total processed orders:', processedOrders.length);
      
      const filtered = processedOrders.filter(order => {
        if (!order.createdAt) {
          console.log('Order has no createdAt:', order.id);
          return false;
        }
        
        if (!(order.createdAt instanceof Date)) {
          console.log('Order createdAt is not a Date:', order.id, order.createdAt);
          return false;
        }
        
        if (isNaN(order.createdAt.getTime())) {
          console.log('Order createdAt is invalid Date:', order.id, order.createdAt);
          return false;
        }
        
        const isToday = order.createdAt >= today;
        console.log(`Order ${order.id}: ${order.createdAt} >= ${today} = ${isToday}`);
        return isToday;
      });
      
      console.log('Today orders count:', filtered.length);
      console.log('=== END TODAY ORDERS DEBUG ===');
      
      return filtered;
    } catch (error) {
      console.error('Error filtering today orders:', error);
      return [];
    }
  }, [processedOrders]);

  // Revenue calculations with breakdown
  const revenueBreakdown = React.useMemo(() => {
    try {
      const breakdown = {
        itemsAndTax: 0,
        deliveryCharge: 0,
        tip: 0,
        total: 0
      };
      
      processedOrders.forEach(order => {
        // Items + Tax
        let itemsTotal = 0;
        if (order.items && Array.isArray(order.items)) {
          itemsTotal = order.items.reduce((sum, item) => 
            sum + (parseFloat(item.price || 0) * (parseInt(item.quantity) || 1)), 0);
        }
        const tax = parseFloat(order.tax) || 0;
        breakdown.itemsAndTax += itemsTotal + tax;
        
        // Delivery Charge
        const deliveryFee = parseFloat(order.deliveryFee) || 0;
        breakdown.deliveryCharge += deliveryFee;
        
        // Tip
        const tip = parseFloat(order.tip) || 0;
        breakdown.tip += tip;
        
        // Total
        breakdown.total += itemsTotal + tax + deliveryFee + tip;
        
        console.log(`Order ${order.id} breakdown:`, {
          itemsTotal,
          tax,
          deliveryFee,
          tip,
          total: itemsTotal + tax + deliveryFee + tip
        });
      });
      
      console.log('Revenue breakdown:', breakdown);
      return breakdown;
    } catch (error) {
      console.error('Error calculating revenue breakdown:', error);
      return { itemsAndTax: 0, deliveryCharge: 0, tip: 0, total: 0 };
    }
  }, [processedOrders]);

  const todayRevenueBreakdown = React.useMemo(() => {
    try {
      const breakdown = {
        itemsAndTax: 0,
        deliveryCharge: 0,
        tip: 0,
        total: 0
      };
      
      todayOrders.forEach(order => {
        // Items + Tax
        let itemsTotal = 0;
        if (order.items && Array.isArray(order.items)) {
          itemsTotal = order.items.reduce((sum, item) => 
            sum + (parseFloat(item.price || 0) * (parseInt(item.quantity) || 1)), 0);
        }
        const tax = parseFloat(order.tax) || 0;
        breakdown.itemsAndTax += itemsTotal + tax;
        
        // Delivery Charge
        const deliveryFee = parseFloat(order.deliveryFee) || 0;
        breakdown.deliveryCharge += deliveryFee;
        
        // Tip
        const tip = parseFloat(order.tip) || 0;
        breakdown.tip += tip;
        
        // Total
        breakdown.total += itemsTotal + tax + deliveryFee + tip;
      });
      
      console.log('Today revenue breakdown:', breakdown);
      return breakdown;
    } catch (error) {
      console.error('Error calculating today revenue breakdown:', error);
      return { itemsAndTax: 0, deliveryCharge: 0, tip: 0, total: 0 };
    }
  }, [todayOrders]);

  const totalRevenue = React.useMemo(() => {
    return revenueBreakdown.total;
  }, [revenueBreakdown]);

  const todayRevenue = React.useMemo(() => {
    return todayRevenueBreakdown.total;
  }, [todayRevenueBreakdown]);

  const stats = React.useMemo(() => {
    try {
      console.log('=== STATS CALCULATION DEBUG ===');
      console.log('Today orders length:', todayOrders.length);
      console.log('Today revenue breakdown:', todayRevenueBreakdown);
      console.log('Order status counts:', orderStatusCounts);
      
      const statsArray = [
        { 
          title: 'Total Orders Today', 
          value: todayOrders.length.toString(), 
          change: '+12%', 
          trend: 'up', 
          icon: ShoppingCart 
        },
        { 
          title: 'Today\'s Revenue', 
          value: `₹${todayRevenue.toFixed(2)}`, 
          change: '+8%', 
          trend: 'up', 
          icon: DollarSign 
        },
        { 
          title: 'Pending Orders', 
          value: orderStatusCounts.pending.toString(), 
          change: orderStatusCounts.pending > 0 ? 'Needs attention' : 'All clear', 
          trend: orderStatusCounts.pending > 0 ? 'down' : 'up', 
          icon: Clock 
        },
        { 
          title: 'Out for Delivery', 
          value: orderStatusCounts.out_for_delivery.toString(), 
          change: 'Active deliveries', 
          trend: 'up', 
          icon: Package 
        },
      ];
      
      console.log('Final stats array:', statsArray);
      console.log('=== END STATS CALCULATION DEBUG ===');
      
      return statsArray;
    } catch (error) {
      console.error('Error calculating stats:', error);
      return [
        { title: 'Total Orders Today', value: '0', change: 'Error', trend: 'down', icon: ShoppingCart },
        { title: 'Today\'s Revenue', value: '₹0.00', change: 'Error', trend: 'down', icon: DollarSign },
        { title: 'Pending Orders', value: '0', change: 'Error', trend: 'down', icon: Clock },
        { title: 'Out for Delivery', value: '0', change: 'Error', trend: 'down', icon: Package },
      ];
    }
  }, [todayOrders, todayRevenue, orderStatusCounts, todayRevenueBreakdown]);

  const recentOrders = React.useMemo(() => {
    try {
      return processedOrders
        .sort((a, b) => {
          // Safe date comparison
          const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
          const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
          return bTime - aTime;
        })
        .slice(0, 5)
        .map(order => {
          // Safe date formatting
          let timeString = 'Unknown time';
          try {
            if (order.createdAt instanceof Date && !isNaN(order.createdAt.getTime())) {
              timeString = order.createdAt.toLocaleTimeString();
            }
          } catch (error) {
            console.log('Error formatting time for order:', order.id, error);
          }

          // Calculate breakdown for this order
          let itemsTotal = 0;
          if (order.items && Array.isArray(order.items)) {
            itemsTotal = order.items.reduce((sum, item) => 
              sum + (parseFloat(item.price || 0) * (parseInt(item.quantity) || 1)), 0);
          }
          const tax = parseFloat(order.tax) || 0;
          const deliveryFee = parseFloat(order.deliveryFee) || 0;
          const tip = parseFloat(order.tip) || 0;
          const total = itemsTotal + tax + deliveryFee + tip;

          return {
            id: `#${order.id?.toString().slice(-6) || 'N/A'}`,
            customer: order.userInfo?.name || 'Unknown Customer',
            status: order.status,
            itemsAndTax: itemsTotal + tax,
            deliveryCharge: deliveryFee,
            tip: tip,
            total: total,
            time: timeString,
            items: order.items?.length || 0
          };
        });
    } catch (error) {
      console.error('Error processing recent orders:', error);
      return [];
    }
  }, [processedOrders]);

  // Show loading state if no data yet
  if (orders.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Restaurant Dashboard</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-gray-100 text-gray-800', icon: '📋', label: 'Pending' },
      confirm: { color: 'bg-blue-100 text-blue-800', icon: '✅', label: 'Confirmed' },
      preparing: { color: 'bg-yellow-100 text-yellow-800', icon: '👨‍🍳', label: 'Preparing' },
      out_for_delivery: { color: 'bg-purple-100 text-purple-800', icon: '🚚', label: 'Out for Delivery' },
      delivered: { color: 'bg-green-100 text-green-800', icon: '🎉', label: 'Delivered' },
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <span>{config.icon}</span>
        <span>{config.label}</span>
      </Badge>
    );
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-gray-500',
      confirm: 'bg-blue-500',
      preparing: 'bg-yellow-500',
      out_for_delivery: 'bg-purple-500',
      delivered: 'bg-green-500',
    };
    return colors[status] || colors.pending;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Restaurant Dashboard</h1>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(orderStatusCounts).map(([status, count]) => (
                <div key={status} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`}></div>
                      <span className="font-medium capitalize">{status.replace('_', ' ')}</span>
                    </div>
                    <span className="font-bold">{count}</span>
                  </div>
                  <Progress 
                    value={(count / Math.max(processedOrders.length, 1)) * 100} 
                    className="h-2" 
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.length > 0 ? recentOrders.map((order, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium">{order.id}</p>
                      <p className="text-sm text-gray-600">{order.customer}</p>
                      <p className="text-xs text-gray-500">{order.items} items • {order.time}</p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(order.status)}
                      <p className="text-lg font-bold text-green-700 mt-1">₹{order.total.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  {/* Order Breakdown */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-blue-50 p-2 rounded border border-blue-200">
                      <p className="font-medium text-blue-800">Items + Tax</p>
                      <p className="text-blue-600 font-bold">₹{order.itemsAndTax.toFixed(2)}</p>
                    </div>
                    <div className="bg-green-50 p-2 rounded border border-green-200">
                      <p className="font-medium text-green-800">Delivery</p>
                      <p className="text-green-600 font-bold">₹{order.deliveryCharge.toFixed(2)}</p>
                    </div>
                    <div className="bg-purple-50 p-2 rounded border border-purple-200">
                      <p className="font-medium text-purple-800">Tip</p>
                      <p className="text-purple-600 font-bold">₹{order.tip.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-gray-500">No recent orders</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">₹{totalRevenue.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Today's Revenue</p>
              <p className="text-2xl font-bold text-blue-600">₹{todayRevenue.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-purple-600">{processedOrders.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Today's Breakdown */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-blue-700">Today's Revenue Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-800">Items + Tax</p>
                      <p className="text-2xl font-bold text-blue-600">₹{todayRevenueBreakdown.itemsAndTax.toFixed(2)}</p>
                    </div>
                    <div className="text-blue-400">
                      <Package className="w-8 h-8" />
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-800">Delivery Charge</p>
                      <p className="text-2xl font-bold text-green-600">₹{todayRevenueBreakdown.deliveryCharge.toFixed(2)}</p>
                    </div>
                    <div className="text-green-400">
                      <MapPin className="w-8 h-8" />
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-800">Tip</p>
                      <p className="text-2xl font-bold text-purple-600">₹{todayRevenueBreakdown.tip.toFixed(2)}</p>
                    </div>
                    <div className="text-purple-400">
                      <DollarSign className="w-8 h-8" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Breakdown */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-700">Total Revenue Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Items + Tax</p>
                      <p className="text-2xl font-bold text-gray-600">₹{revenueBreakdown.itemsAndTax.toFixed(2)}</p>
                    </div>
                    <div className="text-gray-400">
                      <Package className="w-8 h-8" />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Delivery Charge</p>
                      <p className="text-2xl font-bold text-gray-600">₹{revenueBreakdown.deliveryCharge.toFixed(2)}</p>
                    </div>
                    <div className="text-gray-400">
                      <MapPin className="w-8 h-8" />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Tip</p>
                      <p className="text-2xl font-bold text-gray-600">₹{revenueBreakdown.tip.toFixed(2)}</p>
                    </div>
                    <div className="text-gray-400">
                      <DollarSign className="w-8 h-8" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
