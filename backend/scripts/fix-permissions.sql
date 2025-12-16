-- Fix permissions for hirebit_user
-- Grant schema permissions
GRANT ALL ON SCHEMA public TO hirebit_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO hirebit_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO hirebit_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO hirebit_user;

-- Make user owner of the database
ALTER DATABASE hirebit OWNER TO hirebit_user;


