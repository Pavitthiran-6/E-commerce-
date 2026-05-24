import React, { useState, useEffect } from 'react';

interface ProfileDetailsProps {
  email: string;
}

export default function ProfileDetails({ email }: ProfileDetailsProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');

  // Extract clean name from email
  useEffect(() => {
    const rawName = email.split('@')[0];
    const cleanName = rawName.replace(/[^a-zA-Z]/g, '');
    const capitalizedName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase();
    
    setFullName(capitalizedName);
  }, [email]);

  const avatarLetter = fullName ? fullName.charAt(0).toUpperCase() : email.charAt(0).toUpperCase();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate save
    alert('Profile details saved successfully!');
  };

  return (
    <div className="bg-white p-6 md:p-8 border border-outline-variant/30 rounded-xl">
      <h2 className="font-headline-md text-2xl mb-8">Personal Details</h2>

      <div className="flex flex-col md:flex-row gap-10">
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white font-headline-md text-4xl font-bold">
            {avatarLetter}
          </div>
          <span className="text-sm font-label-caps tracking-widest text-gray-500 uppercase">Your Avatar</span>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSave} className="flex-1 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Full Name</label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors bg-white"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Email Address</label>
              <input 
                type="email" 
                value={email}
                className="border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 text-gray-500 cursor-not-allowed"
                readOnly
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Phone Number</label>
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
                className="border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors bg-white"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Date of Birth</label>
              <input 
                type="date" 
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors bg-white"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-2">
            <label className="text-sm font-medium text-gray-700">Gender</label>
            <div className="flex flex-wrap gap-6">
              {['Male', 'Female', 'Prefer not to say'].map((option) => (
                <label key={option} className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${gender === option ? 'border-primary' : 'border-gray-300 group-hover:border-primary'}`}>
                    {gender === option && <div className="w-2 h-2 rounded-full bg-primary"></div>}
                  </div>
                  <input 
                    type="radio" 
                    name="gender" 
                    value={option} 
                    checked={gender === option}
                    onChange={(e) => setGender(e.target.value)}
                    className="hidden"
                  />
                  <span className={`text-sm ${gender === option ? 'text-primary font-medium' : 'text-gray-600'}`}>
                    {option}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <button 
              type="submit"
              className="bg-primary text-white px-8 py-3 rounded-lg font-medium hover:bg-charcoal-stone transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
