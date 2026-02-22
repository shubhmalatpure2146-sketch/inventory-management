import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Plus, Clock, CheckCircle, XCircle, Package } from 'lucide-react';
import { format } from 'date-fns';

const OrdersTab = ({ user, onRefresh }) => {
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchInventory();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await api.get('/inventory');
      setInventory(response.data);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const item = inventory.find(i => i.id === selectedItem);
      await api.post('/orders', {
        item_id: item.id,
        item_name: item.name,
        category: item.category,
        quantity: parseInt(quantity),
        notes: notes || null
      });
      setShowCreateModal(false);
      setSelectedItem('');
      setQuantity(1);
      setNotes('');
      fetchOrders();
      onRefresh();
    } catch (error) {
      alert('Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}`, { status: newStatus });
      fetchOrders();
      onRefresh();
    } catch (error) {
      alert('Failed to update order status');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'delivered':
        return <Package className="w-4 h-4 text-primary" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-950/30 text-yellow-400 border-yellow-800/50';
      case 'approved':
        return 'bg-emerald-950/30 text-emerald-400 border-emerald-800/50';
      case 'delivered':
        return 'bg-primary/30 text-primary border-primary/50';
      case 'rejected':
        return 'bg-red-950/30 text-red-400 border-red-800/50';
      default:
        return 'bg-secondary text-foreground border-border';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-space text-xl font-semibold text-foreground uppercase">Order Management</h2>
        <button
          data-testid="create-order-button"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-sm font-space text-sm uppercase shadow-[0_0_15px_rgba(70,130,180,0.3)] hover:bg-primary/90 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Order
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12 bg-card/50 backdrop-blur-sm border border-border rounded-sm">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="font-manrope text-muted-foreground">No orders placed yet</p>
        </div>
      ) : (
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left p-4 font-space text-xs uppercase tracking-wider text-muted-foreground">Item</th>
                  <th className="text-left p-4 font-space text-xs uppercase tracking-wider text-muted-foreground">Category</th>
                  <th className="text-left p-4 font-space text-xs uppercase tracking-wider text-muted-foreground">Quantity</th>
                  <th className="text-left p-4 font-space text-xs uppercase tracking-wider text-muted-foreground">Ordered By</th>
                  <th className="text-left p-4 font-space text-xs uppercase tracking-wider text-muted-foreground">Date</th>
                  <th className="text-left p-4 font-space text-xs uppercase tracking-wider text-muted-foreground">Status</th>
                  {user.role === 'inventory_manager' && (
                    <th className="text-left p-4 font-space text-xs uppercase tracking-wider text-muted-foreground">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {orders.map((order, index) => (
                  <tr key={order.id} data-testid={`order-row-${order.id}`} className={`border-b border-border/50 hover:bg-secondary/30 transition-colors ${index % 2 === 0 ? '' : 'bg-secondary/20'}`}>
                    <td className="p-4 font-manrope text-foreground">{order.item_name}</td>
                    <td className="p-4 font-manrope text-sm text-muted-foreground capitalize">{order.category}</td>
                    <td className="p-4 font-mono text-foreground font-semibold">{order.quantity}</td>
                    <td className="p-4 font-manrope text-sm text-muted-foreground">{order.ordered_by_name}</td>
                    <td className="p-4 font-mono text-xs text-muted-foreground">{format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-sm text-xs font-medium border uppercase tracking-wider ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </span>
                    </td>
                    {user.role === 'inventory_manager' && (
                      <td className="p-4">
                        {order.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              data-testid={`approve-order-${order.id}`}
                              onClick={() => handleStatusUpdate(order.id, 'approved')}
                              className="px-3 py-1 bg-emerald-950/30 text-emerald-400 border border-emerald-800/50 rounded-sm text-xs font-medium hover:bg-emerald-950/50 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              data-testid={`reject-order-${order.id}`}
                              onClick={() => handleStatusUpdate(order.id, 'rejected')}
                              className="px-3 py-1 bg-red-950/30 text-red-400 border border-red-800/50 rounded-sm text-xs font-medium hover:bg-red-950/50 transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {order.status === 'approved' && (
                          <button
                            data-testid={`deliver-order-${order.id}`}
                            onClick={() => handleStatusUpdate(order.id, 'delivered')}
                            className="px-3 py-1 bg-primary/30 text-primary border border-primary/50 rounded-sm text-xs font-medium hover:bg-primary/50 transition-colors"
                          >
                            Mark Delivered
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-sm w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-space text-xl font-semibold text-foreground uppercase">Create Order</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-secondary rounded-sm transition-colors"
              >
                <XCircle className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="p-6 space-y-4">
              <div>
                <label className="block font-manrope text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Select Item
                </label>
                <select
                  data-testid="order-item-select"
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                  className="w-full px-4 py-2 bg-background/50 border border-border rounded-sm font-manrope text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
                  required
                >
                  <option value="">Choose an item...</option>
                  {inventory.filter(item => item.status === 'low_stock' || item.status === 'out_of_stock').map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.category}) - {item.status.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-manrope text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Quantity
                </label>
                <input
                  data-testid="order-quantity-input"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-4 py-2 bg-background/50 border border-border rounded-sm font-manrope text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block font-manrope text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  data-testid="order-notes-input"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows="3"
                  className="w-full px-4 py-2 bg-background/50 border border-border rounded-sm font-manrope text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors resize-none"
                  placeholder="Add any additional notes..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-secondary border border-border rounded-sm font-space text-sm uppercase text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  data-testid="submit-order-button"
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-sm font-space text-sm uppercase shadow-[0_0_15px_rgba(70,130,180,0.3)] hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersTab;
