import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Plus, Edit2, Trash2, Building2, Mail, Phone, User, CheckCircle, XCircle } from 'lucide-react';

const VendorsTab = ({ user }) => {
  const [vendors, setVendors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    materials_supplied: '',
    status: 'active'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await api.get('/vendors');
      setVendors(response.data);
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const materials = formData.materials_supplied.split(',').map(m => m.trim()).filter(m => m);
      const payload = { ...formData, materials_supplied: materials };

      if (selectedVendor) {
        await api.put(`/vendors/${selectedVendor.id}`, payload);
      } else {
        await api.post('/vendors', payload);
      }

      setShowModal(false);
      setSelectedVendor(null);
      setFormData({
        name: '',
        contact_person: '',
        phone: '',
        email: '',
        materials_supplied: '',
        status: 'active'
      });
      fetchVendors();
    } catch (error) {
      alert('Failed to save vendor');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (vendor) => {
    setSelectedVendor(vendor);
    setFormData({
      name: vendor.name,
      contact_person: vendor.contact_person,
      phone: vendor.phone,
      email: vendor.email,
      materials_supplied: vendor.materials_supplied.join(', '),
      status: vendor.status
    });
    setShowModal(true);
  };

  const handleDelete = async (vendorId) => {
    if (!window.confirm('Are you sure you want to delete this vendor?')) return;

    try {
      await api.delete(`/vendors/${vendorId}`);
      fetchVendors();
    } catch (error) {
      alert('Failed to delete vendor');
    }
  };

  const canEdit = user.role === 'inventory_manager';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-space text-xl font-semibold text-foreground uppercase">Vendor Management</h2>
        {canEdit && (
          <button
            data-testid="add-vendor-button"
            onClick={() => {
              setSelectedVendor(null);
              setFormData({
                name: '',
                contact_person: '',
                phone: '',
                email: '',
                materials_supplied: '',
                status: 'active'
              });
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-sm font-space text-sm uppercase shadow-[0_0_15px_rgba(70,130,180,0.3)] hover:bg-primary/90 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Vendor
          </button>
        )}
      </div>

      {vendors.length === 0 ? (
        <div className="text-center py-12 bg-card/50 backdrop-blur-sm border border-border rounded-sm">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="font-manrope text-muted-foreground">No vendors added yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.map(vendor => (
            <div
              key={vendor.id}
              data-testid={`vendor-card-${vendor.id}`}
              className="bg-card/50 backdrop-blur-sm border border-border rounded-sm p-6 relative overflow-hidden before:absolute before:top-0 before:left-0 before:w-1 before:h-full before:bg-primary/50"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-space text-lg font-semibold text-foreground">{vendor.name}</h3>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-sm text-xs font-medium border uppercase tracking-wider mt-2 ${
                    vendor.status === 'active'
                      ? 'bg-emerald-950/30 text-emerald-400 border-emerald-800/50'
                      : 'bg-red-950/30 text-red-400 border-red-800/50'
                  }`}>
                    {vendor.status === 'active' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {vendor.status}
                  </span>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-manrope text-sm text-foreground">{vendor.contact_person}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="font-manrope text-sm text-foreground">{vendor.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="font-manrope text-sm text-foreground break-all">{vendor.email}</span>
                </div>
              </div>

              <div className="mb-4">
                <p className="font-manrope text-xs uppercase tracking-wider text-muted-foreground mb-2">Materials Supplied</p>
                <div className="flex flex-wrap gap-2">
                  {vendor.materials_supplied.map((material, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-secondary border border-border rounded-sm text-xs font-manrope text-foreground"
                    >
                      {material}
                    </span>
                  ))}
                </div>
              </div>

              {canEdit && (
                <div className="flex gap-2">
                  <button
                    data-testid={`edit-vendor-${vendor.id}`}
                    onClick={() => handleEdit(vendor)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-secondary border border-border rounded-sm font-manrope text-xs text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    data-testid={`delete-vendor-${vendor.id}`}
                    onClick={() => handleDelete(vendor.id)}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-destructive/20 border border-destructive/50 rounded-sm font-manrope text-xs text-destructive-foreground hover:bg-destructive/30 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-sm w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-space text-xl font-semibold text-foreground uppercase">
                {selectedVendor ? 'Edit Vendor' : 'Add New Vendor'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-secondary rounded-sm transition-colors"
              >
                <XCircle className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block font-manrope text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Vendor Name
                </label>
                <input
                  data-testid="vendor-name-input"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-background/50 border border-border rounded-sm font-manrope text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block font-manrope text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Contact Person
                </label>
                <input
                  data-testid="vendor-contact-input"
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  className="w-full px-4 py-2 bg-background/50 border border-border rounded-sm font-manrope text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block font-manrope text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Phone
                </label>
                <input
                  data-testid="vendor-phone-input"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 bg-background/50 border border-border rounded-sm font-manrope text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block font-manrope text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Email
                </label>
                <input
                  data-testid="vendor-email-input"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-background/50 border border-border rounded-sm font-manrope text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block font-manrope text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Materials Supplied (comma-separated)
                </label>
                <input
                  data-testid="vendor-materials-input"
                  type="text"
                  value={formData.materials_supplied}
                  onChange={(e) => setFormData({ ...formData, materials_supplied: e.target.value })}
                  placeholder="e.g. Welding Rods, Gas Cylinders, Steel"
                  className="w-full px-4 py-2 bg-background/50 border border-border rounded-sm font-manrope text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
                  required
                />
              </div>

              {selectedVendor && (
                <div>
                  <label className="block font-manrope text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Status
                  </label>
                  <select
                    data-testid="vendor-status-select"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 bg-background/50 border border-border rounded-sm font-manrope text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-secondary border border-border rounded-sm font-space text-sm uppercase text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  data-testid="save-vendor-button"
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

export default VendorsTab;
