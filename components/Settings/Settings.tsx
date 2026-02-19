import React, { useState, useRef, useEffect } from 'react';
import { useInventory } from '../../contexts/InventoryContext';
import { Shield, Lock, Download, Upload, Trash2, AlertTriangle, Check, RefreshCw, Eye, EyeOff, UserCircle, Building2 } from 'lucide-react';

const Settings: React.FC = () => {
  const { 
    updatePasscode, verifyPasscode, updateCredentials,
    exportData, importData, resetSystemData, factoryReset,
    companyInfo, updateCompanyInfo
  } = useInventory();

  // Settings Lock State
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [lockPasscode, setLockPasscode] = useState('');
  const [lockError, setLockError] = useState('');
  
  // Update Passcode State
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [passcodeMessage, setPasscodeMessage] = useState({ type: '', text: '' });

  // Update Login Credentials State
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [credMessage, setCredMessage] = useState({ type: '', text: '' });

  // Company Info State
  const [companyForm, setCompanyForm] = useState(companyInfo);
  const [companyMessage, setCompanyMessage] = useState({ type: '', text: '' });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      setCompanyForm(companyInfo);
  }, [companyInfo]);

  // --- Lock Screen Handler ---
  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyPasscode(lockPasscode)) {
        setIsUnlocked(true);
        setLockError('');
    } else {
        setLockError('Incorrect passcode.');
        setLockPasscode('');
    }
  };

  // --- Handlers ---
  const handleChangePasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPasscode.length < 4) {
      setPasscodeMessage({ type: 'error', text: 'Passcode must be at least 4 characters.' });
      return;
    }
    if (newPasscode !== confirmPasscode) {
      setPasscodeMessage({ type: 'error', text: 'Passcodes do not match.' });
      return;
    }
    updatePasscode(newPasscode);
    setPasscodeMessage({ type: 'success', text: 'Passcode updated successfully!' });
    setNewPasscode('');
    setConfirmPasscode('');
    setTimeout(() => setPasscodeMessage({ type: '', text: '' }), 3000);
  };

  const handleChangeCredentials = (e: React.FormEvent) => {
      e.preventDefault();
      if (newUsername.length < 3 || newPassword.length < 4) {
          setCredMessage({ type: 'error', text: 'Username (3+) and Password (4+) required.' });
          return;
      }
      updateCredentials(newUsername, newPassword);
      setCredMessage({ type: 'success', text: 'Login credentials updated!' });
      setNewUsername('');
      setNewPassword('');
      setTimeout(() => setCredMessage({ type: '', text: '' }), 3000);
  };

  const handleUpdateCompanyInfo = (e: React.FormEvent) => {
      e.preventDefault();
      updateCompanyInfo(companyForm);
      setCompanyMessage({ type: 'success', text: 'Company details updated!' });
      setTimeout(() => setCompanyMessage({ type: '', text: '' }), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (importData(content)) {
        alert('Data imported successfully!');
      } else {
        alert('Failed to import data. Invalid file format.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetData = () => {
    if (window.confirm('WARNING: This will delete ALL Inventory items, Suppliers, and Movement logs.\n\nSettings and Passcode will be preserved.\n\nThis action cannot be undone. Are you sure?')) {
      resetSystemData();
      alert('System data has been cleared.');
    }
  };

  const handleFactoryReset = () => {
    if (window.confirm('DANGER: Factory Reset will wipe EVERYTHING including your Login, Passcode and Settings.\n\nThe app will revert to its initial "fresh install" state.\n\nAre you absolutely sure?')) {
        factoryReset();
    }
  };

  // --- Render Lock Screen ---
  if (!isUnlocked) {
      return (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-sm w-full text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Lock size={24} className="text-gray-500" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Settings Locked</h2>
                  <p className="text-gray-500 text-sm mb-6">Enter your security passcode to access system settings.</p>
                  
                  <form onSubmit={handleUnlock}>
                      <input
                          type="password"
                          value={lockPasscode}
                          onChange={(e) => setLockPasscode(e.target.value)}
                          placeholder="Passcode"
                          className="w-full text-center text-2xl font-bold tracking-widest py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none mb-4"
                          autoFocus
                          maxLength={6}
                      />
                      {lockError && <p className="text-red-500 text-sm mb-4">{lockError}</p>}
                      <button 
                          type="submit"
                          className="w-full bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                      >
                          Unlock
                      </button>
                  </form>
              </div>
          </div>
      );
  }

  // --- Render Settings Dashboard ---
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10 animate-fadeIn">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-indigo-600 rounded-lg text-white">
            <Shield size={24} />
        </div>
        <div>
            <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
            <p className="text-gray-500 text-sm">Manage security, credentials, and data</p>
        </div>
      </div>

      {/* Company Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
         <div className="p-6 border-b border-gray-100">
             <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                 <Building2 size={20} className="text-indigo-600"/>
                 Company Details
             </h3>
             <p className="text-sm text-gray-500">Details that appear on Receipts and Reports</p>
         </div>
         <div className="p-6">
             <form onSubmit={handleUpdateCompanyInfo} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="md:col-span-2">
                     <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                     <input
                         type="text"
                         value={companyForm.name}
                         onChange={(e) => setCompanyForm({...companyForm, name: e.target.value})}
                         className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                         placeholder="Business Name"
                         required
                     />
                 </div>
                 <div className="md:col-span-2">
                     <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                     <input
                         type="text"
                         value={companyForm.address}
                         onChange={(e) => setCompanyForm({...companyForm, address: e.target.value})}
                         className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                         placeholder="123 Street Name, City"
                         required
                     />
                 </div>
                 <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                     <input
                         type="text"
                         value={companyForm.phone}
                         onChange={(e) => setCompanyForm({...companyForm, phone: e.target.value})}
                         className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                         placeholder="(02) 1234-5678"
                         required
                     />
                 </div>
                 <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Website (Optional)</label>
                     <input
                         type="text"
                         value={companyForm.website || ''}
                         onChange={(e) => setCompanyForm({...companyForm, website: e.target.value})}
                         className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                         placeholder="www.example.com"
                     />
                 </div>
                 
                 <div className="md:col-span-2 flex items-center justify-between mt-2">
                    {companyMessage.text ? (
                         <div className={`text-sm flex items-center gap-2 ${companyMessage.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                             {companyMessage.type === 'success' ? <Check size={16}/> : <AlertTriangle size={16}/>}
                             {companyMessage.text}
                         </div>
                     ) : <span></span>}
                     
                     <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
                         Save Company Info
                     </button>
                 </div>
             </form>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* App Access (Login) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <UserCircle size={20} className="text-indigo-600"/>
                    App Access
                </h3>
                <p className="text-sm text-gray-500">Update main login credentials</p>
            </div>
            <div className="p-6">
                <form onSubmit={handleChangeCredentials} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Username</label>
                        <input
                            type="text"
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="New username"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="New password"
                        />
                    </div>
                    {credMessage.text && (
                        <div className={`text-sm flex items-center gap-2 ${credMessage.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                            {credMessage.type === 'success' ? <Check size={16}/> : <AlertTriangle size={16}/>}
                            {credMessage.text}
                        </div>
                    )}
                    <button type="submit" className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
                        Update Login
                    </button>
                </form>
            </div>
        </div>

        {/* Security (Passcode) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Lock size={20} className="text-indigo-600"/>
                    Security Passcode
                </h3>
                <p className="text-sm text-gray-500">Code for accessing Settings</p>
            </div>
            <div className="p-6">
                <form onSubmit={handleChangePasscode} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Passcode</label>
                        <div className="relative">
                            <input
                                type={showPasscode ? "text" : "password"}
                                value={newPasscode}
                                onChange={(e) => setNewPasscode(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="Enter new code"
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPasscode(!showPasscode)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPasscode ? <EyeOff size={16}/> : <Eye size={16}/>}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Passcode</label>
                        <input
                            type={showPasscode ? "text" : "password"}
                            value={confirmPasscode}
                            onChange={(e) => setConfirmPasscode(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Confirm new code"
                        />
                    </div>
                    {passcodeMessage.text && (
                        <div className={`text-sm flex items-center gap-2 ${passcodeMessage.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                            {passcodeMessage.type === 'success' ? <Check size={16}/> : <AlertTriangle size={16}/>}
                            {passcodeMessage.text}
                        </div>
                    )}
                    <button type="submit" className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors text-sm font-medium">
                        Update Passcode
                    </button>
                </form>
            </div>
        </div>
      </div>

      {/* Data Management Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
           <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <RefreshCw size={20} className="text-indigo-600"/>
              Data Management
           </h3>
           <p className="text-sm text-gray-500">Backup and restore your inventory data</p>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                <h4 className="font-semibold text-blue-900 mb-2">Export Data</h4>
                <p className="text-sm text-blue-700 mb-4">
                    Download a JSON copy of items, history, and wallet data.
                    <br/><span className="font-bold text-blue-800">Note: Login & Passcode are excluded for security.</span>
                </p>
                <button 
                    type="button"
                    onClick={exportData}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm"
                >
                    <Download size={16} /> Download Backup
                </button>
            </div>
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
                <h4 className="font-semibold text-purple-900 mb-2">Import Data</h4>
                <p className="text-sm text-purple-700 mb-4">Restore your system from a backup file (JSON).</p>
                <div className="flex gap-2">
                    <input 
                        type="file" 
                        accept=".json" 
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden" 
                        id="import-file"
                    />
                    <label 
                        htmlFor="import-file"
                        className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm text-sm"
                    >
                        <Upload size={16} /> Select File
                    </label>
                </div>
            </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden">
        <div className="p-6 border-b border-red-50 bg-red-50/30">
           <h3 className="text-lg font-bold text-red-700 flex items-center gap-2">
              <AlertTriangle size={20}/>
              Danger Zone
           </h3>
           <p className="text-sm text-red-500">Irreversible actions</p>
        </div>
        <div className="p-6 space-y-4 divide-y divide-gray-100">
            <div className="flex items-center justify-between pb-4">
                <div>
                    <h4 className="font-semibold text-gray-800">Delete System Data</h4>
                    <p className="text-sm text-gray-500">Removes all inventory, suppliers, and movements. Keeps settings & passcode.</p>
                </div>
                <button 
                    type="button"
                    onClick={handleResetData}
                    className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium whitespace-nowrap"
                >
                    <Trash2 size={16} /> Clear Data
                </button>
            </div>

             <div className="flex items-center justify-between pt-4">
                <div>
                    <h4 className="font-semibold text-gray-800">Factory Reset</h4>
                    <p className="text-sm text-gray-500">Wipes all data and resets settings/passcode to default.</p>
                </div>
                <button 
                    type="button"
                    onClick={handleFactoryReset}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium whitespace-nowrap shadow-sm"
                >
                    <AlertTriangle size={16} /> Factory Reset
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;