#!/usr/bin/env python
"""
Fix backup service issues
"""
import re

def fix_backup_service():
    file_path = r"c:\Users\salaam\Desktop\offchat-admin-nexus-main\admin_panel\services\backup_restore_service.py"
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix the file_size issue in users backup
    old_pattern = r"""                # Save backup file
                logger\.info\("Saving backup file to model\.\.\."\)
                with open\(zip_path, 'rb'\) as f:
                    backup\.file\.save\(f'\{safe_backup_name\}\.zip', ContentFile\(f\.read\(\)\)\)
                logger\.info\("Backup file saved to model"\)
                
                backup\.complete_backup\(file_size=file_size\)
                logger\.info\(f"Chats backup completed successfully\. Size: \{file_size\} bytes"\)"""
    
    new_pattern = """                # Save backup file
                logger.info("Saving backup file to model...")
                with open(zip_path, 'rb') as f:
                    backup.file.save(f'{safe_backup_name}.zip', ContentFile(f.read()))
                logger.info("Backup file saved to model")
                
                # Complete backup
                file_size = zip_path.stat().st_size
                backup.complete_backup(file_size=file_size)
                logger.info(f"Users backup completed successfully. Size: {file_size} bytes")"""
    
    if old_pattern in content:
        content = content.replace(old_pattern, new_pattern)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print("✅ Fixed backup service file_size issue")
        return True
    else:
        print("❌ Could not find the problematic pattern")
        return False

if __name__ == '__main__':
    fix_backup_service()
