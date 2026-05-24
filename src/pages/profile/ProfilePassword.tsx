import React, { useState, useEffect } from 'react';

export default function ProfilePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [strength, setStrength] = useState<'Weak' | 'Medium' | 'Strong' | ''>('');

  useEffect(() => {
    if (!newPassword) {
      setStrength('');
      return;
    }
    
    let score = 0;
    if (newPassword.length > 7) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;

    if (score < 2) setStrength('Weak');
    else if (score < 4) setStrength('Medium');
    else setStrength('Strong');
  }, [newPassword]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("New passwords don't match!");
      return;
    }
    alert("Password updated successfully!");
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const getStrengthColor = () => {
    switch (strength) {
      case 'Weak': return 'bg-red-500 w-1/3';
      case 'Medium': return 'bg-yellow-500 w-2/3';
      case 'Strong': return 'bg-green-500 w-full';
      default: return 'bg-gray-200 w-0';
    }
  };

  return (
    <div className="bg-white p-6 md:p-8 border border-outline-variant/30 rounded-xl max-w-2xl">
      <h2 className="font-headline-md text-2xl mb-8">Change Password</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">Current Password</label>
          <input 
            type="password" 
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors bg-white"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">New Password</label>
          <input 
            type="password" 
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors bg-white"
            required
          />
          {newPassword && (
            <div className="mt-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-500 font-medium">Password Strength:</span>
                <span className={`text-xs font-bold ${
                  strength === 'Weak' ? 'text-red-500' : 
                  strength === 'Medium' ? 'text-yellow-600' : 
                  'text-green-600'
                }`}>{strength}</span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-300 ${getStrengthColor()}`}></div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
          <input 
            type="password" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors bg-white"
            required
          />
          {confirmPassword && newPassword !== confirmPassword && (
            <p className="text-xs text-red-500 mt-1">Passwords do not match.</p>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <button 
            type="submit"
            className="bg-primary text-white px-8 py-3 rounded-lg font-medium hover:bg-charcoal-stone transition-colors"
          >
            Update Password
          </button>
        </div>
      </form>
    </div>
  );
}
