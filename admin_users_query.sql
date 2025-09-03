-- ALL-IN-ONE ADMIN & SUBADMIN INFORMATION QUERY
-- Simple query that works with the actual table structure

SELECT 
    ROW_NUMBER() OVER (ORDER BY 
        CASE role 
            WHEN 'main_admin' THEN 1
            WHEN 'admin' THEN 2
            WHEN 'subadmin' THEN 3
            WHEN 'sub_admin' THEN 3
            ELSE 4
        END, username) as "Sr#",
    
    -- Basic Information (known to exist from pgAdmin screenshot)
    username as "Username",
    email as "Email Address", 
    UPPER(role) as "Role"

FROM users 

WHERE role LIKE '%admin%'
   OR role IN ('main_admin', 'admin', 'subadmin', 'sub_admin')

ORDER BY 
    CASE role 
        WHEN 'main_admin' THEN 1
        WHEN 'admin' THEN 2
        WHEN 'subadmin' THEN 3
        WHEN 'sub_admin' THEN 3
        ELSE 4
    END,
    username;
