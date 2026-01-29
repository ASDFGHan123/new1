#!/usr/bin/env python
"""
Fix orphaned lines in backup_restore_service.py
"""

def fix_orphaned_lines():
    file_path = r"c:\Users\salaam\Desktop\offchat-admin-nexus-main\admin_panel\services\backup_restore_service.py"
    
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Remove orphaned lines at 549-550
    fixed_lines = []
    for i, line in enumerate(lines):
        line_num = i + 1
        # Skip the orphaned lines
        if line_num in [549, 550]:
            continue
        fixed_lines.append(line)
    
    # Write back the fixed content
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(fixed_lines)
    
    print("✅ Fixed orphaned lines")

if __name__ == '__main__':
    fix_orphaned_lines()
