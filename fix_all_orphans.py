#!/usr/bin/env python
"""
Fix all orphaned lines in backup_restore_service.py
"""

def fix_all_orphans():
    file_path = r"c:\Users\salaam\Desktop\offchat-admin-nexus-main\admin_panel\services\backup_restore_service.py"
    
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Remove orphaned lines
    fixed_lines = []
    for i, line in enumerate(lines):
        line_num = i + 1
        # Skip orphaned lines
        if line_num in [589, 590]:
            continue
        fixed_lines.append(line)
    
    # Write back the fixed content
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(fixed_lines)
    
    print("✅ Fixed all orphaned lines")

if __name__ == '__main__':
    fix_all_orphans()
