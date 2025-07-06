import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFirebaseCollection } from "@/hooks/useFirebaseData";
import { Clock, CheckCircle, AlertTriangle, XCircle, User, MapPin, Package, ChevronDown, ChevronUp } from "lucide-react";

export function OrderManager() {
  const { data: orders, loading, error, updateDocument } = useFirebaseCollection('orders');
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [updatingStatus, setUpdatingStatus] = useState(new Set());
  const [adminLocation, setAdminLocation] = useState(null);
  const [showRoute, setShowRoute] = useState(new Set());
  const [locationPermission, setLocationPermission] = useState('pending'); // 'pending', 'granted', 'denied', 'manual'
  const [manualLocation, setManualLocation] = useState({ lat: '', lng: '' });
  const [searchQuery, setSearchQuery] = useState('');

  // Get admin's current location on component mount
  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setAdminLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationPermission('granted');
          console.log('Location access granted:', position.coords);
        },
        (error) => {
          console.log('Error getting admin location:', error);
          setLocationPermission('denied');
          // Don't set default location automatically - let user choose
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    } else {
      setLocationPermission('denied');
    }
  }, []);

  // Debug: Log the first order to see its structure
  React.useEffect(() => {
    if (orders.length > 0) {
      console.log('=== ORDER DATA DEBUG ===');
      console.log('First order structure:', orders[0]);
      console.log('All orders:', orders);
      console.log('Order keys:', Object.keys(orders[0]));
      if (orders[0].user) {
        console.log('User object keys:', Object.keys(orders[0].user));
        console.log('User object:', orders[0].user);
      }
      console.log('=== END DEBUG ===');
    }
  }, [orders]);

  const getOrderDate = (order) => {
    // Try multiple possible field names for order date
    const possibleDates = [
      order.createdAt,
      order.orderDate,
      order.date,
      order.timestamp,
      order.orderedAt,
      order.placedAt,
      order.created,
      order.time,
      // If it's a Firestore timestamp, convert it
      order.createdAt?.toDate ? order.createdAt.toDate() : null,
      order.updatedAt?.toDate ? order.updatedAt.toDate() : null,
    ];
    
    // Find the first valid date
    for (const date of possibleDates) {
      if (date) {
        try {
          // Handle Firestore Timestamp objects
          if (date.toDate && typeof date.toDate === 'function') {
            return date.toDate();
          }
          // Handle regular Date objects
          if (date instanceof Date) {
            return date;
          }
          // Handle timestamp numbers
          if (typeof date === 'number') {
            return new Date(date);
          }
          // Handle date strings
          if (typeof date === 'string') {
            const parsedDate = new Date(date);
            if (!isNaN(parsedDate.getTime())) {
              return parsedDate;
            }
          }
        } catch (error) {
          console.log('Error parsing date:', date, error);
          continue;
        }
      }
    }
    
    return null;
  };

  const getUserName = (order) => {
    // Based on the actual data structure, user info is in userInfo object
    const possibleNames = [
      order.userInfo?.name,
      order.userName,
      order.customerName,
      order.customer,
      order.user?.name,
      order.user?.displayName,
      order.user?.fullName,
      order.buyerName,
      order.purchaserName,
      order.name,
    ];
    
    // Find the first non-empty, non-null value
    const userName = possibleNames.find(name => name && name.trim() !== '');
    
    if (userName) {
      return userName;
    }
    
    return 'Unknown User';
  };

  const getUserContact = (order) => {
    console.log('=== CONTACT DEBUG ===');
    console.log('Searching for contact info in order:', order.id);
    
    // Based on the actual data structure, contact info is in userInfo object
    const contactInfo = {
      phone: order.userInfo?.phone || order.user?.phone || order.phone,
      email: order.userInfo?.email || order.user?.email || order.email,
      address: getLocation(order), // Reuse the location function
    };

    // Clean up phone number
    if (contactInfo.phone && typeof contactInfo.phone === 'string') {
      contactInfo.phone = contactInfo.phone.replace(/[^\d+]/g, ''); // Keep only digits and +
    }

    console.log('Found contact info:', contactInfo);
    console.log('=== END CONTACT DEBUG ===');

    return contactInfo;
  };

  const getLocation = (order) => {
    const location = order.location || order.address || order.deliveryAddress || order.user?.address;
    
    // If location is an object, extract the address string
    if (location && typeof location === 'object') {
      // Handle different possible object structures
      if (location.address) {
        return `${location.address}${location.city ? `, ${location.city}` : ''}${location.state ? `, ${location.state}` : ''}${location.pincode ? ` - ${location.pincode}` : ''}`;
      } else if (location.name) {
        return `${location.name}${location.city ? `, ${location.city}` : ''}${location.state ? `, ${location.state}` : ''}`;
      } else {
        // Fallback: try to stringify the object
        return JSON.stringify(location);
      }
    }
    
    // If location is a string, return it directly
    if (typeof location === 'string') {
      return location;
    }
    
    return 'Location not specified';
  };

  // Sort orders by createdAt descending (latest first)
  const sortedOrders = React.useMemo(() => {
    let filteredOrders = [...orders];
    
    // Apply search filter if search query exists
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filteredOrders = orders.filter(order => {
        // Search by order ID
        const orderId = order.id?.toString().toLowerCase() || '';
        if (orderId.includes(query)) return true;
        
        // Search by customer name
        const customerName = getUserName(order).toLowerCase();
        if (customerName.includes(query)) return true;
        
        // Search by email
        const email = getUserContact(order).email?.toLowerCase() || '';
        if (email.includes(query)) return true;
        
        // Search by phone (optional)
        const phone = getUserContact(order).phone?.toLowerCase() || '';
        if (phone.includes(query)) return true;
        
        return false;
      });
    }
    
    // Sort filtered orders by date (latest first)
    return filteredOrders.sort((a, b) => {
      const aTime = getOrderDate(a)?.getTime() || 0;
      const bTime = getOrderDate(b)?.getTime() || 0;
      return bTime - aTime; // Latest first (descending)
    });
  }, [orders, searchQuery]);

  const getStatusBadge = (status, orderId) => {
    const statusConfig = orderStatuses.find(s => s.value === status) || orderStatuses[0];
    const isUpdating = updatingStatus.has(orderId);
    
    return (
      <div className="relative">
        <select
          value={status || 'pending'}
          onChange={(e) => handleStatusChange(orderId, e.target.value)}
          disabled={isUpdating}
          className={`${statusConfig.color} border-0 rounded-full px-3 py-1 text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed appearance-none pr-8 flex items-center gap-1`}
        >
          {orderStatuses.map((statusOption) => (
            <option key={statusOption.value} value={statusOption.value}>
              {statusOption.icon} {statusOption.label}
            </option>
          ))}
        </select>
        {isUpdating && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-full">
            <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    );
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return '₹0.00';
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return '₹0.00';
    return `₹${numPrice.toFixed(2)}`;
  };

  const getTotalAmount = (order) => {
    try {
      // Try multiple possible field names for total amount
      const possibleTotals = [
        order.total,
        order.totalAmount,
        order.amount,
        order.grandTotal,
        order.finalAmount,
        order.price,
        order.cost,
      ];
      
      // Find the first valid number
      for (const total of possibleTotals) {
        if (total !== null && total !== undefined && !isNaN(parseFloat(total))) {
          return parseFloat(total);
        }
      }
      
      // If no valid total found, calculate from components
      let calculatedTotal = 0;
      
      // Add subtotal from items
      if (order.items && Array.isArray(order.items)) {
        calculatedTotal += order.items.reduce((sum, item) => 
          sum + (parseFloat(item.price || 0) * (parseInt(item.quantity) || 1)), 0);
      }
      
      // Add delivery fee
      if (order.deliveryFee) {
        calculatedTotal += parseFloat(order.deliveryFee) || 0;
      }
      
      // Add tip
      if (order.tip) {
        calculatedTotal += parseFloat(order.tip) || 0;
      }
      
      // Add tax
      if (order.tax) {
        calculatedTotal += parseFloat(order.tax) || 0;
      }
      
      console.log(`Order ${order.id} total calculation:`, {
        itemsTotal: order.items ? order.items.reduce((sum, item) => sum + (parseFloat(item.price || 0) * (parseInt(item.quantity) || 1)), 0) : 0,
        deliveryFee: parseFloat(order.deliveryFee) || 0,
        tip: parseFloat(order.tip) || 0,
        tax: parseFloat(order.tax) || 0,
        calculatedTotal: calculatedTotal
      });
      
      return calculatedTotal;
    } catch (error) {
      console.error('Error calculating total amount for order:', order.id, error);
      return 0;
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown time';
    
    try {
      return date.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.log('Error formatting date:', date, error);
      return 'Invalid date';
    }
  };

  const getTimeAgo = (date) => {
    if (!date) return '';
    
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return '';
  };

  const isRecentOrder = (date) => {
    if (!date) return false;
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    return diffInHours < 24; // Orders from last 24 hours
  };

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const toggleRouteDisplay = (orderId) => {
    setShowRoute(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
  };

  const getDirectionsUrl = (userLat, userLng) => {
    if (!adminLocation) return null;
    return `https://www.google.com/maps/dir/${adminLocation.lat},${adminLocation.lng}/${userLat},${userLng}`;
  };

  const formatDistance = (distance) => {
    if (distance < 1) {
      return `${(distance * 1000).toFixed(0)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setUpdatingStatus(prev => new Set(prev).add(orderId));
      
      await updateDocument(orderId, {
        status: newStatus,
        updatedAt: new Date()
      });
      
      console.log(`Order ${orderId} status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
    } finally {
      setUpdatingStatus(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const orderStatuses = [
    { value: 'pending', label: 'Pending', color: 'bg-gray-100 text-gray-800', icon: '📋' },
    { value: 'confirm', label: 'Confirmed', color: 'bg-blue-100 text-blue-800', icon: '✅' },
    { value: 'preparing', label: 'Preparing', color: 'bg-yellow-100 text-yellow-800', icon: '👨‍🍳' },
    { value: 'out_for_delivery', label: 'Out for Delivery', color: 'bg-purple-100 text-purple-800', icon: '🚚' },
    { value: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-800', icon: '🎉' },
  ];

  const requestLocationPermission = () => {
    if (navigator.geolocation) {
      setLocationPermission('pending');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setAdminLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationPermission('granted');
          console.log('Location access granted:', position.coords);
        },
        (error) => {
          console.log('Error getting admin location:', error);
          setLocationPermission('denied');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    }
  };

  const setManualLocationHandler = () => {
    const lat = parseFloat(manualLocation.lat);
    const lng = parseFloat(manualLocation.lng);
    
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      setAdminLocation({ lat, lng });
      setLocationPermission('manual');
      console.log('Manual location set:', { lat, lng });
    } else {
      alert('Please enter valid coordinates. Latitude: -90 to 90, Longitude: -180 to 180');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 py-8 lg:py-12">
      <h1 className="text-3xl font-extrabold mb-6">Latest Orders</h1>
      
      {/* Search Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search Orders
            </label>
            <input
              type="text"
              id="search"
              placeholder="Search by Order ID, Customer Name, or Email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setSearchQuery('')}
              disabled={!searchQuery.trim()}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
        {searchQuery.trim() && (
          <div className="mt-2 text-sm text-gray-600">
            Found {sortedOrders.length} order{sortedOrders.length !== 1 ? 's' : ''} matching "{searchQuery}"
          </div>
        )}
      </div>

      {/* Location Permission Banner */}
      {locationPermission !== 'granted' && locationPermission !== 'manual' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="text-yellow-600 text-lg">📍</div>
            <div className="flex-1">
              <h3 className="font-medium text-yellow-800 mb-2">Location Access Required</h3>
              <p className="text-sm text-yellow-700 mb-3">
                To calculate distances and provide routes to customers, we need your location. 
                You can either grant location permission or enter your coordinates manually.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={requestLocationPermission}
                  disabled={locationPermission === 'pending'}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {locationPermission === 'pending' ? 'Requesting...' : 'Grant Location Permission'}
                </button>
                <details className="inline-block">
                  <summary className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 cursor-pointer">
                    Enter Coordinates Manually
                  </summary>
                  <div className="mt-3 p-3 bg-white rounded border">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Latitude</label>
                        <input
                          type="number"
                          step="any"
                          placeholder="e.g., 22.5726"
                          value={manualLocation.lat}
                          onChange={(e) => setManualLocation(prev => ({ ...prev, lat: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Longitude</label>
                        <input
                          type="number"
                          step="any"
                          placeholder="e.g., 88.3639"
                          value={manualLocation.lng}
                          onChange={(e) => setManualLocation(prev => ({ ...prev, lng: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        />
                      </div>
                    </div>
                    <button
                      onClick={setManualLocationHandler}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                    >
                      Set Location
                    </button>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location Status */}
      {(locationPermission === 'granted' || locationPermission === 'manual') && adminLocation && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
          <div className="flex items-center gap-2 text-sm text-green-800">
            <span>✅</span>
            <span>
              {locationPermission === 'granted' ? 'Location access granted' : 'Manual location set'}: 
              {adminLocation.lat.toFixed(6)}, {adminLocation.lng.toFixed(6)}
            </span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-lg text-center py-12">Loading orders...</div>
      ) : error ? (
        <div className="text-lg text-red-600 text-center py-12">Error loading orders: {error}</div>
      ) : sortedOrders.length === 0 ? (
        <div className="text-lg text-gray-500 text-center py-12">No orders found.</div>
      ) : (
        <div className="space-y-4">
          {sortedOrders.slice(0, 20).map((order, idx) => {
            const totalAmount = getTotalAmount(order);
            const userName = getUserName(order);
            const orderDate = getOrderDate(order);
            const timeAgo = getTimeAgo(orderDate);
            const isRecent = isRecentOrder(orderDate);
            
            return (
              <Card key={order.id || idx} className={`border-0 shadow-md rounded-xl hover:shadow-lg transition-shadow ${isRecent ? 'ring-2 ring-blue-200 bg-blue-50/30' : ''}`}>
                <CardContent className="p-6">
                  {/* Header with Order ID and Status */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xl">#{order.id?.toString().slice(-6) || 'N/A'}</span>
                        {isRecent && (
                          <Badge className="bg-blue-100 text-blue-800 text-xs">
                            Latest
                          </Badge>
                        )}
                      </div>
                      {getStatusBadge(order.status, order.id)}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-700">{formatPrice(totalAmount)}</div>
                      <div className="text-xs text-gray-400">{order.category || 'N/A'}</div>
                    </div>
                  </div>

                  {/* User and Location Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-gray-900">{userName}</div>
                        <div className="text-sm text-gray-500 space-y-1">
                          {(() => {
                            const contact = getUserContact(order);
                            return (
                              <>
                                {contact.phone && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs">📞</span>
                                    <span>{contact.phone}</span>
                                  </div>
                                )}
                                {contact.email && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs">✉️</span>
                                    <span>{contact.email}</span>
                                  </div>
                                )}
                                {!contact.phone && !contact.email && (
                                  <span>No contact details</span>
                                )}
                              </>
                            );
                          })()}
                        </div>
                        {/* Temporary Debug Info */}
                        <details className="mt-2 text-xs text-gray-400">
                          <summary className="cursor-pointer">Debug: Show raw data</summary>
                          <pre className="mt-1 bg-gray-100 p-2 rounded text-xs overflow-auto max-h-20">
                            {JSON.stringify({
                              userName: userName,
                              userInfo: order.userInfo,
                              contact: getUserContact(order),
                              deliveryAddress: order.deliveryAddress,
                              status: order.status,
                              totalPrice: order.totalPrice
                            }, null, 2)}
                          </pre>
                        </details>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">Delivery Location</div>
                        <div className="text-sm text-gray-500">{getLocation(order)}</div>
                        {order.userLocation && adminLocation && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="text-sm font-medium text-blue-900 mb-2">📍 Location Comparison</div>
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Your Location:</span>
                                <span className="font-mono text-gray-800">
                                  {adminLocation.lat.toFixed(6)}, {adminLocation.lng.toFixed(6)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Customer Location:</span>
                                <span className="font-mono text-gray-800">
                                  {order.userLocation.lat.toFixed(6)}, {order.userLocation.lng.toFixed(6)}
                                </span>
                              </div>
                              <div className="border-t pt-2 mt-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-600">📏 Distance:</span>
                                  <span className="font-bold text-blue-700">
                                    {formatDistance(calculateDistance(
                                      adminLocation.lat, 
                                      adminLocation.lng, 
                                      order.userLocation.lat, 
                                      order.userLocation.lng
                                    ))}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="mt-3 flex gap-2">
                              <a
                                href={getDirectionsUrl(order.userLocation.lat, order.userLocation.lng)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 bg-blue-600 text-white text-xs px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center font-medium"
                              >
                                🗺️ Get Route to Customer
                              </a>
                              <button
                                onClick={() => toggleRouteDisplay(order.id)}
                                className="px-3 py-2 text-xs border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
                              >
                                {showRoute.has(order.id) ? 'Hide Details' : 'Show Details'}
                              </button>
                            </div>
                            {showRoute.has(order.id) && (
                              <div className="mt-3 p-2 bg-white rounded border text-xs text-gray-600">
                                <div className="font-medium mb-1">Route Information:</div>
                                <div>• Click "Get Route to Customer" to open Google Maps</div>
                                <div>• Route will be from your current location to customer</div>
                                <div>• Distance: {formatDistance(calculateDistance(
                                  adminLocation.lat, 
                                  adminLocation.lng, 
                                  order.userLocation.lat, 
                                  order.userLocation.lng
                                ))}</div>
                              </div>
                            )}
                          </div>
                        )}
                        {!adminLocation && (
                          <div className="mt-2 text-xs text-orange-600">
                            ⚠️ Location access needed for distance calculation
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Price Breakdown - 3 Slot Format */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="text-sm font-medium text-gray-700 mb-3">Price Breakdown</div>
                    <div className="grid grid-cols-3 gap-3">
                      {/* Items + Tax */}
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-blue-800">Items + Tax</p>
                            <p className="text-lg font-bold text-blue-600">
                              ₹{(() => {
                                let itemsTotal = 0;
                                if (order.items && Array.isArray(order.items)) {
                                  itemsTotal = order.items.reduce((sum, item) => 
                                    sum + (parseFloat(item.price || 0) * (parseInt(item.quantity) || 1)), 0);
                                }
                                const tax = parseFloat(order.tax) || 0;
                                return (itemsTotal + tax).toFixed(2);
                              })()}
                            </p>
                          </div>
                          <div className="text-blue-400">
                            <Package className="w-6 h-6" />
                          </div>
                        </div>
                      </div>

                      {/* Delivery Charge */}
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-green-800">Delivery Charge</p>
                            <p className="text-lg font-bold text-green-600">
                              ₹{(parseFloat(order.deliveryFee) || 0).toFixed(2)}
                            </p>
                          </div>
                          <div className="text-green-400">
                            <MapPin className="w-6 h-6" />
                          </div>
                        </div>
                      </div>

                      {/* Tip */}
                      <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-purple-800">Tip</p>
                            <p className="text-lg font-bold text-purple-600">
                              ₹{(parseFloat(order.tip) || 0).toFixed(2)}
                            </p>
                          </div>
                          <div className="text-purple-400">
                            <span className="text-2xl">💰</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Total */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Total Amount</span>
                        <span className="text-xl font-bold text-green-700">{formatPrice(totalAmount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  {order.items && order.items.length > 0 && (
                    <div className="mb-4">
                      <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Order Items ({order.items.length})
                      </div>
                      <div className="space-y-2">
                        {(() => {
                          const isExpanded = expandedOrders.has(order.id);
                          const itemsToShow = isExpanded ? order.items : order.items.slice(0, 3);
                          
                          return (
                            <>
                              {itemsToShow.map((item, itemIdx) => (
                                <div key={itemIdx} className="flex justify-between text-sm">
                                  <span className="text-gray-600">
                                    {item.quantity || 1}x {item.name || item.productName || 'Unknown Item'}
                                  </span>
                                  <span className="font-medium">{formatPrice(item.price)}</span>
                                </div>
                              ))}
                              {order.items.length > 3 && (
                                <button
                                  onClick={() => toggleOrderExpansion(order.id)}
                                  className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors"
                                >
                                  {isExpanded ? (
                                    <>
                                      <ChevronUp className="w-4 h-4" />
                                      Show less
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="w-4 h-4" />
                                      +{order.items.length - 3} more items
                                    </>
                                  )}
                                </button>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Footer with Timestamp */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex flex-col">
                      <div className="text-sm text-gray-500">
                        Ordered: {formatDate(orderDate)}
                      </div>
                      {timeAgo && (
                        <div className="text-xs text-blue-600 font-medium">
                          {timeAgo}
                        </div>
                      )}
                    </div>
                    {(() => {
                      const updatedDate = getOrderDate({ createdAt: order.updatedAt });
                      if (updatedDate && orderDate && updatedDate.getTime() !== orderDate.getTime()) {
                        return (
                          <div className="text-sm text-gray-500">
                            Updated: {formatDate(updatedDate)}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default OrderManager; 