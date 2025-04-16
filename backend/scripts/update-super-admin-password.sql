-- Update super admin password
IF EXISTS (SELECT * FROM Users WHERE username = 'admin' AND role = 'super_admin')
BEGIN
    -- Update password for super admin user
    -- The password hash below is for 'password' using bcrypt with 10 rounds
    UPDATE Users
    SET 
        password = '$2b$10$5RwAGQTzFMXfnRqZDXAkCONXQFeqUz1KT0zPjZNpYBX9QQb0TpyAe',
        updatedAt = GETDATE()
    WHERE 
        username = 'admin' 
        AND role = 'super_admin';
    
    PRINT 'Super admin password updated successfully';
END
ELSE
BEGIN
    PRINT 'Super admin user not found';
END