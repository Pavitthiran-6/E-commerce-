import React, { useState } from 'react';
import { MapPin, Plus, MoreVertical, Trash2, Edit2 } from 'lucide-react';

export default function ProfileAddresses() {
  const [showAddForm, setShowAddForm] = useState(false);

  // Dummy addresses
  const [addresses, setAddresses] = useState([
    {
      id: 1,
      name: 'Pavitthiran',
      phone: '+91 9876543210',
      addressLine1: 'Flat 402, Sunshine Apartments',
      addressLine2: 'Koramangala 4th Block',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560034',
      isDefault: true
    },
    {
      id: 2,
      name: 'Office',
      phone: '+91 9876543210',
      addressLine1: 'WeWork Galaxy',
      addressLine2: 'Residency Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560025',
      isDefault: false
    }
  ]);

  const handleDelete = (id: number) => {
    setAddresses(addresses.filter(a => a.id !== id));
  };

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

        <form className="flex flex-col gap-6" onSubmit={(e) => { e.preventDefault(); setShowAddForm(false); }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Full Name</label>
              <input type="text" className="border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" required />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Phone Number</label>
              <input type="tel" className="border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Pincode</label>
              <input type="text" className="border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" required />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">City</label>
              <input type="text" className="border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" required />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">State</label>
            <input type="text" className="border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" required />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">House/Flat Number</label>
            <input type="text" className="border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" required />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Street/Area</label>
            <input type="text" className="border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" required />
          </div>

          <div className="flex items-center gap-3 mt-2">
            <input type="checkbox" id="isDefault" className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary" />
            <label htmlFor="isDefault" className="text-sm text-gray-700">Make this my default address</label>
          </div>

          <div className="mt-4">
            <button type="submit" className="bg-primary text-white px-8 py-3 rounded-lg font-medium hover:bg-charcoal-stone transition-colors">
              Save Address
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {addresses.map((address) => (
          <div key={address.id} className="bg-white border border-outline-variant/30 rounded-xl p-5 md:p-6 relative hover:shadow-sm transition-shadow flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-500">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-medium">{address.name}</h4>
                  <p className="text-sm text-gray-500">{address.phone}</p>
                </div>
              </div>
              {address.isDefault && (
                <span className="bg-green-50 text-green-700 text-xs font-medium px-2 py-1 rounded">Default</span>
              )}
            </div>

            <div className="text-sm text-gray-600 leading-relaxed mb-6 flex-grow">
              {address.addressLine1},<br />
              {address.addressLine2},<br />
              {address.city}, {address.state} - {address.pincode}
            </div>

            <div className="flex gap-4 pt-4 border-t border-gray-100 mt-auto">
              <button className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                <Edit2 className="w-4 h-4" /> Edit
              </button>
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
    </div>
  );
}
