
import React, { useState } from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { DashboardOverview } from "@/components/DashboardOverview";
import { ProductManager } from "@/components/ProductManager";
import { OrderDashboard } from "@/components/OrderDashboard";
import { UserManagement } from "@/components/UserManagement";
import { RiderManagement } from "@/components/RiderManagement";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { InventoryTracking } from "@/components/InventoryTracking";
import { PromoManager } from "@/components/PromoManager";

const Index = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [userRole] = useState('Admin'); // This would come from auth context

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'products':
        return <ProductManager />;
      case 'orders':
        return <OrderDashboard />;
      case 'users':
        return <UserManagement />;
      case 'riders':
        return <RiderManagement />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'inventory':
        return <InventoryTracking />;
      case 'promos':
        return <PromoManager />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AdminSidebar 
          activeView={activeView} 
          setActiveView={setActiveView}
          userRole={userRole}
        />
        <main className="flex-1 p-6 overflow-auto">
          {renderActiveView()}
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;
