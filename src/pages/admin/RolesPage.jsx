import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shield, 
  Plus, 
  Edit2, 
  Trash2,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useHotel } from '../../context/HotelContext';
import { rolesApi } from '../../api/roles';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';

// Logical functional groups for assigning permissions
const PERMISSION_GROUPS = [
  {
    id: 'bookings',
    title: 'Bookings & Front Desk',
    description: 'Reservations, check-ins, check-outs, and cancellations',
    match: (p) => p.name.includes('booking') || p.name.includes('check in') || p.name.includes('check out'),
  },
  {
    id: 'rooms',
    title: 'Rooms & Inventory',
    description: 'Room inventory, room types, amenities, and availability matrix',
    match: (p) => p.name.includes('room') || p.name.includes('amenit') || p.name.includes('availability'),
  },
  {
    id: 'guests',
    title: 'Guests',
    description: 'Guest profiles, identification, and guest directory',
    match: (p) => p.name.includes('guest') && !p.name.includes('check in') && !p.name.includes('check out'),
  },
  {
    id: 'payments',
    title: 'Payments & Invoicing',
    description: 'Payment transactions, receipts, refunds, and invoice management',
    match: (p) => p.name.includes('payment') || p.name.includes('invoice'),
  },
  {
    id: 'rates',
    title: 'Rates & Pricing',
    description: 'Sellable rate plans, packages, and dynamic pricing rules',
    match: (p) => p.name.includes('rate plan') || p.name.includes('pricing rule'),
  },
  {
    id: 'operations',
    title: 'Operations (Housekeeping & Maintenance)',
    description: 'Room cleaning tasks, inspections, and maintenance requests',
    match: (p) => p.name.includes('housekeeping') || p.name.includes('maintenance'),
  },
  {
    id: 'services',
    title: 'Services & Extras',
    description: 'Add-on products, amenities charges, and hotel services',
    match: (p) => p.name.includes('service'),
  },
  {
    id: 'staff',
    title: 'Staff Management',
    description: 'Staff member accounts, invitations, and role assignments',
    match: (p) => p.name.includes('user'),
  },
  {
    id: 'reports',
    title: 'Reports & Audit Logs',
    description: 'Financial reports, occupancy metrics, and security activity logs',
    match: (p) => p.name.includes('report') || p.name.includes('activity log'),
  },
  {
    id: 'hotels',
    title: 'Hotels & Properties',
    description: 'Multi-property profiles and general hotel settings',
    match: (p) => p.name.includes('hotel'),
  },
];

