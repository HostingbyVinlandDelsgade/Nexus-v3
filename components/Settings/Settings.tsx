import React, { useState, useRef, useEffect } from 'react';
import { useInventory } from '../../contexts/InventoryContext';
import { User, UserRole } from '../../types';
import { Shield, Lock, Download, Upload, Trash2, AlertTriangle, Check, RefreshCw, Eye, EyeOff, UserCircle, Building2, Plus, Edit2, Users, Database, Link as LinkIcon, ExternalLink } from 'lucide-react';
import Modal from '../ui/Modal';
import googleSheetsService from '../../services/googleSheetsService';

const Settings: React.FC = () => {
  const { 
    updatePasscode, verifyPasscode,
    exportData, importData, resetSystemData, factoryReset,
    companyInfo, updateCompanyInfo,
    users, addUser, updateUser, deleteUser
  } = useInventory();

  // Settings Lock State
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [lockPasscode, setLockPasscode] = useState('');
  const [lockError, setLockError] = useState('');
  
  // Passcode Update State
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [passcodeMessage, setPasscodeMessage] = useState({ type: '', text: '' });

  // Company Info State
  const [companyForm, setCompanyForm] = useState(companyInfo);
  const [companyMessage, setCompanyMessage] = useState({ type: '', text: '' });

  // User Management State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({ name: '', username: '', password: '', role: 'cashier' as UserRole });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // API Key State
  const [apiKey, setApiKey] = useState('');
  const [apiMessage, setApiMessage] = useState({ type: '', text: '' });

  // Google Sheets State
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
      setCompanyForm(companyInfo);
      // Load API Key from localStorage if available
      const savedKey = localStorage.getItem('nexus_gemini_api_key');
      if (savedKey) setApiKey(savedKey);

      // Check Google Auth Status
      googleSheetsService.loadTokens();
      googleSheetsService.loadSpreadsheetId();
      setIsGoogleConnected(googleSheetsService.isAuthenticated());
  }, [companyInfo]);

  const handleConnectGoogle = async () => {
      try {
          const response = await fetch('/api/auth/url');
          const { url } = await response.json();
          window.location.href = url;
      } catch (error) {
          console.error('Failed to get auth URL:', error);
          alert('Failed to initiate Google connection.');
      }
  };

  const handleSyncNow = async () => {
      if (!isGoogleConnected) return;
      setIsSyncing(true);
      try {
          // TODO: Implement full sync logic (read/write)
          // For now, just create spreadsheet if missing
          if (!googleSheetsService.hasSpreadsheet()) {
              await googleSheetsService.createSpreadsheet();
          }
          alert('Sync completed successfully!');
      } catch (error: any) {
          console.error('Sync failed:', error);
          alert(`Sync failed: ${error.message}`);
      } finally {
          setIsSyncing(false);
      }
  };

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

  const handleUpdateCompanyInfo = (e: React.FormEvent) => {
      e.preventDefault();
      updateCompanyInfo(companyForm);
      setCompanyMessage({ type: 'success', text: 'Company details updated!' });
      setTimeout(() => setCompanyMessage({ type: '', text: '' }), 3000);
  };

  const handleUpdateApiKey = (e: React.FormEvent) => {
      e.preventDefault();
      if (apiKey.trim()) {
          localStorage.setItem('nexus_gemini_api_key', apiKey.trim());
          setApiMessage({ type: 'success', text: 'API Key saved successfully!' });
      } else {
          localStorage.removeItem('nexus_gemini_api_key');
          setApiMessage({ type: 'info', text: 'API Key removed.' });
      }
      setTimeout(() => setApiMessage({ type: '', text: '' }), 3000);
  };

  // --- User Management Handlers ---
  const handleOpenUserModal = (user?: User) => {
      if (user) {
          setEditingUser(user);
          setUserForm({ name: user.name, username: user.username, password: user.password, role: user.role });
      } else {
          setEditingUser(null);
          setUserForm({ name: '', username: '', password: '', role: 'cashier' });
      }
      setIsUserModalOpen(true);
  };

  const handleUserSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!userForm.name || !userForm.username || !userForm.password) return;

      if (editingUser) {
          updateUser(editingUser.id, userForm);
      } else {
          addUser(userForm);
      }
      setIsUserModalOpen(false);
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
    if (window.confirm('DANGER: Factory Reset will wipe EVERYTHING including all Users, Login, Passcode and Settings.\n\nThe app will revert to its initial "fresh install" state.\n\nAre you absolutely sure?')) {
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
            <p className="text-gray-500 text-sm">Manage users, security, and company details</p>
        </div>
      </div>

      {/* User Management */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <Users size={20} className="text-indigo-600"/>
                      User Management
                  </h3>
                  <p className="text-sm text-gray-500">Manage Admins and Cashiers</p>
              </div>
              <button 
                  onClick={() => handleOpenUserModal()}
                  className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
              >
                  <Plus size={16} /> Add User
              </button>
          </div>
          <div className="p-0">
              <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500">
                      <tr>
                          <th className="px-6 py-3">Name</th>
                          <th className="px-6 py-3">Username</th>
                          <th className="px-6 py-3">Role</th>
                          <th className="px-6 py-3">Last Login</th>
                          <th className="px-6 py-3 text-center">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                      {users.map(user => (
                          <tr key={user.id}>
                              <td className="px-6 py-3 font-medium text-gray-900">{user.name}</td>
                              <td className="px-6 py-3 text-gray-600">{user.username}</td>
                              <td className="px-6 py-3">
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                      {user.role}
                                  </span>
                              </td>
                              <td className="px-6 py-3 text-gray-500">
                                  {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                              </td>
                              <td className="px-6 py-3 text-center">
                                  <button onClick={() => handleOpenUserModal(user)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded mr-1"><Edit2 size={16}/></button>
                                  <button onClick={() => { if(confirm(`Delete user ${user.name}?`)) deleteUser(user.id) }} className="text-red-600 hover:bg-red-50 p-1.5 rounded"><Trash2 size={16}/></button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
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

      {/* Database Integration (Google Sheets) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Database size={20} className="text-green-600"/>
                  Database Integration
              </h3>
              <p className="text-sm text-gray-500">Connect to Google Sheets for real-time data sync</p>
          </div>
          <div className="p-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 mb-4">
                  <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isGoogleConnected ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                          <LinkIcon size={20} />
                      </div>
                      <div>
                          <h4 className="font-semibold text-gray-900">Google Sheets</h4>
                          <p className="text-xs text-gray-500">
                              {isGoogleConnected ? 'Connected to Google Drive' : 'Not connected'}
                          </p>
                      </div>
                  </div>
                  <div>
                      {isGoogleConnected ? (
                          <div className="flex items-center gap-2">
                              <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                                  <Check size={12} /> Active
                              </span>
                              <button 
                                  onClick={handleSyncNow}
                                  disabled={isSyncing}
                                  className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors disabled:opacity-50"
                              >
                                  <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} /> 
                                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                              </button>
                          </div>
                      ) : (
                          <button 
                              onClick={handleConnectGoogle}
                              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
                          >
                              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4" />
                              Connect Drive
                          </button>
                      )}
                  </div>
              </div>
              
              {isGoogleConnected && (
                  <div className="text-xs text-gray-500 flex items-center gap-1 ml-1">
                      <ExternalLink size={12} />
                      <span>Data is automatically synced to "Nexus Inventory Data" in your Google Drive.</span>
                  </div>
              )}
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Security (Passcode) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Lock size={20} className="text-indigo-600"/>
                    Settings Security
                </h3>
                <p className="text-sm text-gray-500">Passcode for accessing this page</p>
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

        {/* Data Management Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <RefreshCw size={20} className="text-indigo-600"/>
                    Data Backup
                </h3>
                <p className="text-sm text-gray-500">Backup and restore system data</p>
            </div>
            <div className="p-6 space-y-4">
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                    <h4 className="font-semibold text-blue-900 mb-2">Export Data</h4>
                    <button 
                        type="button"
                        onClick={exportData}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm w-full justify-center"
                    >
                        <Download size={16} /> Download JSON
                    </button>
                </div>
                <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
                    <h4 className="font-semibold text-purple-900 mb-2">Import Data</h4>
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
                            className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm text-sm w-full justify-center"
                        >
                            <Upload size={16} /> Select File
                        </label>
                    </div>
                </div>
            </div>
        </div>
        
        {/* AI Configuration */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Shield size={20} className="text-indigo-600"/>
                    AI Configuration
                </h3>
                <p className="text-sm text-gray-500">Configure Gemini API for Insights</p>
            </div>
            <div className="p-6">
                <form onSubmit={handleUpdateApiKey} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gemini API Key</label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Enter your Gemini API Key"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Leave empty to use system default (if configured). 
                            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline ml-1">Get a key here</a>.
                        </p>
                    </div>
                    {apiMessage.text && (
                        <div className={`text-sm flex items-center gap-2 ${apiMessage.type === 'success' ? 'text-green-600' : 'text-blue-600'}`}>
                            <Check size={16}/>
                            {apiMessage.text}
                        </div>
                    )}
                    <button type="submit" className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors text-sm font-medium">
                        Save API Key
                    </button>
                </form>
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
                    <h4 className="font-semibold text-gray-800">Clear Inventory Data</h4>
                    <p className="text-sm text-gray-500">Removes inventory, suppliers, movements. Keeps settings & users.</p>
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
                    <p className="text-sm text-gray-500">Wipes ALL data including Users and resets to fresh install.</p>
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

      {/* User Modal */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title={editingUser ? "Edit User" : "Add New User"}
      >
          <form onSubmit={handleUserSubmit} className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={userForm.name}
                      onChange={e => setUserForm({...userForm, name: e.target.value})}
                      required
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={userForm.username}
                      onChange={e => setUserForm({...userForm, username: e.target.value})}
                      required
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                      type="text" // Visible for admin convenience in this demo
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={userForm.password}
                      onChange={e => setUserForm({...userForm, password: e.target.value})}
                      required
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                      value={userForm.role}
                      onChange={e => setUserForm({...userForm, role: e.target.value as UserRole})}
                  >
                      <option value="cashier">Cashier (Restricted)</option>
                      <option value="admin">Administrator (Full Access)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                      {userForm.role === 'cashier' ? 'Cashiers can only access POS and Inventory (Read-only).' : 'Admins have full access to Reports, Settings, and Suppliers.'}
                  </p>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save User</button>
              </div>
          </form>
      </Modal>
    </div>
  );
};

export default Settings;