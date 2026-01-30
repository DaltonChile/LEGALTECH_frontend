// LEGALTECH_frontend/src/pages/admin/UsersPage.tsx
import React, { useEffect, useState } from 'react';
import { Search, Edit, Eye, EyeOff, UserPlus, X } from 'lucide-react';
import { getAdminUsers, createUser, updateUser, deleteUser, reactivateUser } from '../../services/api';
import { Text } from '../../components/ui/primitives/Text';
import { Box } from '../../components/ui/primitives/Box';
import { Button } from '../../components/ui/primitives/Button';
import { Badge } from '../../components/ui/primitives/Badge';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'notario';
  rut: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

type FilterRole = 'all' | 'admin' | 'notario';
type FilterStatus = 'all' | 'active' | 'inactive';

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<FilterRole>('all');
  const [filterStatus] = useState<FilterStatus>('all');
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await getAdminUsers();
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);



  const handleToggleUserStatus = async (user: User) => {
    const action = user.is_active ? 'desactivar' : 'reactivar';
    if (!confirm(`¿Estás seguro de ${action} a ${user.full_name}?`)) return;

    try {
      if (user.is_active) {
        await deleteUser(user.id);
      } else {
        await reactivateUser(user.id);
      }
      loadUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      alert(`Error al ${action} usuario`);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.rut && user.rut.includes(searchQuery));

    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && user.is_active) ||
      (filterStatus === 'inactive' && !user.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getAvatarColor = (role: string, isActive: boolean) => {
    if (!isActive) return 'bg-slate-200 text-slate-500';
    return role === 'admin'
      ? 'bg-amber-100 text-amber-700'
      : 'bg-navy-100 text-navy-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-900"></div>
      </div>
    );
  }

  return (
    <div className="p-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <Text variant="h2">Usuarios</Text>
          <Text variant="body-sm" color="muted" className="mt-1">Gestiona los administradores y notarios del sistema</Text>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setShowNewUserModal(true)}
          leftIcon={<UserPlus className="w-4 h-4" />}
        >
          Nuevo Usuario
        </Button>
      </div>

      {/* Toolbar: Search & Filter */}
      <Box variant="document" padding="md" className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o RUT..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm font-sans focus:outline-none focus:border-navy-900 focus:ring-2 focus:ring-navy-900 transition-all"
          />
        </div>

        <div className="flex bg-slate-100 p-1 rounded-lg">
          {(['all', 'admin', 'notario'] as const).map((role) => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              className={`px-3 py-1.5 text-xs font-medium font-sans rounded-md transition-all ${filterRole === role
                ? 'bg-white text-navy-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              {role === 'all' && 'Todos'}
              {role === 'admin' && 'Admin'}
              {role === 'notario' && 'Notario'}
            </button>
          ))}
        </div>
      </Box>

      {/* Users Table */}
      <Box variant="document" padding="none" className="overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-16 h-16 bg-slate-50 rounded-lg flex items-center justify-center mx-auto mb-4 border border-slate-200">
              <UserPlus className="w-8 h-8 text-slate-300" />
            </div>
            <Text variant="h4" className="mb-1">No se encontraron usuarios</Text>
            <Text variant="body-sm" color="muted" className="max-w-sm mx-auto mb-6">
              {searchQuery ? 'Intenta ajustar tus filtros o búsqueda' : 'Crea tu primer usuario'}
            </Text>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-4 w-[30%]">
                    <Text variant="caption" color="muted">USUARIO</Text>
                  </th>
                  <th className="text-left px-6 py-4">
                    <Text variant="caption" color="muted">ROL</Text>
                  </th>
                  <th className="text-left px-6 py-4">
                    <Text variant="caption" color="muted">EMAIL</Text>
                  </th>
                  <th className="text-left px-6 py-4">
                    <Text variant="caption" color="muted">DETALLES</Text>
                  </th>
                  <th className="text-right px-6 py-4">
                    <Text variant="caption" color="muted">ACCIONES</Text>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${getAvatarColor(user.role, user.is_active)}`}>
                          {getInitials(user.full_name)}
                        </div>
                        <div>
                          <Text variant="body-sm" weight="bold" color={user.is_active ? 'primary' : 'muted'}>
                            {user.full_name}
                          </Text>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <Badge variant={user.role === 'admin' ? 'warning' : 'info'} size="sm">
                        {user.role === 'admin' ? 'Administrador' : 'Notario'}
                      </Badge>
                    </td>

                    <td className="px-6 py-4">
                      <Text variant="body-sm" color="secondary">{user.email}</Text>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <Text variant="caption" color="muted">RUT</Text>
                        <Text variant="body-sm" weight="medium" className="font-mono">{user.rut || '—'}</Text>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="p-1.5 text-slate-400 hover:text-navy-700 hover:bg-navy-50 rounded-lg transition-colors"
                          title="Editar usuario"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleToggleUserStatus(user)}
                          className={`p-1.5 rounded-lg transition-colors ${user.is_active
                            ? 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                            : 'text-legal-emerald-600 hover:text-legal-emerald-700 hover:bg-legal-emerald-50'
                            }`}
                          title={user.is_active ? 'Desactivar usuario' : 'Activar usuario'}
                        >
                          {user.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Box>

      {/* New User Modal */}
      {showNewUserModal && (
        <NewUserModal
          onClose={() => setShowNewUserModal(false)}
          onSuccess={() => {
            setShowNewUserModal(false);
            loadUsers();
          }}
        />
      )}

      {/* Edit User Modal */}
      {selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onSuccess={() => {
            setSelectedUser(null);
            loadUsers();
          }}
        />
      )}
    </div>
  );
}

