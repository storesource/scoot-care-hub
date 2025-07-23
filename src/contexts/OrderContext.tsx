import React, { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';

export interface ScooterOrder {
  id: string;
  orderNumber: string;
  model: string;
  color: string;
  price: number;
  orderDate: Date;
  estimatedDelivery: Date;
  status: 'processing' | 'shipped' | 'in-transit' | 'out-for-delivery' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  deliveryAddress: string;
  customerPhone: string;
}

interface OrderContextType {
  orders: ScooterOrder[];
  getOrdersByPhone: (phone: string) => ScooterOrder[];
  getOrderStatus: (orderNumber: string) => string;
  updateOrderStatus: (orderId: string, status: ScooterOrder['status']) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders] = useState<ScooterOrder[]>([
    {
      id: '1',
      orderNumber: 'SCT-2024-001',
      model: 'ScootMax Pro',
      color: 'Electric Blue',
      price: 899,
      orderDate: new Date('2024-01-15'),
      estimatedDelivery: new Date('2024-01-25'),
      status: 'delivered',
      trackingNumber: 'TRK123456789',
      deliveryAddress: '123 Main St, City, State 12345',
      customerPhone: '+1234567890'
    },
    {
      id: '2',
      orderNumber: 'SCT-2024-002',
      model: 'ScootLite Urban',
      color: 'Midnight Black',
      price: 649,
      orderDate: new Date('2024-01-20'),
      estimatedDelivery: new Date('2024-01-30'),
      status: 'in-transit',
      trackingNumber: 'TRK987654321',
      deliveryAddress: '456 Oak Ave, City, State 12345',
      customerPhone: '+1234567890'
    },
    {
      id: '3',
      orderNumber: 'SCT-2024-003',
      model: 'ScootMax Elite',
      color: 'Pearl White',
      price: 1299,
      orderDate: new Date('2024-01-22'),
      estimatedDelivery: new Date('2024-02-01'),
      status: 'processing',
      deliveryAddress: '789 Pine Rd, City, State 12345',
      customerPhone: '+1234567890'
    }
  ]);

  const getOrdersByPhone = (phone: string): ScooterOrder[] => {
    return orders.filter(order => order.customerPhone === phone);
  };

  const getOrderStatus = (orderNumber: string): string => {
    const order = orders.find(o => o.orderNumber.toLowerCase() === orderNumber.toLowerCase());
    if (!order) {
      return "I couldn't find an order with that number. Please check your order number and try again, or contact support if you need assistance.";
    }

    const statusMessages = {
      'processing': `Your order ${order.orderNumber} for the ${order.model} is currently being processed. Estimated delivery: ${order.estimatedDelivery.toLocaleDateString()}.`,
      'shipped': `Great news! Your ${order.model} (Order ${order.orderNumber}) has been shipped. Tracking number: ${order.trackingNumber}. Expected delivery: ${order.estimatedDelivery.toLocaleDateString()}.`,
      'in-transit': `Your ${order.model} is on its way! Order ${order.orderNumber} is in transit with tracking number ${order.trackingNumber}. Expected delivery: ${order.estimatedDelivery.toLocaleDateString()}.`,
      'out-for-delivery': `Exciting! Your ${order.model} (Order ${order.orderNumber}) is out for delivery today. You should receive it within the next few hours.`,
      'delivered': `Your ${order.model} (Order ${order.orderNumber}) has been successfully delivered. We hope you enjoy your new scooter!`,
      'cancelled': `Order ${order.orderNumber} has been cancelled. If this was unexpected, please contact our support team for assistance.`
    };

    return statusMessages[order.status];
  };

  const updateOrderStatus = (orderId: string, status: ScooterOrder['status']) => {
    // In a real app, this would update the backend
    console.log(`Order ${orderId} status updated to: ${status}`);
  };

  return (
    <OrderContext.Provider value={{
      orders,
      getOrdersByPhone,
      getOrderStatus,
      updateOrderStatus
    }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};