const RolesPage = () => {
  const { user } = useAuth();
  const { activeHotelId } = useHotel();
  const isSuperAdmin = user?.roles?.some(role => role === 'super_admin' || role.name === 'super_admin');
  
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    is_global: false,
    permissions: []
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [rolesRes, permsRes] = await Promise.all([
        rolesApi.getRoles(),
        rolesApi.getPermissions()
      ]);
      setRoles(rolesRes.data.data || []);
      setPermissions(permsRes.data.data || []);
    } catch (error) {
      console.error('Failed to load roles data', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeHotelId) {
      loadData();
    }
  }, [activeHotelId]);

  // Group permissions into logical PMS categories
  const groupedPermissions = useMemo(() => {
    const assignedIds = new Set();
    const groups = PERMISSION_GROUPS.map(group => {
      const matched = permissions.filter(p => !assignedIds.has(p.id) && group.match(p));
      matched.forEach(p => assignedIds.add(p.id));
      return {
        ...group,
        permissions: matched,
      };
    }).filter(g => g.permissions.length > 0);

    // Any remaining permissions not covered by predefined groups
    const remaining = permissions.filter(p => !assignedIds.has(p.id));
    if (remaining.length > 0) {
      groups.push({
        id: 'other',
        title: 'Other Permissions',
        description: 'Additional system permissions',
        permissions: remaining,
      });
    }

    return groups;
  }, [permissions]);

  const handleOpenModal = (role = null) => {
    setSelectedRole(role);
    setFormErrors({});
    if (role) {
      setFormData({
        name: role.name,
        is_global: role.hotel_id === null,
        permissions: role.permissions?.map(p => p.name) || []
      });
    } else {
      setFormData({
        name: '',
        is_global: false,
        permissions: []
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRole(null);
  };

  const handleTogglePermission = (permissionName) => {
    setFormData(prev => {
      const current = prev.permissions;
      if (current.includes(permissionName)) {
        return { ...prev, permissions: current.filter(p => p !== permissionName) };
      } else {
        return { ...prev, permissions: [...current, permissionName] };
      }
    });
  };

  const handleToggleGroupPermissions = (groupPermNames, selectAll) => {
    setFormData(prev => {
      const current = new Set(prev.permissions);
      groupPermNames.forEach(name => {
        if (selectAll) {
          current.add(name);
        } else {
          current.delete(name);
        }
      });
      return { ...prev, permissions: Array.from(current) };
    });
  };

  const handleSelectAllPermissions = () => {
    setFormData(prev => ({
      ...prev,
      permissions: permissions.map(p => p.name)
    }));
  };

  const handleClearPermissions = () => {
    setFormData(prev => ({
      ...prev,
      permissions: []
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setFormErrors({});

      if (selectedRole) {
        await rolesApi.updateRole(selectedRole.id, formData);
      } else {
        await rolesApi.createRole(formData);
      }
      
      handleCloseModal();
      loadData();
    } catch (error) {
      if (error.response?.status === 422) {
        setFormErrors(error.response.data.errors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsSubmitting(true);
      await rolesApi.deleteRole(selectedRole.id);
      setIsDeleteModalOpen(false);
      setSelectedRole(null);
      loadData();
    } catch (error) {
      console.error('Failed to delete role', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      header: 'Role Name',
      accessor: 'name',
      render: (role) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center">
            <Shield className="w-4 h-4 text-zinc-700" />
          </div>
          <span className="font-medium text-zinc-900 capitalize">
            {role.name.replace(/_/g, ' ')}
            {role.hotel_id === null && (
              <Badge variant="secondary" className="ml-2 text-xs">Global</Badge>
            )}
          </span>
        </div>
      ),
    },
    {
      header: 'Permissions',
      accessor: 'permissions',
      render: (role) => {
        const count = role.permissions?.length || 0;
        const isAll = count === permissions.length && count > 0;
        
        return (
          <div className="flex items-center gap-2">
            <Badge variant={isAll ? 'success' : 'secondary'}>
              {isAll ? 'Full Access' : `${count} Permissions`}
            </Badge>
          </div>
        );
      },
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (role) => (
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleOpenModal(role)}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => {
              setSelectedRole(role);
              setIsDeleteModalOpen(true);
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="-mx-6 -mt-6 px-6 py-6 mb-6 bg-zinc-50 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Roles</h1>
          <p className="text-zinc-500 text-sm mt-1">Manage access control, permissions, and staff responsibilities.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="shrink-0 gap-2">
          <Plus className="w-4 h-4" />
          Add Role
        </Button>
      </div>

      {/* Roles Table - Direct in page layout without wrapping outer container */}
      <DataTable
        data={filteredRoles}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search roles..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        emptyStateMessage="No roles found. Get started by creating a new role."
      />

      {/* Role Create/Edit Modal with Grouped Permissions */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedRole ? "Edit Role" : "Add New Role"}
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Role Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={formErrors.name?.[0]}
            placeholder="e.g. Front Desk Agent"
            required
          />

          {isSuperAdmin && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_global"
                checked={formData.is_global}
                onChange={(e) => setFormData({ ...formData, is_global: e.target.checked })}
                className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
              />
              <label htmlFor="is_global" className="text-sm font-medium text-zinc-700 cursor-pointer select-none">
                Global Role (Applies across all properties)
              </label>
            </div>
          )}

          {/* Permissions Grouping Section */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-100">
              <div>
                <label className="block text-sm font-semibold text-zinc-900">
                  Role Permissions
                </label>
                <p className="text-xs text-zinc-500">
                  {formData.permissions.length} of {permissions.length} permissions assigned
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={handleSelectAllPermissions}>
                  Select All
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={handleClearPermissions}>
                  Clear All
                </Button>
              </div>
            </div>
            
            {formErrors.permissions && (
              <p className="text-sm text-red-600">{formErrors.permissions[0]}</p>
            )}

            {/* Scrollable list of functional permission groups */}
            <div className="space-y-5 max-h-[58vh] overflow-y-auto pr-1">
              {groupedPermissions.map((group) => {
                const groupPermNames = group.permissions.map(p => p.name);
                const selectedInGroup = groupPermNames.filter(name => formData.permissions.includes(name));
                const isAllSelected = groupPermNames.length > 0 && selectedInGroup.length === groupPermNames.length;

                return (
                  <div key={group.id} className="border border-zinc-200 rounded-xl p-4 bg-zinc-50/50 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-zinc-900">{group.title}</h4>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-zinc-200 text-zinc-700">
                            {selectedInGroup.length} / {groupPermNames.length}
                          </span>
                        </div>
                        {group.description && (
                          <p className="text-xs text-zinc-500 mt-0.5">{group.description}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleGroupPermissions(groupPermNames, !isAllSelected)}
                        className="text-xs font-medium text-zinc-600 hover:text-zinc-900 underline cursor-pointer select-none"
                      >
                        {isAllSelected ? 'Deselect all' : 'Select all'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {group.permissions.map((permission) => {
                        const isSelected = formData.permissions.includes(permission.name);
                        return (
                          <div 
                            key={permission.id}
                            onClick={() => handleTogglePermission(permission.name)}
                            className={`
                              flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer select-none transition-all
                              ${isSelected 
                                ? 'border-zinc-900 bg-white ring-1 ring-zinc-900 shadow-xs' 
                                : 'border-zinc-200 hover:border-zinc-300 bg-white'
                              }
                            `}
                          >
                            <div className={`
                              shrink-0 w-4 h-4 mt-0.5 rounded flex items-center justify-center border transition-colors
                              ${isSelected 
                                ? 'bg-zinc-900 border-zinc-900 text-white' 
                                : 'border-zinc-300 bg-white'
                              }
                            `}>
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <div className="min-w-0">
                              <p className={`text-xs font-medium leading-tight ${isSelected ? 'text-zinc-900 font-semibold' : 'text-zinc-700'}`}>
                                {permission.name.replace(/_/g, ' ')}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {selectedRole ? 'Save Changes' : 'Create Role'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Role"
        description={`Are you sure you want to delete the role "${selectedRole?.name}"? Users assigned to this role may lose access.`}
        confirmText="Delete Role"
        isDestructive={true}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default RolesPage;