import React, { useState, useEffect } from 'react';
import { Shield, Users as UsersIcon, Plus, Check, X, ShieldCheck, Mail, Save, RefreshCw, MapPin } from 'lucide-react';
import { AppRole, AppUser, Permission, Khand, Mandal, Village, Contact } from '../types';
import { db, handleFirestoreError, OperationType, auth } from '../firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { SearchableContactSelect } from './SearchableContactSelect';

export const PERMISSIONS: { id: Permission; label: string; desc: string }[] = [
  { id: 'manage_users', label: 'Manage Users', desc: 'Can access Admin panel to manage users and roles' },
  { id: 'manage_roles', label: 'Manage Roles', desc: 'Can create and edit roles' },
  { id: 'manage_areas', label: 'Manage Areas', desc: 'Can manage Khands, Mandals, and Villages' },
  { id: 'manage_contacts', label: 'Manage Contacts', desc: 'Can add, edit, and delete people (Swayamsevaks)' },
  { id: 'manage_events', label: 'Manage Events', desc: 'Can create and edit events, campaigns, and meetings' },
  { id: 'view_reports', label: 'View Reports', desc: 'Can view analytics and reports' },
  { id: 'manage_ideas', label: 'Manage Ideas', desc: 'Can review and manage ideas' }
];

