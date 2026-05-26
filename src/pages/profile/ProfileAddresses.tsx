import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, Edit2 } from 'lucide-react';
import { getAddresses, addAddress, deleteAddress, setDefaultAddress, Address } from '../../services/userService';
import SkeletonLoader from '../../components/common/SkeletonLoader';

export default function ProfileAddresses() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [form, setForm] = useState({ fullName: '', phone: '', pincode: '', addressLine1: '', addressLine2: '', city: '', state: '', isDefault: false });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setIsLoading(true);
      const data = await getAddresses();
      setAddresses(data);
    } catch (error) {
      console.error("Failed to fetch addresses", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this address?")) return;
    try {
      await deleteAddress(id);
      setAddresses(addresses.filter(a => a.id !== id));
    } catch (error) {
      console.error("Failed to delete address", error);
      alert("Failed to delete address");
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await setDefaultAddress(id);
      fetchAddresses();
    } catch (error) {
      console.error("Failed to set default address", error);
      alert("Failed to set default address");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await addAddress(form);
      await fetchAddresses();
      setShowAddForm(false);
      setForm({ fullName: '', phone: '', pincode: '', addressLine1: '', addressLine2: '', city: '', state: '', isDefault: false });
    } catch (error) {
      console.error("Failed to save address", error);
      alert("Failed to save address");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <h2 className="font-headline-md text-2xl mb-2">Saved Addresses</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonLoader className="h-48 rounded-xl" />
          <SkeletonLoader className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  if (showAddForm) {
    return (
      <div className="bg-white p-6 md:p-8 border border-outline-variant/30 rounded-xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-headline-md text-2xl">Add New Address</h2>
          <button 
            onClick={() => setShowAddForm(false)}
            className="text-sm text-gray-500 hover:text-black underline underline-offset-4"
          >
            Cancel
          </button>
        </div>

        <form className="flex flex-col gap-6" onSubmit={handleSave}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Full Name</label>
              <input 
                type="text" 
                value={form.fullName}
                onChange={e => setForm({...form, fullName: e.target.value})}
                className="border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
                required 
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Phone Number</label>
              <input 
                type="tel" 
                value={form.phone}
                onChange={e => setForm({...form, phone: e.target.value})}
                className="border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
                required 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Pincode</label>
              <input 
                type="text" 
                value={form.pincode}
                onChange={e => setForm({...form, pincode: e.target.value})}
                className="border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
                required 
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">City</label>
              <input 
                type="text" 
                value={form.city}
                onChange={e => setForm({...form, city: e.target.value})}
                className="border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
                required 
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">State</label>
            <input 
              type="text" 
              value={form.state}
              onChange={e => setForm({...form, state: e.target.value})}
              className="border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
              required 
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">House/Flat Number</label>
            <input 
              type="text" 
              value={form.addressLine1}
              onChange={e => setForm({...form, addressLine1: e.target.value})}
              className="border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
              required 
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Street/Area</label>
            <input 
              type="text" 
              value={form.addressLine2}
              onChange={e => setForm({...form, addressLine2: e.target.value})}
              className="border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
            />
          </div>

          <div className="mt-4">
            <button 
              type="submit" 
              disabled={isSaving}
              className="bg-primary text-white px-8 py-3 rounded-lg font-medium hover:bg-charcoal-stone transition-colors disabled:opacity-70"
            >
              {isSaving ? 'Saving...' : 'Save Address'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-headline-md text-2xl">Saved Addresses</h2>
        <button 
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-black transition-colors"
        >
          <Plus className="w-4 h-4" /> Add New
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="bg-white border border-outline-variant/30 rounded-xl p-8 text-center text-gray-500">
          No addresses saved yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((address) => (
            <div key={address.id} className="bg-white border border-outline-variant/30 rounded-xl p-5 md:p-6 relative hover:shadow-sm transition-shadow flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-500">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium">{address.fullName}</h4>
                    <p className="text-sm text-gray-500">{address.phone}</p>
                  </div>
                </div>
                {address.isDefault && (
                  <span className="bg-green-50 text-green-700 text-xs font-medium px-2 py-1 rounded">Default</span>
                )}
              </div>

              <div className="text-sm text-gray-600 leading-relaxed mb-6 flex-grow">
                {address.addressLine1},<br />
                {address.addressLine2 && <>{address.addressLine2},<br /></>}
                {address.city}, {address.state} - {address.pincode}
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-100 mt-auto items-center">
                {!address.isDefault && (
                  <button 
                    onClick={() => handleSetDefault(address.id)}
                    className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-charcoal-stone transition-colors"
                  >
                    Set as Default
                  </button>
                )}
                <button 
                  onClick={() => handleDelete(address.id)}
                  className="flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-600 transition-colors ml-auto"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
