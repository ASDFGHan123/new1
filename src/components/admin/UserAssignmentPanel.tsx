import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { organizationApi } from '@/lib/organization-api';

interface Assignment {
  id: string;
  user: string;
  user_username: string;
  department: string;
  department_name: string;
  office: string;
  office_name: string;
  status: string;
  joined_at: string;
}

export function UserAssignmentPanel() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [offices, setOffices] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ user: '', department: '', office: '' });
  const [selectedDept, setSelectedDept] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedDept) {
      fetchOffices(selectedDept);
    }
  }, [selectedDept]);

  const fetchData = async () => {
    try {
      const [depts, assigns] = await Promise.all([
        organizationApi.getDepartments(),
        fetch('http://localhost:8000/api/users/department-office-users/', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        }).then(r => r.json())
      ]);
      setDepartments(Array.isArray(depts) ? depts : depts.results || []);
      setAssignments(Array.isArray(assigns) ? assigns : assigns.results || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const fetchOffices = async (deptId: string) => {
    try {
      const data = await organizationApi.getOffices(deptId);
      setOffices(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error('Error fetching offices:', err);
    }
  };

  const handleCreate = async () => {
    if (!formData.user || !formData.department || !formData.office) return;
    try {
      await organizationApi.assignUserToDepartmentOffice(formData);
      setFormData({ user: '', department: '', office: '' });
      setShowForm(false);
      fetchData();
    } catch (err) {
      console.error('Error assigning user:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this assignment?')) return;
    try {
      await organizationApi.removeUserFromDepartmentOffice(id);
      fetchData();
    } catch (err) {
      console.error('Error removing assignment:', err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Assignments</h2>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="w-4 h-4 mr-2" /> Assign User
        </Button>
      </div>

      {showForm && (
        <Card className="p-4">
          <select
            value={formData.department}
            onChange={(e) => {
              setFormData({ ...formData, department: e.target.value, office: '' });
              setSelectedDept(e.target.value);
            }}
            className="w-full px-3 py-2 border rounded mb-2"
          >
            <option value="">Select Department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <select
            value={formData.office}
            onChange={(e) => setFormData({ ...formData, office: e.target.value })}
            disabled={!formData.department}
            className="w-full px-3 py-2 border rounded mb-2 disabled:bg-gray-100"
          >
            <option value="">Select Office</option>
            {offices.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="User ID"
            value={formData.user}
            onChange={(e) => setFormData({ ...formData, user: e.target.value })}
            className="w-full px-3 py-2 border rounded mb-2"
          />

          <div className="flex gap-2">
            <Button onClick={handleCreate} size="sm">Assign</Button>
            <Button onClick={() => setShowForm(false)} variant="outline" size="sm">Cancel</Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {assignments.map((assign) => (
          <Card key={assign.id} className="p-4 flex justify-between items-center">
            <div>
              <p className="font-semibold">{assign.user_username}</p>
              <p className="text-sm text-gray-600">{assign.department_name} - {assign.office_name}</p>
              <p className="text-xs text-gray-500">Status: {assign.status}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => handleDelete(assign.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
