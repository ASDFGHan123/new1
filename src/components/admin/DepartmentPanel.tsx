import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { organizationApi } from '@/lib/organization-api';

interface Department {
  id: string;
  name: string;
  description: string;
  manager: string;
  code: string;
  head: string | null;
  head_username: string;
  office_count: number;
  member_count: number;
  created_at: string;
}

export function DepartmentPanel() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [expandedDept, setExpandedDept] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', manager: '', code: '', head: '' });
  const [loading, setLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; deptId: string | null }>({ open: false, deptId: null });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const data = await organizationApi.getDepartments();
      setDepartments(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) return;
    setLoading(true);
    try {
      if (editingId) {
        await organizationApi.updateDepartment(editingId, formData);
        setEditingId(null);
      } else {
        await organizationApi.createDepartment(formData);
      }
      setFormData({ name: '', description: '', manager: '', code: '', head: '' });
      setShowForm(false);
      fetchDepartments();
    } catch (err) {
      console.error('Error saving department:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (dept: Department) => {
    setFormData({ name: dept.name, description: dept.description, manager: dept.manager, code: dept.code, head: dept.head || '' });
    setEditingId(dept.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setDeleteDialog({ open: true, deptId: id });
  };

  const confirmDelete = async (action: 'trash' | 'permanent') => {
    if (!deleteDialog.deptId) return;
    try {
      await organizationApi.deleteDepartment(deleteDialog.deptId, { action });
      setDeleteDialog({ open: false, deptId: null });
      fetchDepartments();
    } catch (err) {
      console.error('Error deleting department:', err);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', description: '', manager: '', code: '', head: '' });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Departments</h2>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="w-4 h-4 mr-2" /> Add Department
        </Button>
      </div>

      {showForm && (
        <Card className="p-4">
          <input
            type="text"
            placeholder="Department name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border rounded mb-2"
          />
          <input
            type="text"
            placeholder="Manager"
            value={formData.manager}
            onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
            className="w-full px-3 py-2 border rounded mb-2"
          />
          <input
            type="text"
            placeholder="Code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            className="w-full px-3 py-2 border rounded mb-2"
          />
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border rounded mb-2"
            rows={2}
          />
          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={loading} size="sm">
              {editingId ? 'Update' : 'Create'}
            </Button>
            <Button onClick={handleCancel} variant="outline" size="sm">
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {departments.map((dept) => (
          <Card key={dept.id} className="p-4">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedDept(expandedDept === dept.id ? null : dept.id)}>
              <div className="flex-1">
                <h3 className="font-semibold">{dept.name}</h3>
                <p className="text-sm text-gray-600">{dept.description}</p>
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  <span>Manager: {dept.manager}</span>
                  <span>Code: {dept.code}</span>
                  <button onClick={(e) => { e.stopPropagation(); setExpandedDept(expandedDept === dept.id ? null : dept.id); }} className="text-blue-600 hover:underline cursor-pointer">Offices: {dept.office_count}</button>
                  <span>Members: {dept.member_count}</span>
                  {dept.head_username && <span>Head: {dept.head_username}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(dept); }}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(dept.id); }} className="text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                </Button>
                <ChevronDown className={`w-4 h-4 transition ${expandedDept === dept.id ? 'rotate-180' : ''}`} />
              </div>
            </div>

            {expandedDept === dept.id && (
              <div className="mt-4 pt-4 border-t space-y-4">
                <DepartmentMembers departmentId={dept.id} />
                <OfficeList departmentId={dept.id} />
              </div>
            )}
          </Card>
        ))}
      </div>

      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Department</DialogTitle>
            <DialogDescription>
              Choose how to delete this department
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, deptId: null })}>
              Cancel
            </Button>
            <Button variant="outline" onClick={() => confirmDelete('trash')}>
              Move to Trash
            </Button>
            <Button variant="destructive" onClick={() => confirmDelete('permanent')}>
              Permanently Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DepartmentMembers({ departmentId }: { departmentId: string }) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, [departmentId]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/departments/${departmentId}/members/`);
      const data = await response.json();
      setMembers(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h4 className="font-semibold text-sm mb-2">Department Members</h4>
      {loading ? (
        <p className="text-xs text-gray-500">Loading...</p>
      ) : members.length > 0 ? (
        <div className="space-y-1">
          {members.map((member) => (
            <p key={member.id} className="text-xs text-gray-700">• {member.user_username}</p>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-500">No members</p>
      )}
    </div>
  );
}

function OfficeList({ departmentId }: { departmentId: string }) {
  const [offices, setOffices] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', manager: '', code: '', description: '' });
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; officeId: string | null }>({ open: false, officeId: null });
  const [expandedOffice, setExpandedOffice] = useState<string | null>(null);

  useEffect(() => {
    fetchOffices();
  }, [departmentId]);

  const fetchOffices = async () => {
    try {
      const data = await organizationApi.getDepartmentOffices(departmentId);
      setOffices(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error('Error fetching offices:', err);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) return;
    setError('');
    try {
      if (editingId) {
        await organizationApi.updateOffice(editingId, { ...formData, department: departmentId });
        setEditingId(null);
      } else {
        await organizationApi.createOffice({ ...formData, department: departmentId });
      }
      setFormData({ name: '', manager: '', code: '', description: '' });
      setShowForm(false);
      fetchOffices();
    } catch (err: any) {
      try {
        const errorData = JSON.parse(err.message);
        const errorMsg = Object.values(errorData).flat().join(', ');
        setError(errorMsg);
      } catch {
        setError(err.message || 'Failed to save office');
      }
    }
  };

  const handleEdit = (office: any) => {
    setFormData({ name: office.name, manager: office.manager, code: office.code, description: office.description });
    setEditingId(office.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', manager: '', code: '', description: '' });
  };

  const handleDelete = (id: string) => {
    setDeleteDialog({ open: true, officeId: id });
  };

  const confirmDelete = async (action: 'trash' | 'permanent') => {
    if (!deleteDialog.officeId) return;
    try {
      await organizationApi.deleteOffice(deleteDialog.officeId, { action });
      setDeleteDialog({ open: false, officeId: null });
      fetchOffices();
    } catch (err) {
      console.error('Error deleting office:', err);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold text-sm">Offices</h4>
        <Button onClick={() => setShowForm(!showForm)} size="sm" variant="outline">
          <Plus className="w-3 h-3 mr-1" /> Add Office
        </Button>
      </div>

      {showForm && (
        <div className="bg-gray-50 p-3 rounded space-y-2">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <input
            type="text"
            placeholder="Office name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-2 py-1 border rounded text-sm"
          />
          <input
            type="text"
            placeholder="Manager"
            value={formData.manager}
            onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
            className="w-full px-2 py-1 border rounded text-sm"
          />
          <input
            type="text"
            placeholder="Code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            className="w-full px-2 py-1 border rounded text-sm"
          />
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-2 py-1 border rounded text-sm"
            rows={2}
          />
          <div className="flex gap-2">
            <Button onClick={handleCreate} size="sm">{editingId ? 'Update' : 'Create'}</Button>
            <Button onClick={handleCancel} variant="outline" size="sm">Cancel</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {offices.map((office) => (
          <div key={office.id}>
            <div className="bg-white border p-3 rounded flex justify-between items-start">
              <div className="flex-1">
                <p className="font-medium text-sm text-gray-900">{office.name}</p>
                <p className="text-xs text-gray-700">Manager: {office.manager}</p>
                {office.code && <p className="text-xs text-gray-700">Code: {office.code}</p>}
                <button onClick={() => setExpandedOffice(expandedOffice === office.id ? null : office.id)} className="text-xs text-blue-600 hover:underline cursor-pointer mt-1">Members: {office.member_count}</button>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => handleEdit(office)} className="text-blue-600 hover:bg-blue-100">
                  <Edit2 className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(office.id)} className="text-red-600 hover:bg-red-100">
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
            {expandedOffice === office.id && office.members && office.members.length > 0 && (
              <div className="bg-gray-50 p-3 rounded mt-2 ml-4">
                <p className="text-xs font-semibold mb-2">Members:</p>
                <div className="space-y-1">
                  {office.members.map((member: any) => (
                    <p key={member.id} className="text-xs text-gray-700">• {member.name || member.username}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Office</DialogTitle>
            <DialogDescription>
              Choose how to delete this office
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, officeId: null })}>
              Cancel
            </Button>
            <Button variant="outline" onClick={() => confirmDelete('trash')}>
              Move to Trash
            </Button>
            <Button variant="destructive" onClick={() => confirmDelete('permanent')}>
              Permanently Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
