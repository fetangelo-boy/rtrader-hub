UPDATE t_p67093308_rtrader_hub.admin_users 
SET password_hash = encode(sha256(('Admin2024!')::bytea), 'hex')
WHERE username = 'admin';