interface AdminPanelProps {
  khands: Khand[];
  mandals: Mandal[];
  villages: Village[];
  contacts: Contact[];
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ khands, mandals, villages, contacts }) => {
  const [activeTab, setActiveTab] = useState<'roles'|'users'>('users');
  
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  
  const [loading, setLoading] = useState(true);

  // Role Edit State
  const [editingRole, setEditingRole] = useState<AppRole | null>(null);

  const [editingAreaPermsFor, setEditingAreaPermsFor] = useState<AppUser | null>(null);

  const toggleKhandPerm = async (userId: string, khandId: string) => {
    const targetUser = users.find(u => u.uid === userId);
    if (!targetUser) return;
    const current = targetUser.areaPermissions?.khandIds || [];
    const newKhandIds = current.includes(khandId) 
      ? current.filter(id => id !== khandId)
      : [...current, khandId];
    
    try {
      await setDoc(doc(db, 'users', userId), { 
        ...targetUser, 
        areaPermissions: { ...targetUser.areaPermissions, khandIds: newKhandIds } 
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users');
    }
  };

  useEffect(() => {
    if (!auth.currentUser) return; // Wait for auth
    const unsubRoles = onSnapshot(collection(db, 'roles'), (snap) => {
      const parsedRoles = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppRole));
      setRoles(parsedRoles);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'roles');
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const parsedUsers = snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as AppUser));
      setUsers(parsedUsers);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    return () => {
      unsubRoles();
      unsubUsers();
    };
  }, [auth.currentUser]);

  const saveRole = async (role: AppRole) => {
    if (!role.name.trim()) return;
    try {
      if (!role.id) role.id = 'role_' + Date.now();
      await setDoc(doc(db, 'roles', role.id), role);
      setEditingRole(null);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'roles');
    }
  };

  const deleteRole = async (id: string) => {
    if (confirm('Are you sure you want to delete this role?')) {
      try {
        await deleteDoc(doc(db, 'roles', id));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, 'roles');
      }
    }
  };

  const updateUserRole = async (userId: string, roleId: string | null) => {
    try {
      const targetUser = users.find(u => u.uid === userId);
      if (!targetUser) return;
      await setDoc(doc(db, 'users', userId), { ...targetUser, roleId });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'users');
    }
  };

  const linkUserToContact = async (userId: string, contactId: string | null) => {
    try {
      const targetUser = users.find(u => u.uid === userId);
      if (!targetUser) return;
      await setDoc(doc(db, 'users', userId), { ...targetUser, linkedContactId: contactId || null }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'users');
    }
  };

  return (
    <div className="px-1 sm:px-3 lg:px-4 py-4 sm:py-6 pb-24 max-w-7xl mx-auto font-sans">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-blue-600" />
            Admin & Role Management
          </h2>
          <p className="text-gray-600 mt-1">Manage system access, roles, and user permissions.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 bg-white rounded-t-xl px-2 pt-2 gap-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <UsersIcon className="w-4 h-4" />
          Assign Roles to Users
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'roles' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Shield className="w-4 h-4" />
          System Roles
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
          
          {activeTab === 'users' && (
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">User Access</h3>
              </div>
              <div className="grid gap-4">
                {users.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No users registered yet.</p>
                ) : (
                  users.map(user => (
                    <div key={user.uid} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl hover:bg-gray-50 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold">
                          {user.displayName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{user.displayName || 'No Name'}</p>
                          <p className="text-sm text-gray-500 flex items-center gap-1"><Mail className="w-3 h-3"/> {user.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:items-end gap-3 mt-4 sm:mt-0 sm:flex-row">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-gray-500 uppercase tracking-widest font-semibold flex items-center gap-1">
                            Role
                          </label>
                          <select
                            className="px-3 py-2 border rounded-lg bg-white text-sm font-medium w-full sm:w-auto outline-none focus:ring-2 focus:ring-blue-500"
                            value={user.roleId || ''}
                            onChange={(e) => updateUserRole(user.uid, e.target.value || null)}
                          >
                            <option value="">-- No Access --</option>
                            {roles.map(r => (
                              <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-gray-500 uppercase tracking-widest font-semibold flex items-center gap-1">
                            Area Block
                          </label>
                          <button
                            onClick={() => setEditingAreaPermsFor(user)}
                            className="px-3 py-2 border rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <MapPin className="w-4 h-4 text-emerald-600" />
                            {user.areaPermissions?.khandIds?.length ? `${user.areaPermissions.khandIds.length} Restricted` : 'All Areas'}
                          </button>
                        </div>
                        <div className="flex flex-col gap-1 z-40 relative">
                          <label className="text-xs text-gray-500 uppercase tracking-widest font-semibold flex items-center gap-1">
                            Linked Contact
                          </label>
                          <SearchableContactSelect 
                            contacts={contacts}
                            value={user.linkedContactId || null}
                            onChange={(id) => linkUserToContact(user.uid, id)}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {editingAreaPermsFor && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <MapPin className="text-emerald-600" />
                        Area Restrictions
                      </h3>
                      <button onClick={() => setEditingAreaPermsFor(null)} className="text-gray-400 hover:text-gray-700">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mb-6">
                      Select which Khands (Blocks) <span className="font-semibold text-gray-900">{editingAreaPermsFor.displayName}</span> has access to. If none are selected, they have access to all areas (dependent on their role).
                    </p>
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 border-y py-4">
                      {khands.map(khand => {
                        // find fresh user state from users array
                        const freshUser = users.find(u => u.uid === editingAreaPermsFor.uid);
                        const isSelected = freshUser?.areaPermissions?.khandIds?.includes(khand.id) || false;
                        return (
                          <label key={khand.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors">
                            <div className="flex-shrink-0">
                              <input 
                                type="checkbox" 
                                className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500" 
                                checked={isSelected}
                                onChange={() => toggleKhandPerm(editingAreaPermsFor.uid, khand.id)}
                              />
                            </div>
                            <span className="font-medium text-gray-900">{khand.name}</span>
                          </label>
                        );
                      })}
                    </div>
                    <div className="mt-6 flex justify-end">
                      <button 
                        onClick={() => setEditingAreaPermsFor(null)}
                        className="px-5 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="p-4 sm:p-6 flex flex-col md:flex-row gap-6">
              {/* Left Column: Roles List */}
              <div className="w-full md:w-1/3 border-r pr-0 md:pr-6 border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Defined Roles</h3>
                  <button 
                    onClick={() => setEditingRole({ id: '', name: 'New Role', permissions: [] })}
                    className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    title="Add Role"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-2">
                  {roles.length === 0 && <p className="text-sm text-gray-500">No roles defined yet.</p>}
                  {roles.map(role => (
                    <div 
                      key={role.id} 
                      onClick={() => setEditingRole(role)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        editingRole?.id === role.id ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-900">{role.name}</span>
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">{role.permissions.length} perms</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Role Editor */}
              <div className="w-full md:w-2/3">
                {editingRole ? (
                  <div className="bg-gray-50 border p-5 rounded-xl">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-gray-900">{editingRole.id ? 'Edit Role' : 'Create New Role'}</h3>
                      {editingRole.id && (
                        <button 
                          onClick={() => deleteRole(editingRole.id)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1"
                        >
                          <X className="w-4 h-4"/> Delete
                        </button>
                      )}
                    </div>

                    <div className="mb-5">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Role Name</label>
                      <input 
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={editingRole.name}
                        onChange={e => setEditingRole({...editingRole, name: e.target.value})}
                        placeholder="e.g. Event Manager"
                      />
                    </div>

                    <div className="mb-5">
                      <h4 className="font-semibold mb-3 text-gray-900 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-blue-500" /> Module Access Permissions
                      </h4>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {PERMISSIONS.map(perm => {
                          const hasPerm = editingRole.permissions.includes(perm.id);
                          return (
                            <div 
                              key={perm.id} 
                              onClick={() => {
                                const newPerms = hasPerm 
                                  ? editingRole.permissions.filter(p => p !== perm.id)
                                  : [...editingRole.permissions, perm.id];
                                setEditingRole({...editingRole, permissions: newPerms});
                              }}
                              className={`p-3 rounded-lg border cursor-pointer transition-colors flex gap-3 ${
                                hasPerm ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                              }`}
                            >
                              <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border-2 flex-shrink-0 transition-colors ${
                                hasPerm ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                              }`}>
                                {hasPerm && <Check className="w-3.5 h-3.5 text-white" />}
                              </div>
                              <div>
                                <p className={`text-sm font-semibold ${hasPerm ? 'text-blue-900' : 'text-gray-700'}`}>{perm.label}</p>
                                <p className="text-xs text-gray-500 mt-0.5 leading-snug">{perm.desc}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-4 border-t">
                      <button onClick={() => setEditingRole(null)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors">
                        Cancel
                      </button>
                      <button 
                        onClick={() => saveRole(editingRole)}
                        className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <Save className="w-4 h-4"/> Save Role
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
                    <Shield className="w-16 h-16 mb-4 opacity-50" />
                    <p>Select a role to edit or create a new one.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