// ============================================
// New User Modal
// ============================================
interface NewUserModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const NewUserModal: React.FC<NewUserModalProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'admin' as 'admin' | 'notario',
    rut: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.full_name) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }
    if (formData.role === 'notario' && !formData.rut) {
      alert('El RUT es requerido para notarios');
      return;
    }

    setSaving(true);
    try {
      await createUser(formData);
      onSuccess();
    } catch (error: any) {
      console.error('Error creating user:', error);
      alert(error.response?.data?.error || 'Error al crear usuario');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-document max-w-md w-full">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Nuevo Usuario</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre Completo</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-sm font-sans focus:outline-none focus:ring-2 focus:ring-navy-900 focus:border-transparent"
              placeholder="Juan Pérez"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-sm font-sans focus:outline-none focus:ring-2 focus:ring-navy-900 focus:border-transparent"
              placeholder="juan@ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-sm font-sans focus:outline-none focus:ring-2 focus:ring-navy-900 focus:border-transparent pr-11"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Rol</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'notario' })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-sm font-sans focus:outline-none focus:ring-2 focus:ring-navy-900 focus:border-transparent"
            >
              <option value="admin">Administrador</option>
              <option value="notario">Notario</option>
            </select>
          </div>

          {formData.role === 'notario' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">RUT</label>
              <input
                type="text"
                value={formData.rut}
                onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-sm font-sans focus:outline-none focus:ring-2 focus:ring-navy-900 focus:border-transparent"
                placeholder="12.345.678-9"
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-md text-sm font-medium font-sans hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-navy-900 text-white rounded-md text-sm font-medium font-sans hover:bg-navy-800 disabled:opacity-50"
            >
              {saving ? 'Creando...' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================
// Edit User Modal
// ============================================
interface EditUserModalProps {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    full_name: user.full_name,
    email: user.email,
    rut: user.rut || '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSaving(true);
    try {
      const updateData: any = {
        full_name: formData.full_name,
        email: formData.email,
        rut: formData.rut || null
      };
      if (formData.password) {
        updateData.password = formData.password;
      }

      await updateUser(user.id, updateData);
      onSuccess();
    } catch (error: any) {
      console.error('Error updating user:', error);
      alert(error.response?.data?.error || 'Error al actualizar usuario');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-document max-w-md w-full">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Editar Usuario</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* User Info Header */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold ${user.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-navy-100 text-navy-700'
              }`}>
              {getInitials(user.full_name)}
            </div>
            <div>
              <p className="font-medium text-slate-900 text-sm">{user.role === 'admin' ? 'Administrador' : 'Notario'}</p>
              <p className="text-xs text-slate-500">Rol no editable</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre Completo</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-sm font-sans focus:outline-none focus:ring-2 focus:ring-navy-900 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-sm font-sans focus:outline-none focus:ring-2 focus:ring-navy-900 focus:border-transparent"
            />
          </div>

          {user.role === 'notario' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">RUT</label>
              <input
                type="text"
                value={formData.rut}
                onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-sm font-sans focus:outline-none focus:ring-2 focus:ring-navy-900 focus:border-transparent"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nueva Contraseña <span className="text-slate-400 font-normal">(opcional)</span></label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-sm font-sans focus:outline-none focus:ring-2 focus:ring-navy-900 focus:border-transparent pr-11"
                placeholder="Dejar vacío para mantener actual"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-md text-sm font-medium font-sans hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-navy-900 text-white rounded-md text-sm font-medium font-sans hover:bg-navy-800 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
