#!/usr/bin/env python
"""
Fix indentation error in backup_restore_service.py
"""

def fix_indentation():
    file_path = r"c:\Users\salaam\Desktop\offchat-admin-nexus-main\admin_panel\services\backup_restore_service.py"
    
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Find and remove the duplicate lines
    fixed_lines = []
    skip_next = False
    
    for i, line in enumerate(lines):
        if skip_next:
            skip_next = False
            continue
            
        # Check for the problematic duplicate pattern
        if line.strip() == "# Complete backup" and i > 540:
            # Skip this line and the next few lines that are duplicates
            skip_next = True
            continue
        
        fixed_lines.append(line)
    
    # Write back the fixed content
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(fixed_lines)
    
    print("✅ Fixed indentation error")

if __name__ == '__main__':
    fix_indentation()
