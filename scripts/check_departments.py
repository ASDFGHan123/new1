#!/usr/bin/env python
"""
Script to check and create sample departments for signup page
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'offchat_backend.settings.development')
django.setup()

from users.models_organization import Department, Office

def check_departments():
    """Check existing departments"""
    departments = Department.objects.all()
    print(f"Found {departments.count()} departments:")
    for dept in departments:
        print(f"  - {dept.name} (ID: {dept.id})")
    return departments

def create_sample_departments():
    """Create sample departments if none exist"""
    if Department.objects.exists():
        print("Departments already exist, skipping creation.")
        return
    
    print("Creating sample departments...")
    
    sample_departments = [
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
        }
    ]
    
    created_depts = []
    for dept_data in sample_departments:
        dept = Department.objects.create(**dept_data)
        created_depts.append(dept)
        print(f"Created department: {dept.name}")
    
    # Create some sample offices for IT department
    it_dept = created_depts[0]  # IT Department
    sample_offices = [
        {
            'name': 'Main Office',
            'location': 'Building A, Floor 1',
            'department': it_dept,
            'description': 'Main IT office'
        },
        {
            'name': 'Development Lab',
            'location': 'Building B, Floor 3',
            'department': it_dept,
            'description': 'Software development workspace'
        }
    ]
    
    for office_data in sample_offices:
        office = Office.objects.create(**office_data)
        print(f"Created office: {office.name} for {it_dept.name}")
    
    print(f"\nCreated {len(created_depts)} departments and 2 offices successfully!")

def main():
    print("=== Department Check and Setup ===")
    print()
    
    # Check existing departments
    departments = check_departments()
    
    if departments.count() == 0:
        print("\nNo departments found. Creating sample departments...")
        create_sample_departments()
        
        print("\nChecking departments after creation:")
        check_departments()
    else:
        print("\nDepartments already exist.")
    
    # Check offices too
    print(f"\nFound {Office.objects.count()} offices:")
    for office in Office.objects.all()[:5]:  # Show first 5 offices
        print(f"  - {office.name} (Department: {office.department.name})")
    
    print("\n=== Department setup complete ===")
    print("Departments should now appear in the signup page!")

if __name__ == '__main__':
    main()
