import React, { useState } from 'react';
import { User } from '../types';
import { Shield, UserPlus, Trash2, Edit2, CheckCircle2, X, Eye, EyeOff, Key } from 'lucide-react';

interface UserManagementProps {
  users: User[];
  onAddUser: (user: Omit<User, 'id'>) => void;
  onEditUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
  currentUser: User;
}

export default function UserManagement({
  users,
  onAddUser,
  onEditUser,
  onDeleteUser,
  currentUser
}: UserManagementProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form states
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Master' | 'Bendahara' | 'Admin'>('Admin');
  const [isActive, setIsActive] = useState<boolean>(true);

  const [saveSuccess, setSaveSuccess] = useState('');
  const [deleteUserConfirm, setDeleteUserConfirm] = useState<string | null>(null);
  const [showPasswordIds, setShowPasswordIds] = useState<string[]>([]);

  const triggerSuccess = (msg: string) => {
    setSaveSuccess(msg);
    setTimeout(() => {
      setSaveSuccess('');
    }, 3000);
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditingUserId(null);
    setUsername('');
    setName('');
    setPassword('123'); // Default password
    setRole('Admin');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setIsEditing(true);
    setEditingUserId(user.id);
    setUsername(user.username);
    setName(user.name);
    setPassword(user.password || user.username);
    setRole(user.role);
    setIsActive(user.isActive ?? true);
    setIsModalOpen(true);
  };

  const handleToggleActive = (user: User) => {
    onEditUser({
      ...user,
      isActive: !(user.isActive ?? true)
    });
    triggerSuccess(`Status pengguna berhasil ${!(user.isActive ?? true) ? 'diaktifkan' : 'dinonaktifkan'}!`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !name.trim()) {
      alert('Mohon lengkapi seluruh field wajib!');
      return;
    }

    const cleanUsername = username.trim().toLowerCase();

    if (isEditing && editingUserId) {
      if (users.some(u => u.username === cleanUsername && u.id !== editingUserId)) {
        alert(`Username "${cleanUsername}" sudah digunakan oleh staf lain!`);
        return;
      }
      onEditUser({
        id: editingUserId,
        username: cleanUsername,
        name: name.trim(),
        role,
        password: password.trim(),
        isActive
      });
      triggerSuccess('Data pengguna berhasil diperbarui!');
    } else {
      // Check for duplicate username
      if (users.some(u => u.username === cleanUsername)) {
        alert(`Username "${cleanUsername}" sudah digunakan oleh staf lain!`);
        return;
      }
      onAddUser({
        username: cleanUsername,
        name: name.trim(),
        role,
        password: password.trim(),
        isActive
      });
      triggerSuccess('Akses pengguna baru berhasil ditambahkan!');
    }
    setIsModalOpen(false);
  };

  const togglePasswordVisibility = (userId: string) => {
    if (showPasswordIds.includes(userId)) {
      setShowPasswordIds(showPasswordIds.filter(id => id !== userId));
    } else {
      setShowPasswordIds([...showPasswordIds, userId]);
    }
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Title & Add Button Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-black text-emerald-950 tracking-tight uppercase flex items-center gap-2" id="user-management-title">
            <Shield className="w-6 h-6 text-emerald-600" />
            MANAJEMEN AKUN PENGGUNA
          </h2>
          <p className="text-xs text-gray-500 mt-1">Mengatur hak akses staf, bendahara, dan pimpinan lembaga (RBAC).</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-emerald-800 text-white font-extrabold rounded-xl flex items-center justify-center gap-2 transition hover:bg-emerald-900 shadow-md border-none cursor-pointer text-[11px] uppercase tracking-wider"
          id="btn-add-user-trigger"
        >
          <UserPlus className="w-4 h-4 text-emerald-200" />
          Tambah Pengguna
        </button>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 p-3.5 rounded-xl flex items-center gap-2 text-xs font-semibold shadow-sm" id="user-mgmt-success-alert">
          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
          {saveSuccess}
        </div>
      )}

      {/* Full-width Users Table Card */}
      <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm space-y-4" id="users-list-card">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <Shield className="w-4.5 h-4.5 text-emerald-700" />
          <h3 className="font-bold text-gray-800 text-sm">Daftar Hak Akses Akun Pengguna</h3>
        </div>

        <div className="border border-gray-100 rounded-xl overflow-hidden" id="users-table-container">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-700 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3.5">Nama</th>
                <th className="p-3.5">Username</th>
                <th className="p-3.5">Password</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/50">
                  {/* NAMA */}
                  <td className="p-3.5 font-bold text-gray-900">{u.name}</td>
                  
                  {/* USERNAME */}
                  <td className="p-3.5 font-mono text-emerald-800 font-semibold">{u.username}</td>
                  
                  {/* PASSWORD */}
                  <td className="p-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-gray-600">
                        {showPasswordIds.includes(u.id) ? (u.password || u.username) : '••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility(u.id)}
                        className="p-1 text-gray-400 hover:text-emerald-700 rounded transition border-none bg-transparent cursor-pointer"
                        title={showPasswordIds.includes(u.id) ? "Sembunyikan Sandi" : "Tampilkan Sandi"}
                      >
                        {showPasswordIds.includes(u.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                  
                  {/* ROLE */}
                  <td className="p-3.5">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold ${
                      u.role === 'Bendahara' 
                        ? 'bg-blue-100 text-blue-800' 
                        : u.role === 'Master'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-teal-100 text-teal-800'
                    }`}>
                      {u.role === 'Bendahara' && 'Bendahara / Kasir'}
                      {u.role === 'Admin' && 'Admin Sistem'}
                      {u.role === 'Master' && 'Master'}
                    </span>
                  </td>

                  {/* STATUS */}
                  <td className="p-3.5 text-center">
                    <button
                      onClick={() => handleToggleActive(u)}
                      disabled={u.username === currentUser.username}
                      className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition ${
                        u.isActive ?? true 
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200' 
                          : 'bg-red-100 text-red-700 border border-red-200 hover:bg-red-200'
                      } ${u.username === currentUser.username ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {u.isActive ?? true ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </td>
                  
                  {/* AKSI (Hapus, Edit) */}
                  <td className="p-3.5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded transition cursor-pointer border-none bg-transparent"
                        title="Edit Pengguna"
                        id={`btn-edit-user-${u.id}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {u.username === currentUser.username ? (
                        <span className="text-gray-400 font-semibold italic text-[10px] px-2">(Aktif)</span>
                      ) : users.length > 1 ? (
                        <button
                          onClick={() => setDeleteUserConfirm(u.id)}
                          className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition cursor-pointer border-none bg-transparent"
                          title="Hapus Pengguna"
                          id={`btn-delete-user-trigger-${u.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD/EDIT USER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" id="user-form-modal">
          <div className="bg-white rounded-[24px] w-full max-w-md p-6 border border-emerald-100 shadow-2xl space-y-4 transform animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-lg font-black text-emerald-950 uppercase tracking-tight">
                {isEditing ? 'Ubah Pengguna' : 'Tambah Pengguna Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition border-none bg-transparent cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-500 font-black mb-1 uppercase tracking-widest text-[10px]">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ustadz H. Ahmad, S.Pd.I."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  id="form-user-name"
                />
              </div>

              <div>
                <label className="block text-gray-500 font-black mb-1 uppercase tracking-widest text-[10px]">Username Login</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: ahmad_junaedi"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  id="form-user-username"
                />
              </div>

              <div>
                <label className="block text-gray-500 font-black mb-1 uppercase tracking-widest text-[10px]">Password / Kata Sandi</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Masukkan sandi masuk"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-mono"
                    id="form-user-password"
                  />
                  <Key className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-gray-500 font-black mb-1 uppercase tracking-widest text-[10px]">Peran Pengguna (Role)</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full p-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-emerald-600 font-semibold"
                  id="form-user-role"
                >
                  <option value="Master">Master</option>
                  <option value="Admin">Admin Sistem</option>
                  <option value="Bendahara">Bendahara / Kasir</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition cursor-pointer border-none"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition cursor-pointer border-none shadow-md"
                >
                  {isEditing ? 'Simpan Perubahan' : 'Daftarkan Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE USER CONFIRM MODAL */}
      {deleteUserConfirm && (
        <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" id="delete-user-modal">
          <div className="bg-white rounded-[24px] w-full max-w-sm p-6 border border-emerald-100 shadow-2xl space-y-6 text-center transform animate-in zoom-in-95 duration-300">
            <div className="mx-auto w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-emerald-950 uppercase tracking-tight">Hapus Pengguna</h3>
              <p className="text-xs text-gray-500 font-bold">
                Apakah Anda yakin ingin menghapus akses untuk pengguna ini?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteUserConfirm(null)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-black uppercase tracking-widest transition cursor-pointer border-none"
                id="btn-cancel-delete-user"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteUser(deleteUserConfirm);
                  setDeleteUserConfirm(null);
                  triggerSuccess('Akses pengguna berhasil dihapus!');
                }}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition cursor-pointer border-none"
                id="btn-confirm-delete-user"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
