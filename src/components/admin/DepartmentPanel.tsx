import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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

interface Member {
  id: string;
  user_username: string;
}

interface Office {
  id: string;
  name: string;
  manager: string;
  code: string;
  description: string;
  member_count: number;
  members?: Member[];
}

export function DepartmentPanel() {
  const { t } = useTranslation();
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
        <h2 className="text-2xl font-bold">{t('departments.departments')}</h2>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="w-4 h-4 mr-2" /> {t('departments.addDepartment')}
        </Button>
      </div>

      {showForm && (
        <Card className="p-4">
          <input
            type="text"
            placeholder={t('departments.departmentName')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border rounded mb-2"
          />
          <input
            type="text"
            placeholder={t('departments.manager')}
            value={formData.manager}
            onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
            className="w-full px-3 py-2 border rounded mb-2"
          />
          <input
            type="text"
            placeholder={t('departments.code')}
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            className="w-full px-3 py-2 border rounded mb-2"
          />
          <textarea
            placeholder={t('departments.description')}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border rounded mb-2"
            rows={2}
          />
          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={loading} size="sm">
              {editingId ? t('departments.update') : t('departments.create')}
            </Button>
            <Button onClick={handleCancel} variant="outline" size="sm">
              {t('departments.cancel')}
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
                  <span>{t('departments.manager')}: {dept.manager}</span>
                  <span>{t('departments.code')}: {dept.code}</span>
                  <button onClick={(e) => { e.stopPropagation(); setExpandedDept(expandedDept === dept.id ? null : dept.id); }} className="text-blue-600 hover:underline cursor-pointer">{t('departments.officeCount')}: {dept.office_count}</button>
                  <span>{t('departments.memberCount')}: {dept.member_count}</span>
                  {dept.head_username && <span>{t('departments.head')}: {dept.head_username}</span>}
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
            <DialogTitle>{t('departments.deleteDepartment')}</DialogTitle>
            <DialogDescription>
              {t('departments.chooseDeleteMethod')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, deptId: null })}>
              {t('common.cancel')}
            </Button>
            <Button variant="outline" onClick={() => confirmDelete('trash')}>
              {t('departments.moveToTrash')}
            </Button>
            <Button variant="destructive" onClick={() => confirmDelete('permanent')}>
              {t('departments.permanentlyDelete')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface DepartmentMembersProps {
  departmentId: string;
}

function DepartmentMembers({ departmentId }: DepartmentMembersProps) {
  const { t } = useTranslation();
  const [departmentMembers, setDepartmentMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadDepartmentMembers();
  }, [departmentId]);

  const loadDepartmentMembers = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await organizationApi.getDepartmentMembers(departmentId);
      setDepartmentMembers(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error('Error fetching members:', err);
      setErrorMessage(t('departments.failedToLoadMembers'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h4 className="font-semibold text-sm mb-2">{t('departments.departmentMembers')}</h4>
      {isLoading ? (
        <p className="text-xs text-gray-500">{t('common.loading')}</p>
      ) : errorMessage ? (
        <p className="text-xs text-red-500">{errorMessage}</p>
      ) : departmentMembers.length > 0 ? (
        <div className="space-y-1">
          {departmentMembers.map((member) => (
            <p key={member.id} className="text-xs text-gray-700">• {member.user_username}</p>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-500">{t('departments.noMembers')}</p>
      )}
    </div>
  );
}

interface OfficeListProps {
  departmentId: string;
}

function OfficeList({ departmentId }: OfficeListProps) {
  const { t } = useTranslation();
  const [officeList, setOfficeList] = useState<Office[]>([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [officeFormData, setOfficeFormData] = useState({ name: '', manager: '', code: '', description: '' });
  const [errorMessage, setErrorMessage] = useState('');
  const [editingOfficeId, setEditingOfficeId] = useState<string | null>(null);
  const [deleteDialogState, setDeleteDialogState] = useState<{ open: boolean; officeId: string | null }>({ open: false, officeId: null });
  const [expandedOfficeId, setExpandedOfficeId] = useState<string | null>(null);

  useEffect(() => {
    loadOffices();
  }, [departmentId]);

  const loadOffices = async () => {
    try {
      const data = await organizationApi.getDepartmentOffices(departmentId);
      setOfficeList(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error('Error fetching offices:', err);
    }
  };

  const handleCreateOffice = async () => {
    if (!officeFormData.name.trim()) return;
    setErrorMessage('');
    try {
      if (editingOfficeId) {
        await organizationApi.updateOffice(editingOfficeId, { ...officeFormData, department: departmentId });
        setEditingOfficeId(null);
      } else {
        await organizationApi.createOffice({ ...officeFormData, department: departmentId });
      }
      setOfficeFormData({ name: '', manager: '', code: '', description: '' });
      setIsFormVisible(false);
      loadOffices();
    } catch (err: any) {
      try {
        const errorData = JSON.parse(err.message);
        const errorMsg = Object.values(errorData).flat().join(', ');
        setErrorMessage(errorMsg);
      } catch {
        setErrorMessage(err.message || 'Failed to save office');
      }
    }
  };

  const handleEditOffice = (office: Office) => {
    setOfficeFormData({ name: office.name, manager: office.manager, code: office.code, description: office.description });
    setEditingOfficeId(office.id);
    setIsFormVisible(true);
  };

  const handleCancelForm = () => {
    setIsFormVisible(false);
    setEditingOfficeId(null);
    setOfficeFormData({ name: '', manager: '', code: '', description: '' });
  };

  const handleDeleteOffice = (id: string) => {
    setDeleteDialogState({ open: true, officeId: id });
  };

  const confirmDeleteOffice = async (action: 'trash' | 'permanent') => {
    if (!deleteDialogState.officeId) return;
    try {
      await organizationApi.deleteOffice(deleteDialogState.officeId, { action });
      setDeleteDialogState({ open: false, officeId: null });
      loadOffices();
    } catch (err) {
      console.error('Error deleting office:', err);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold text-sm">{t('departments.offices')}</h4>
        <Button onClick={() => setIsFormVisible(!isFormVisible)} size="sm" variant="outline">
          <Plus className="w-3 h-3 mr-1" /> {t('departments.addOffice')}
        </Button>
      </div>

      {isFormVisible && (
        <div className="bg-gray-50 p-3 rounded space-y-2">
          {errorMessage && <p className="text-red-600 text-sm">{errorMessage}</p>}
          <input
            type="text"
            placeholder={t('departments.officeName')}
            value={officeFormData.name}
            onChange={(e) => setOfficeFormData({ ...officeFormData, name: e.target.value })}
            className="w-full px-2 py-1 border rounded text-sm"
          />
          <input
            type="text"
            placeholder={t('departments.manager')}
            value={officeFormData.manager}
            onChange={(e) => setOfficeFormData({ ...officeFormData, manager: e.target.value })}
            className="w-full px-2 py-1 border rounded text-sm"
          />
          <input
            type="text"
            placeholder={t('departments.code')}
            value={officeFormData.code}
            onChange={(e) => setOfficeFormData({ ...officeFormData, code: e.target.value })}
            className="w-full px-2 py-1 border rounded text-sm"
          />
          <textarea
            placeholder={t('departments.description')}
            value={officeFormData.description}
            onChange={(e) => setOfficeFormData({ ...officeFormData, description: e.target.value })}
            className="w-full px-2 py-1 border rounded text-sm"
            rows={2}
          />
          <div className="flex gap-2">
            <Button onClick={handleCreateOffice} size="sm">{editingOfficeId ? t('departments.update') : t('departments.create')}</Button>
            <Button onClick={handleCancelForm} variant="outline" size="sm">{t('common.cancel')}</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {officeList.map((office) => (
          <div key={office.id}>
            <div className="bg-white border p-3 rounded flex justify-between items-start">
              <div className="flex-1">
                <p className="font-medium text-sm text-gray-900">{office.name}</p>
                <p className="text-xs text-gray-700">{t('departments.manager')}: {office.manager}</p>
                {office.code && <p className="text-xs text-gray-700">{t('departments.code')}: {office.code}</p>}
                <button onClick={() => setExpandedOfficeId(expandedOfficeId === office.id ? null : office.id)} className="text-xs text-blue-600 hover:underline cursor-pointer mt-1">{t('departments.members')}: {office.member_count}</button>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => handleEditOffice(office)} className="text-blue-600 hover:bg-blue-100">
                  <Edit2 className="w-4 h-4 mr-1" />
                  {t('common.edit')}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDeleteOffice(office.id)} className="text-red-600 hover:bg-red-100">
                  <Trash2 className="w-4 h-4 mr-1" />
                  {t('common.delete')}
                </Button>
              </div>
            </div>
            {expandedOfficeId === office.id && office.members && office.members.length > 0 && (
              <div className="bg-gray-50 p-3 rounded mt-2 ml-4">
                <p className="text-xs font-semibold mb-2">{t('departments.members')}:</p>
                <div className="space-y-1">
                  {office.members.map((member: Member) => (
                    <p key={member.id} className="text-xs text-gray-700">• {member.user_username}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <Dialog open={deleteDialogState.open} onOpenChange={(open) => setDeleteDialogState({ ...deleteDialogState, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('departments.deleteOffice')}</DialogTitle>
            <DialogDescription>
              {t('departments.chooseDeleteMethod')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogState({ open: false, officeId: null })}>
              {t('common.cancel')}
            </Button>
            <Button variant="outline" onClick={() => confirmDeleteOffice('trash')}>
              {t('departments.moveToTrash')}
            </Button>
            <Button variant="destructive" onClick={() => confirmDeleteOffice('permanent')}>
              {t('departments.permanentlyDelete')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
