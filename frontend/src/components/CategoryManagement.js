import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Plus, Edit2, Trash2, X, Settings, ChevronUp, ChevronDown, Archive } from 'lucide-react';

const CategoryManagement = ({ onClose, onUpdate }) => {
  const [categories, setCategories] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    icon: 'Package',
    subcategories: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const subcategoriesArray = formData.subcategories
        .split(',')
        .map(s => s.trim())
        .filter(s => s);

      const payload = {
        name: formData.name,
        icon: formData.icon,
        subcategories: subcategoriesArray
      };

      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, payload);
      } else {
        await api.post('/categories', payload);
      }

      setShowAddModal(false);
      setEditingCategory(null);
      setFormData({ name: '', icon: 'Package', subcategories: '' });
      fetchCategories();
      onUpdate();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      icon: category.icon,
      subcategories: category.subcategories.join(', ')
    });
    setShowAddModal(true);
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category? All items in this category must be moved first.')) return;

    try {
      await api.delete(`/categories/${categoryId}`);
      fetchCategories();
      onUpdate();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to delete category');
    }
  };

  const moveCategory = async (categoryId, direction) => {
    const currentIndex = categories.findIndex(c => c.id === categoryId);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 0 || newIndex >= categories.length) return;

    try {
      const category = categories[currentIndex];
      await api.put(`/categories/${categoryId}`, { order: newIndex + 1 });
      
      const otherCategory = categories[newIndex];
      await api.put(`/categories/${otherCategory.id}`, { order: currentIndex + 1 });
      
      fetchCategories();
      onUpdate();
    } catch (error) {
      console.error('Failed to reorder categories:', error);
    }
  };

  const iconOptions = [
    'Package', 'Flame', 'Wrench', 'Archive', 'Box', 'Truck', 
    'Factory', 'Hammer', 'Settings', 'Zap', 'Shield'
  ];

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-sm w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            <h2 className="font-space text-xl font-semibold text-foreground uppercase">
              Manage Categories
            </h2>
          </div>
          <button
            data-testid="close-category-management"
            onClick={onClose}
            className="p-1 hover:bg-secondary rounded-sm transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <Archive className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="font-manrope text-muted-foreground mb-4">No categories yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {categories.map((category, index) => (
                <div
                  key={category.id}
                  data-testid={`category-item-${category.id}`}
                  className="bg-secondary/50 border border-border rounded-sm p-4 flex items-center gap-4"
                >
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => moveCategory(category.id, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:bg-accent rounded-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => moveCategory(category.id, 'down')}
                      disabled={index === categories.length - 1}
                      className="p-1 hover:bg-accent rounded-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>

                  <div className="flex-1">
                    <h3 className="font-space text-base font-medium text-foreground">
                      {category.name}
                    </h3>
                    <p className="font-manrope text-sm text-muted-foreground mt-1">
                      Icon: {category.icon} • Subcategories: {category.subcategories.join(', ')}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      data-testid={`edit-category-${category.id}`}
                      onClick={() => handleEdit(category)}
                      className="p-2 bg-card border border-border rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      data-testid={`delete-category-${category.id}`}
                      onClick={() => handleDelete(category.id)}
                      className="p-2 bg-destructive/20 border border-destructive/50 rounded-sm hover:bg-destructive/30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-destructive-foreground" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border">
          <button
            data-testid="add-category-button"
            onClick={() => {
              setEditingCategory(null);
              setFormData({ name: '', icon: 'Package', subcategories: '' });
              setShowAddModal(true);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-sm font-space text-sm uppercase shadow-[0_0_15px_rgba(70,130,180,0.3)] hover:bg-primary/90 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add New Category
          </button>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-card border border-border rounded-sm w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-space text-xl font-semibold text-foreground uppercase">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingCategory(null);
                  setError('');
                }}
                className="p-1 hover:bg-secondary rounded-sm transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-destructive/20 border border-destructive/50 rounded-sm text-sm text-destructive-foreground">
                  {error}
                </div>
              )}

              <div>
                <label className="block font-manrope text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Category Name
                </label>
                <input
                  data-testid="category-name-input"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-background/50 border border-border rounded-sm font-manrope text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block font-manrope text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Icon
                </label>
                <select
                  data-testid="category-icon-select"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-4 py-2 bg-background/50 border border-border rounded-sm font-manrope text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
                >
                  {iconOptions.map(icon => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-manrope text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Subcategories (comma-separated)
                </label>
                <input
                  data-testid="category-subcategories-input"
                  type="text"
                  value={formData.subcategories}
                  onChange={(e) => setFormData({ ...formData, subcategories: e.target.value })}
                  placeholder="e.g. Type A, Type B, Type C"
                  className="w-full px-4 py-2 bg-background/50 border border-border rounded-sm font-manrope text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
                  required
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Enter subcategories separated by commas
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingCategory(null);
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 bg-secondary border border-border rounded-sm font-space text-sm uppercase text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  data-testid="save-category-button"
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
      )}
    </div>
  );
};

export default CategoryManagement;
