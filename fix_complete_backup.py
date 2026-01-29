#!/usr/bin/env python
"""
Fix complete backup method in backup_restore_service.py
"""

def fix_complete_backup():
    file_path = r"c:\Users\salaam\Desktop\offchat-admin-nexus-main\admin_panel\services\backup_restore_service.py"
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find the problematic section and replace it with correct structure
    old_pattern = """                backup.complete_backup(file_size=file_size)
                logger.info(f"Chats backup completed successfully. Size: {file_size} bytes")
                
        except Exception as e:
            logger.error(f"Error in chats backup creation: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise
                
                
        except Exception as e:
            logger.error(f"Error in full backup creation: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise"""
    
    new_pattern = """                backup.complete_backup(file_size=file_size)
                logger.info(f"Chats backup completed successfully. Size: {file_size} bytes")
                
        except Exception as e:
            logger.error(f"Error in chats backup creation: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise"""
    
    if old_pattern in content:
        content = content.replace(old_pattern, new_pattern)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print("✅ Fixed complete backup method")
        return True
    else:
        print("❌ Could not find the problematic pattern")
        return False

if __name__ == '__main__':
    fix_complete_backup()
