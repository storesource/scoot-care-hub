import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOrders } from '@/contexts/OrderContext';
import { useAuth } from '@/contexts/AuthContext';
import { Package, Truck, MapPin, Calendar, DollarSign } from 'lucide-react';

export const OrdersSection = () => {
  const { getOrdersByPhone } = useOrders();
  const { phoneNumber } = useAuth();
  const customerOrders = getOrdersByPhone(phoneNumber);

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

  if (customerOrders.length === 0) {
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
          Your Orders ({customerOrders.length})
        </CardTitle>
        <CardDescription>Track your scooter deliveries and get status updates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {customerOrders.map((order) => (
            <Card key={order.id} className="border-l-4 border-l-primary">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{order.model}</h3>
                    <p className="text-sm text-muted-foreground">Order #{order.orderNumber}</p>
                  </div>
                  <Badge className={`${getStatusColor(order.status)} flex items-center gap-1`}>
                    {getStatusIcon(order.status)}
                    {order.status.replace('-', ' ')}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Model:</span>
                      <span>{order.model} - {order.color}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Price:</span>
                      <span>${order.price}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Order Date:</span>
                      <span>{order.orderDate.toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Est. Delivery:</span>
                      <span>{order.estimatedDelivery.toLocaleDateString()}</span>
                    </div>
                    {order.trackingNumber && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Tracking:</span>
                        <span className="font-mono text-xs">{order.trackingNumber}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <span className="text-muted-foreground">Delivery to:</span>
                        <p className="text-xs">{order.deliveryAddress}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {order.status === 'processing' && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                    <p className="text-yellow-800">Your order is being prepared for shipment. You'll receive tracking information once it ships.</p>
                  </div>
                )}
                
                {order.status === 'in-transit' && (
                  <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                    <p className="text-blue-800">Your scooter is on the way! Ask me for updates using your order number in the chat.</p>
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