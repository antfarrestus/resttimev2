-- First, check if super admin already exists
IF NOT EXISTS (SELECT * FROM Users WHERE username = 'admin' AND role = 'super_admin')
BEGIN
    -- Insert super admin user with bcrypt hashed password
    -- The password hash below is for 'password' using bcrypt with 10 rounds
    INSERT INTO Users (username, password, role, active, companyId, createdAt, updatedAt)
    VALUES (
        'admin',
        '$2b$10$5RwAGQTzFMXfnRqZDXAkCONXQFeqUz1KT0zPjZNpYBX9QQb0TpyAe',
        'super_admin',
        1,  -- active = true
        NULL,  -- super_admin is not associated with any company
        GETDATE(),
        GETDATE()
    );
    
    PRINT 'Super admin user created successfully';
END
ELSE
BEGIN
    PRINT 'Super admin user already exists';
END