#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'offchat_admin.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
django.setup()

from admin_panel.models import Backup

def check_backup_sizes():
    print("=== Backup Size Debug ===")
    backups = Backup.objects.all()
    print(f'Total backups: {backups.count()}')
    
    for backup in backups:
        print(f'\nBackup ID: {backup.id}')
        print(f'Name: {backup.name}')
        print(f'Status: {backup.status}')
        print(f'Type: {backup.backup_type}')
        print(f'File Size (bytes): {backup.file_size}')
        print(f'File Size (MB): {backup.file_size / (1024*1024) if backup.file_size else 0:.2f}')
        print(f'Record Count: {backup.record_count}')
        print(f'Created: {backup.created_at}')
        print(f'Completed: {backup.completed_at}')
        if backup.file:
            print(f'File Path: {backup.file.path}')
            if backup.file and os.path.exists(backup.file.path):
                actual_size = os.path.getsize(backup.file.path)
                print(f'Actual File Size (bytes): {actual_size}')
                print(f'Actual File Size (MB): {actual_size / (1024*1024):.2f}')
            else:
                print('File does not exist on disk')
        print('-' * 50)

if __name__ == '__main__':
    check_backup_sizes()
