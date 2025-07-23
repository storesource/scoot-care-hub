import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Package, Truck, MapPin, Calendar, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const OrdersSection = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (user) {
      fetchUserOrders();
    }
  }, [user]);

  const fetchUserOrders = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'out-for-delivery': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in-transit': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'shipped': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'processing': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <Package className="w-4 h-4" />;
      case 'out-for-delivery': 
      case 'in-transit': 
      case 'shipped': return <Truck className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  if (orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Your Orders
          </CardTitle>
          <CardDescription>Track your scooter deliveries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No orders found for this phone number.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Your Orders ({orders.length})
        </CardTitle>
        <CardDescription>Track your scooter deliveries and get status updates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {orders.map((order: any) => (
            <Card key={order.id} className="border-l-4 border-l-primary">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{order.model_name}</h3>
                    <p className="text-sm text-muted-foreground">Order #{order.id.slice(0, 8)}</p>
                  </div>
                  <Badge className={`${getStatusColor(order.order_status)} flex items-center gap-1`}>
                    {getStatusIcon(order.order_status)}
                    {order.order_status.replace('-', ' ')}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Model:</span>
                      <span>{order.model_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Order Date:</span>
                      <span>{new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {order.expected_delivery_date && (
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Est. Delivery:</span>
                        <span>{new Date(order.expected_delivery_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {order.order_status === 'processing' && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                    <p className="text-yellow-800">Your order is being prepared for shipment. You'll receive tracking information once it ships.</p>
                  </div>
                )}
                
                {order.order_status === 'shipped' && (
                  <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                    <p className="text-blue-800">Your scooter is on the way! Ask me for updates in the chat.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">
            💡 Tip: Ask me about your order status in the chat using your order number (e.g., "What's the status of order SCT-2024-001?")
          </p>
        </div>
      </CardContent>
    </Card>
  );
};