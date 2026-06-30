/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Eye, 
  ShieldCheck, 
  ClipboardList, 
  Search, 
  UserCheck, 
  Trash2, 
  Edit, 
  UserPlus, 
  X, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { AuditTrail, User } from '../types.ts';

interface UserManagementTabProps {
  auditTrails: AuditTrail[];
  currentUser: User;
}

export default function UserManagementTab({ auditTrails, currentUser }: UserManagementTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [usersList, setUsersList] = useState<any[]>([]);
  const [isFetchLoading, setIsFetchLoading] = useState(false);

  // Form states for Add User
  const [showAddForm, setShowAddForm] = useState(false);
  const [addUsername, setAddUsername] = useState('');
  const [addDisplayName, setAddDisplayName] = useState('');
  const [addRole, setAddRole] = useState<'admin' | 'viewer'>('viewer');
  const [addPassword, setAddPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);

  // Form states for Edit User
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'viewer'>('viewer');

  const fetchUsers = () => {
    setIsFetchLoading(true);
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.users) {
          setUsersList(data.users);
        }
      })
      .catch(err => console.warn('[UserManagement] Failed to fetch users:', err))
      .finally(() => setIsFetchLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    if (!addUsername.trim() || !addDisplayName.trim() || !addPassword.trim()) {
      setFormError('Semua kolom formulir harus diisi!');
      return;
    }

    setIsSubmitLoading(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: addUsername.trim(),
          displayName: addDisplayName.trim(),
          role: addRole,
          password: addPassword,
          adminName: currentUser.displayName
        })
      });

      const data = await response.json();
      if (response.ok && data.status === 'success') {
        setShowAddForm(false);
        setAddUsername('');
        setAddDisplayName('');
        setAddPassword('');
        setAddRole('viewer');
        fetchUsers();
      } else {
        setFormError(data.message || 'Gagal menambahkan operator baru.');
      }
    } catch (err) {
      setFormError('Gagal menghubungi server untuk mendaftarkan operator.');
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleEditSubmit = async (id: string) => {
    if (!editDisplayName.trim()) return;

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: editDisplayName.trim(),
          role: editRole,
          adminName: currentUser.displayName
        })
      });

      const data = await response.json();
      if (response.ok && data.status === 'success') {
        setEditingUserId(null);
        fetchUsers();
      } else {
        alert(data.message || 'Gagal memperbarui profil operator.');
      }
    } catch (err) {
      alert('Gagal menghubungi server sistem.');
    }
  };

  const handleDeleteUser = async (id: string, displayName: string) => {
    if (id === currentUser.id) {
      alert('Anda tidak bisa menghapus akun Anda sendiri yang sedang aktif digunakan.');
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus operator "${displayName}" dari database?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${id}?adminName=${encodeURIComponent(currentUser.displayName)}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (response.ok && data.status === 'success') {
        fetchUsers();
      } else {
        alert(data.message || 'Gagal menghapus operator.');
      }
    } catch (err) {
      alert('Gagal menghapus operator.');
    }
  };

  const startEditing = (user: any) => {
    setEditingUserId(user.id);
    setEditDisplayName(user.displayName);
    setEditRole(user.role === 'admin' ? 'admin' : 'viewer');
  };

  const filteredTrails = auditTrails.filter(trail => {
    return trail.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
           trail.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
           trail.details.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getReadableTime = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('id-ID') + ' ' + d.toLocaleTimeString('id-ID');
    } catch (e) {
      return '';
    }
  };

  const isCurrentUserAdmin = currentUser.role === 'admin';

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header section */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <UserCheck className="text-emerald-500" />
            KEANGGOTAAN OPERATOR &amp; AUDIT TRAIL
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gunakan panel ini untuk mengelola akses operator database dan memantau riwayat audit sistem.
          </p>
        </div>

        {isCurrentUserAdmin && !showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <UserPlus size={16} />
            TAMBAH OPERATOR BARU
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN - ACTIVE ACCOUNTS DRAWER (4 columns) */}
        <div className="lg:col-span-5 bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
          
          {/* Add User Form (Shown dynamically for Admin) */}
          {showAddForm && (
            <div className="border border-slate-200 bg-slate-50 rounded-2xl p-4 space-y-3 relative animate-slide-up text-slate-900 shadow-inner">
              <button 
                onClick={() => { setShowAddForm(false); setFormError(''); }}
                className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
              
              <h4 className="text-xs font-bold text-slate-900 tracking-tight uppercase font-mono flex items-center gap-1">
                <UserPlus className="text-emerald-600" size={14} />
                <span className="text-slate-900">Registrasi Operator Baru</span>
              </h4>

              {formError && (
                <div className="p-2 bg-red-50 border border-red-150 rounded-lg text-[11px] text-red-600 flex items-center gap-1.5 font-mono">
                  <AlertCircle size={12} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleAddSubmit} className="space-y-3 text-xs text-slate-900">
                <div>
                  <label className="block text-[10px] font-mono text-slate-700 uppercase mb-1 font-bold">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso"
                    value={addDisplayName}
                    onChange={(e) => setAddDisplayName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 placeholder-slate-500 font-sans font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-700 uppercase mb-1 font-bold">Username / Email</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: budi atau budi@towerguard.com"
                    value={addUsername}
                    onChange={(e) => setAddUsername(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 placeholder-slate-500 font-sans font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-700 uppercase mb-1 font-bold">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Minimal 6 karakter"
                    value={addPassword}
                    onChange={(e) => setAddPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 placeholder-slate-500 font-sans font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-700 uppercase mb-1 font-bold">Role Akses</label>
                  <select
                    value={addRole}
                    onChange={(e) => setAddRole(e.target.value as 'admin' | 'viewer')}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-sans font-medium"
                  >
                    <option value="viewer" className="text-slate-900">User Regular (Viewer Only)</option>
                    <option value="admin" className="text-slate-900">Administrator (Full Access)</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-1.5">
                  <button
                    type="submit"
                    disabled={isSubmitLoading}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg font-bold text-xs shadow-sm transition"
                  >
                    {isSubmitLoading ? 'Mendaftarkan...' : 'Simpan Operator'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAddForm(false); setFormError(''); }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs transition"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Shield className="text-indigo-500" size={16} />
              <h3 className="text-xs font-bold text-slate-800 tracking-tight uppercase font-mono">Daftar Operator Sistem</h3>
            </div>
            {isFetchLoading && <span className="text-[10px] font-mono text-slate-400 animate-pulse">Menghubungkan...</span>}
          </div>

          <div className="space-y-3">
            {usersList.map(user => {
              const isAdmin = user.role === 'admin';
              const isCurrent = user.id === currentUser.id;
              const isEditing = editingUserId === user.id;

              return (
                <div key={user.id} className={`p-4 rounded-2xl border transition duration-200 ${
                  isCurrent ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-150 bg-slate-50/50 hover:bg-slate-50'
                }`}>
                  {isEditing ? (
                    <div className="space-y-3 text-xs text-slate-900">
                      <div>
                        <label className="block text-[9px] font-mono text-slate-700 uppercase mb-1 font-bold">Nama Lengkap</label>
                        <input
                          type="text"
                          value={editDisplayName}
                          onChange={(e) => setEditDisplayName(e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-sans font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-slate-700 uppercase mb-1 font-bold">Role Akses</label>
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as 'admin' | 'viewer')}
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-sans font-medium"
                        >
                          <option value="viewer" className="text-slate-900 font-sans font-medium">User Regular (Viewer Only)</option>
                          <option value="admin" className="text-slate-900 font-sans font-medium">Administrator (Full Access)</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditSubmit(user.id)}
                          className="flex-1 py-1 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg font-bold text-[10px]"
                        >
                          Simpan
                        </button>
                        <button
                          onClick={() => setEditingUserId(null)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[10px]"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-800 tracking-tight">{user.displayName}</span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[8px] font-bold font-mono">
                              Aktif
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                            isAdmin ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {user.role === 'admin' ? 'admin' : 'viewer'}
                          </span>
                          
                          {/* Admin management buttons */}
                          {isCurrentUserAdmin && (
                            <div className="flex items-center gap-1 ml-1">
                              <button
                                onClick={() => startEditing(user)}
                                title="Edit operator"
                                className="p-1 hover:bg-slate-200 text-slate-500 hover:text-indigo-700 rounded transition"
                              >
                                <Edit size={12} />
                              </button>
                              {!isCurrent && (
                                <button
                                  onClick={() => handleDeleteUser(user.id, user.displayName)}
                                  title="Hapus operator"
                                  className="p-1 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded transition"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                        <span>ID / Username: {user.username}</span>
                        <span>
                          {user.lastActive}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN - AUDIT TRAILS MASTER (8 columns) */}
        <div className="lg:col-span-7 bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <ClipboardList className="text-indigo-500" size={18} />
              <h3 className="text-xs font-bold text-slate-800 tracking-tight uppercase font-mono">AUDIT TRAIL LOG RECORD</h3>
            </div>

            {/* Search audit log */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Cari aktivitas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-44 font-medium"
              />
            </div>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono uppercase font-bold text-slate-500">
                    <th className="py-2.5 px-3">Waktu Operator</th>
                    <th className="py-2.5 px-3">Pengguna</th>
                    <th className="py-2.5 px-3">Aksi</th>
                    <th className="py-2.5 px-3">Deskripsi Kejadian</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-xs select-none">
                  {filteredTrails.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 font-mono">
                        Belum ada rekaman audit trail.
                      </td>
                    </tr>
                  ) : (
                    filteredTrails.map((trail) => {
                      const isSystem = trail.user === 'SYSTEM';
                      const isESP = trail.user === 'ESP32';
                      return (
                        <tr key={trail.id} className="hover:bg-slate-50 font-mono text-[11px]">
                          <td className="py-2 px-3 text-slate-500 shrink-0">
                            {getReadableTime(trail.timestamp)}
                          </td>
                          <td className="py-2 px-3">
                            <span className={`px-1.5 py-0.5 rounded font-bold ${
                              isSystem 
                                ? 'bg-slate-100 text-slate-600' 
                                : isESP 
                                ? 'bg-blue-50 text-blue-600' 
                                : 'bg-indigo-50 text-indigo-700'
                            }`}>
                              {trail.user}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-800">
                            {trail.action}
                          </td>
                          <td className="py-2 px-3 text-slate-600 leading-normal max-w-sm">
                            {trail.details}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
