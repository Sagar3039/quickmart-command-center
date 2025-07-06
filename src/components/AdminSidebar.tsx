import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  User, 
  BarChart, 
  Package2, 
  Bell,
  Settings,
  ShoppingCart
} from "lucide-react";

interface AdminSidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  userRole: string;
}

export function AdminSidebar({ activeView, setActiveView, userRole }: AdminSidebarProps) {
  const menuItems = [
    { id: 'dashboard', title: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Product Manager', 'Delivery Ops', 'Support'] },
    { id: 'orders', title: 'Orders', icon: ShoppingCart, roles: ['Admin', 'Support'] },
    { id: 'products', title: 'Products', icon: Package, roles: ['Admin', 'Product Manager'] },
    { id: 'users', title: 'Users', icon: Users, roles: ['Admin', 'Support'] },
    { id: 'riders', title: 'Riders', icon: User, roles: ['Admin', 'Delivery Ops'] },
    { id: 'analytics', title: 'Analytics', icon: BarChart, roles: ['Admin'] },
    { id: 'inventory', title: 'Inventory', icon: Package2, roles: ['Admin', 'Product Manager'] },
    { id: 'promos', title: 'Promotions', icon: Bell, roles: ['Admin', 'Product Manager'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <Sidebar className="border-r bg-white">
      <SidebarHeader className="border-b p-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg">QuicklyMart</h2>
            <p className="text-sm text-gray-500">Admin Dashboard</p>
          </div>
        </div>
        <SidebarTrigger className="ml-auto" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    onClick={() => setActiveView(item.id)}
                    isActive={activeView === item.id}
                    className="w-full justify-start"
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => setActiveView('settings')}
                  isActive={activeView === 'settings'}
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
