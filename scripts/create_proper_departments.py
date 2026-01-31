#!/usr/bin/env python
"""
Create proper department names for signup page
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'offchat_backend.settings.development')
django.setup()

from users.models_organization import Department, Office

def create_proper_departments():
    """Create proper departments with meaningful names"""
    print("=== Creating Proper Departments ===")
    
    # Delete existing test departments
    existing_depts = Department.objects.all()
    print(f"Deleting {existing_depts.count()} existing departments...")
    existing_depts.delete()
    
    # Create proper departments
    proper_departments = [
        {
            'name': 'Information Technology',
            'manager': 'IT Manager',
            'description': 'IT and software development department'
        },
        {
            'name': 'Human Resources',
            'manager': 'HR Manager', 
            'description': 'Human resources and personnel management'
        },
        {
            'name': 'Finance',
            'manager': 'Finance Manager',
            'description': 'Financial management and accounting'
        },
        {
            'name': 'Marketing',
            'manager': 'Marketing Manager',
            'description': 'Marketing and sales department'
        },
        {
            'name': 'Operations',
            'manager': 'Operations Manager',
            'description': 'Operations and logistics'
        },
        {
            'name': 'Customer Service',
            'manager': 'Customer Service Manager',
            'description': 'Customer support and service'
        },
        {
            'name': 'Sales',
            'manager': 'Sales Manager',
            'description': 'Sales and business development'
        },
        {
            'name': 'Administration',
            'manager': 'Administration Manager',
            'description': 'General administration'
        }
    ]
    
    created_depts = []
    for dept_data in proper_departments:
        dept = Department.objects.create(**dept_data)
        created_depts.append(dept)
        print(f"✅ Created department: {dept.name}")
    
    # Create some sample offices for each department
    print("\nCreating sample offices...")
    for dept in created_depts:
        offices = [
            {
                'name': f'{dept.name} - Main Office',
                'department': dept,
                'description': f'Main office for {dept.name}'
            },
            {
                'name': f'{dept.name} - Branch Office',
                'department': dept,
                'description': f'Branch office for {dept.name}'
            }
        ]
        
        for office_data in offices:
            office = Office.objects.create(**office_data)
            print(f"  ✅ Created office: {office.name}")
    
    print(f"\n✅ Successfully created {len(created_depts)} departments and {len(created_depts) * 2} offices!")
    
    # Verify creation
    print(f"\nFinal verification:")
    print(f"Total departments: {Department.objects.count()}")
    print(f"Total offices: {Office.objects.count()}")
    
    print("\nDepartments now available for signup:")
    for dept in Department.objects.all():
        print(f"  - {dept.name} ({dept.offices.count()} offices)")

if __name__ == '__main__':
    create_proper_departments()
