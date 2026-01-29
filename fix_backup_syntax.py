#!/usr/bin/env python
"""
Fix syntax error in backup_restore_service.py
"""

def fix_backup_syntax():
    file_path = r"c:\Users\salaam\Desktop\offchat-admin-nexus-main\admin_panel\services\backup_restore_service.py"
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find the problematic section and fix it
    old_code = """                # Save backup file
                logger.info("Saving backup file to model...")
                with open(zip_path, 'rb') as f:
                    backup.file.save(f'{safe_backup_name}.zip', ContentFile(f.read()))
                logger.info("Backup file saved to model")"""
    
    new_code = """                # Save backup file
                logger.info("Saving backup file to model...")
                with open(zip_path, 'rb') as f:
                    backup.file.save(f'{safe_backup_name}.zip', ContentFile(f.read()))
                logger.info("Backup file saved to model")
                
                # Complete backup
                file_size = zip_path.stat().st_size
                backup.complete_backup(file_size=file_size)
                logger.info(f"Chats backup completed successfully. Size: {file_size} bytes")
                
        except Exception as e:
            logger.error(f"Error in chats backup creation: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise"""
    
    if old_code in content:
        content = content.replace(old_code, new_code)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print("✅ Fixed backup syntax error")
        return True
    else:
        print("❌ Could not find the problematic code section")
        return False

if __name__ == '__main__':
    fix_backup_syntax()
