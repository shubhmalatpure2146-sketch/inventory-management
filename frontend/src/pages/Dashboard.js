import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { LogOut, Package, ShoppingCart, Users, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import ResourcesTab from '../components/ResourcesTab';
import OrdersTab from '../components/OrdersTab';
import VendorsTab from '../components/VendorsTab';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('resources');
  const [stats, setStats] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      fetchStats();
    }
  }, [user, navigate]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user || !stats) return (
    <div className="min-h-screen bg-background industrial-noise flex items-center justify-center">
      <div className="font-space text-xl text-muted-foreground">Loading...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background industrial-noise">
      <header className="bg-card/50 backdrop-blur-sm border-b border-border">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-space text-2xl font-bold text-foreground uppercase tracking-tight">Inventory System</h1>
            <p className="font-manrope text-sm text-muted-foreground mt-1">{user.name} • {user.role.replace('_', ' ').toUpperCase()}</p>
          </div>
          <button
            data-testid="logout-button"
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border rounded-sm font-manrope text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div data-testid="stat-total-items" className="bg-card/50 backdrop-blur-sm border border-border rounded-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-8 h-8 text-primary" />
              <span className="font-mono text-3xl font-bold text-foreground">{stats.total_items}</span>
            </div>
            <p className="font-manrope text-xs uppercase tracking-wider text-muted-foreground">Total Items</p>
          </div>

          <div data-testid="stat-low-stock" className="bg-card/50 backdrop-blur-sm border border-yellow-800/50 rounded-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-8 h-8 text-yellow-400" />
              <span className="font-mono text-3xl font-bold text-yellow-400">{stats.low_stock_count}</span>
            </div>
            <p className="font-manrope text-xs uppercase tracking-wider text-muted-foreground">Low Stock</p>
          </div>

          <div data-testid="stat-out-of-stock" className="bg-card/50 backdrop-blur-sm border border-red-800/50 rounded-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingDown className="w-8 h-8 text-red-400" />
              <span className="font-mono text-3xl font-bold text-red-400">{stats.out_of_stock_count}</span>
            </div>
            <p className="font-manrope text-xs uppercase tracking-wider text-muted-foreground">Out of Stock</p>
          </div>

          <div data-testid="stat-pending-orders" className="bg-card/50 backdrop-blur-sm border border-border rounded-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <ShoppingCart className="w-8 h-8 text-primary" />
              <span className="font-mono text-3xl font-bold text-foreground">{stats.pending_orders}</span>
            </div>
            <p className="font-manrope text-xs uppercase tracking-wider text-muted-foreground">Pending Orders</p>
          </div>
        </div>

        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-sm">
          <div className="flex border-b border-border bg-secondary/50 p-1 rounded-t-sm">
            <button
              data-testid="resources-tab"
              onClick={() => setActiveTab('resources')}
              className={`flex-1 py-3 px-6 rounded-sm font-space text-sm uppercase font-medium transition-all ${
                activeTab === 'resources'
                  ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(70,130,180,0.3)]'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Package className="inline-block w-4 h-4 mr-2" />
              Resources / Items
            </button>
            <button
              data-testid="orders-tab"
              onClick={() => setActiveTab('orders')}
              className={`flex-1 py-3 px-6 rounded-sm font-space text-sm uppercase font-medium transition-all ${
                activeTab === 'orders'
                  ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(70,130,180,0.3)]'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ShoppingCart className="inline-block w-4 h-4 mr-2" />
              Orders Placed
            </button>
            <button
              data-testid="vendors-tab"
              onClick={() => setActiveTab('vendors')}
              className={`flex-1 py-3 px-6 rounded-sm font-space text-sm uppercase font-medium transition-all ${
                activeTab === 'vendors'
                  ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(70,130,180,0.3)]'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="inline-block w-4 h-4 mr-2" />
              Vendors
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'resources' && <ResourcesTab user={user} onRefresh={fetchStats} />}
            {activeTab === 'orders' && <OrdersTab user={user} onRefresh={fetchStats} />}
            {activeTab === 'vendors' && <VendorsTab user={user} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
