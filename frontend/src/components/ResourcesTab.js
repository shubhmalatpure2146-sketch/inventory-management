import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Plus, Edit2, Trash2, Search, Flame, Wrench, Archive, Filter, Settings, Package, Box, Truck, Tool, Factory, Hammer, Zap, Shield } from 'lucide-react';
import InventoryItemModal from './InventoryItemModal';
import CategoryManagement from './CategoryManagement';

const ResourcesTab = ({ user, onRefresh }) => {
  const [activeCategory, setActiveCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showCategoryManagement, setShowCategoryManagement] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const iconMap = {
    Flame, Wrench, Archive, Package, Box, Truck, Tool, Factory, Hammer, Settings, Zap, Shield
  };

  useEffect(() => {
    fetchCategories();
    fetchInventory();
  }, []);

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories]);

  useEffect(() => {
    filterItems();
  }, [inventory, activeCategory, searchQuery, filterStatus]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
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

  const filterItems = () => {
    let filtered = inventory.filter(item => item.category === activeCategory);
    
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(item => item.status === filterStatus);
    }
    
    setFilteredInventory(filtered);
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await api.delete(`/inventory/${itemId}`);
      fetchInventory();
      onRefresh();
    } catch (error) {
      alert('Failed to delete item');
    }
  };

  const handleSave = () => {
    setShowModal(false);
    setSelectedItem(null);
    fetchInventory();
    onRefresh();
  };

  const getStatusBadge = (status) => {
    const styles = {
      available: 'bg-emerald-950/30 text-emerald-400 border-emerald-800/50',
      low_stock: 'bg-yellow-950/30 text-yellow-400 border-yellow-800/50',
      out_of_stock: 'bg-red-950/30 text-red-400 border-red-800/50'
    };
    return styles[status] || styles.available;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      welding: Flame,
      fabrication: Wrench,
      miscellaneous: Archive
    };
    const Icon = icons[category] || Archive;
    return <Icon className="w-5 h-5" />;
  };

  const categories = [
    { id: 'welding', name: 'Welding', icon: Flame },
    { id: 'fabrication', name: 'Fabrication', icon: Wrench },
    { id: 'miscellaneous', name: 'Miscellaneous', icon: Archive }
  ];

  const subcategories = {
    welding: ['Welding Rods', 'Gas', 'Disposables'],
    fabrication: ['Grinder', 'Disposables'],
    miscellaneous: ['Nails', 'Packing Material', 'Other']
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          {categories.map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                data-testid={`category-${cat.id}`}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-sm font-space text-sm uppercase transition-all ${
                  activeCategory === cat.id
                    ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(70,130,180,0.3)]'
                    : 'bg-secondary border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat.name}
              </button>
            );
          })}
        </div>

        {user.role === 'inventory_manager' && (
          <button
            data-testid="add-item-button"
            onClick={() => {
              setSelectedItem(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-sm font-space text-sm uppercase shadow-[0_0_15px_rgba(70,130,180,0.3)] hover:bg-primary/90 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[250px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            data-testid="search-input"
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background/50 border border-border rounded-sm font-manrope text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
          />
        </div>

        <select
          data-testid="status-filter"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 bg-background/50 border border-border rounded-sm font-manrope text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
        >
          <option value="all">All Status</option>
          <option value="available">Available</option>
          <option value="low_stock">Low Stock</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
      </div>

      {subcategories[activeCategory].map(subcategory => {
        const items = filteredInventory.filter(item => item.subcategory === subcategory);
        if (items.length === 0) return null;

        return (
          <div key={subcategory} data-testid={`subcategory-${subcategory.toLowerCase().replace(/\s+/g, '-')}`} className="space-y-3">
            <h3 className="font-space text-lg font-semibold text-foreground/90 uppercase">{subcategory}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map(item => (
                <div
                  key={item.id}
                  data-testid={`inventory-item-${item.id}`}
                  className={`bg-card/50 backdrop-blur-sm border rounded-sm p-4 relative overflow-hidden before:absolute before:top-0 before:left-0 before:w-1 before:h-full ${getStatusBadge(item.status)}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-space text-base font-medium text-foreground">{item.name}</h4>
                      <p className="font-manrope text-xs text-muted-foreground mt-1">{item.subcategory}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-sm text-xs font-medium border uppercase tracking-wider ${getStatusBadge(item.status)}`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    {item.subcategory === 'Gas' ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="font-manrope text-sm text-muted-foreground">Available:</span>
                          <span className="font-mono text-lg font-bold text-emerald-400">{item.available}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-manrope text-sm text-muted-foreground">Empty:</span>
                          <span className="font-mono text-lg font-bold text-red-400">{item.empty}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between items-center">
                        <span className="font-manrope text-sm text-muted-foreground">Quantity:</span>
                        <span className="font-mono text-2xl font-bold text-foreground">{item.quantity} {item.unit}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="font-manrope text-sm text-muted-foreground">Min Threshold:</span>
                      <span className="font-mono text-sm text-muted-foreground/70">{item.min_threshold} {item.unit}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      data-testid={`edit-item-${item.id}`}
                      onClick={() => {
                        setSelectedItem(item);
                        setShowModal(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-secondary border border-border rounded-sm font-manrope text-xs text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                      Update
                    </button>
                    {user.role === 'inventory_manager' && (
                      <button
                        data-testid={`delete-item-${item.id}`}
                        onClick={() => handleDelete(item.id)}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-destructive/20 border border-destructive/50 rounded-sm font-manrope text-xs text-destructive-foreground hover:bg-destructive/30 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {filteredInventory.length === 0 && (
        <div className="text-center py-12">
          <Archive className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="font-manrope text-muted-foreground">No items found</p>
        </div>
      )}

      {showModal && (
        <InventoryItemModal
          item={selectedItem}
          category={activeCategory}
          onClose={() => {
            setShowModal(false);
            setSelectedItem(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default ResourcesTab;
