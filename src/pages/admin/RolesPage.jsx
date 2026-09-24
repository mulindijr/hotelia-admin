import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Plus, 
  Search, 
  Edit2, 
  Trash2,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useHotel } from '../../context/HotelContext';
import { rolesApi } from '../../api/roles';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';

const RolesPage = () => {
  const { hasPermission } = useAuth();
  const { activeHotelId } = useHotel();
  
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    permissions: []
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (activeHotelId) {
      loadData();
    }
  }, [activeHotelId]);

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

  const handleOpenModal = (role = null) => {
    setSelectedRole(role);
    setFormErrors({});
    if (role) {
      setFormData({
        name: role.name,
        permissions: role.permissions?.map(p => p.name) || []
      });
    } else {
      setFormData({
        name: '',
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
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
            <Shield className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="font-medium text-zinc-900 capitalize">
            {role.name.replace(/_/g, ' ')}
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Roles & Permissions</h1>
          <p className="text-zinc-500 text-sm mt-1">Manage access control and responsibilities.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input 
              placeholder="Search roles..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => handleOpenModal()} className="shrink-0 gap-2">
            <Plus className="w-4 h-4" />
            Add Role
          </Button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <DataTable
          data={filteredRoles}
          columns={columns}
          isLoading={isLoading}
          emptyState={
            <div className="text-center py-12">
              <Shield className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-zinc-900 mb-1">No roles found</h3>
              <p className="text-zinc-500">Get started by creating a new role.</p>
            </div>
          }
        />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedRole ? "Edit Role" : "Add New Role"}
        size="3xl"
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

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-zinc-700">
                Permissions
              </label>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={handleSelectAllPermissions}>
                  Select All
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={handleClearPermissions}>
                  Clear
                </Button>
              </div>
            </div>
            
            {formErrors.permissions && (
              <p className="text-sm text-red-600">{formErrors.permissions[0]}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {permissions.map((permission) => {
                const isSelected = formData.permissions.includes(permission.name);
                return (
                  <div 
                    key={permission.id}
                    onClick={() => handleTogglePermission(permission.name)}
                    className={`
                      flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all
                      ${isSelected 
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-sm' 
                        : 'border-zinc-200 hover:border-zinc-300 bg-white'
                      }
                    `}
                  >
                    <div className={`
                      shrink-0 w-5 h-5 mt-0.5 rounded flex items-center justify-center border
                      ${isSelected 
                        ? 'bg-indigo-600 border-indigo-600' 
                        : 'border-zinc-300'
                      }
                    `}>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${isSelected ? 'text-indigo-900' : 'text-zinc-900'}`}>
                        {permission.name.replace(/_/g, ' ')}
                      </p>
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
        message={`Are you sure you want to delete the role "${selectedRole?.name}"? Users assigned to this role may lose access.`}
        confirmText="Delete Role"
        isDestructive={true}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default RolesPage;
