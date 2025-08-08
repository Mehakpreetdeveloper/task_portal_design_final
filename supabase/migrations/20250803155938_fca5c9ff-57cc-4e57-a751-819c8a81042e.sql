-- Create enum type for task status if it doesn't exist
DO $$ BEGIN
    CREATE TYPE task_status_enum AS ENUM ('todo', 'in_progress', 'in_review', 'done');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update the tasks table to use the enum and add the new status
ALTER TABLE tasks 
ALTER COLUMN status TYPE task_status_enum 
USING status::task_status_enum;

-- Update default value
ALTER TABLE tasks 
ALTER COLUMN status SET DEFAULT 'todo'::task_status_enum;