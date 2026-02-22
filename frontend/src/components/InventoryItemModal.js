import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { X } from 'lucide-react';

const InventoryItemModal = ({ item, category, categories, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: category,
    subcategory: '',
    quantity: 0,
    available: 0,
    empty: 0,
    unit: 'pcs',
    min_threshold: 10
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentCategory = categories.find(cat => cat.id === formData.category);
  const subcategories = currentCategory ? currentCategory.subcategories : [];

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        category: item.category,
        subcategory: item.subcategory,
        quantity: item.quantity,
        available: item.available || 0,
        empty: item.empty || 0,
        unit: item.unit,
        min_threshold: item.min_threshold
      });
    } else {
      setFormData(prev => ({ 
        ...prev, 
        category: category,
        subcategory: subcategories[0] || ''
      }));
    }
  }, [item, category, categories]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (item) {
        await api.put(`/inventory/${item.id}`, {
          quantity: formData.quantity,
          available: formData.available,
          empty: formData.empty,
          min_threshold: formData.min_threshold
        });
      } else {
        await api.post('/inventory', formData);
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  const isGasItem = formData.subcategory === 'Gas';

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-sm w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="font-space text-xl font-semibold text-foreground uppercase">
            {item ? 'Update Item' : 'Add New Item'}
          </h2>
          <button
            data-testid="close-modal-button"
            onClick={onClose}
            className="p-1 hover:bg-secondary rounded-sm transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div data-testid="modal-error" className="p-3 bg-destructive/20 border border-destructive/50 rounded-sm text-sm text-destructive-foreground">
              {error}
            </div>
          )}

          {!item && (
            <>
              <div>
                <label className="block font-manrope text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Item Name
                </label>
                <input
                  data-testid="item-name-input"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-background/50 border border-border rounded-sm font-manrope text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block font-manrope text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Subcategory
                </label>
                <select
                  data-testid="subcategory-select"
                  value={formData.subcategory}
                  onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                  className="w-full px-4 py-2 bg-background/50 border border-border rounded-sm font-manrope text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
                  required
                >
                  {subcategories.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-manrope text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Unit
                </label>
                <select
                  data-testid="unit-select"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-4 py-2 bg-background/50 border border-border rounded-sm font-manrope text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
                  required
                >
                  <option value="pcs">Pieces</option>
                  <option value="kg">Kilograms</option>
                  <option value="ltr">Liters</option>
                  <option value="box">Boxes</option>
                  <option value="cylinder">Cylinders</option>
                </select>
              </div>
            </>
          )}

          {isGasItem ? (
            <>
              <div>
                <label className="block font-manrope text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Available Cylinders
                </label>
                <input
                  data-testid="available-input"
                  type="number"
                  min="0"
                  value={formData.available}
                  onChange={(e) => setFormData({ ...formData, available: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-background/50 border border-border rounded-sm font-manrope text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block font-manrope text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Empty Cylinders
                </label>
                <input
                  data-testid="empty-input"
                  type="number"
                  min="0"
                  value={formData.empty}
                  onChange={(e) => setFormData({ ...formData, empty: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-background/50 border border-border rounded-sm font-manrope text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
                  required
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block font-manrope text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Quantity
              </label>
              <input
                data-testid="quantity-input"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-background/50 border border-border rounded-sm font-manrope text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
                required
              />
            </div>
          )}

          <div>
            <label className="block font-manrope text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Minimum Threshold
            </label>
            <input
              data-testid="threshold-input"
              type="number"
              min="0"
              value={formData.min_threshold}
              onChange={(e) => setFormData({ ...formData, min_threshold: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 bg-background/50 border border-border rounded-sm font-manrope text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-secondary border border-border rounded-sm font-space text-sm uppercase text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              data-testid="save-item-button"
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-sm font-space text-sm uppercase shadow-[0_0_15px_rgba(70,130,180,0.3)] hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InventoryItemModal;
