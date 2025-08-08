-- First drop the default constraint
ALTER TABLE tasks ALTER COLUMN status DROP DEFAULT;

-- Create enum type for task status
DO $$ BEGIN
    CREATE TYPE task_status_enum AS ENUM ('todo', 'in_progress', 'in_review', 'done');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update the tasks table to use the enum
ALTER TABLE tasks 
ALTER COLUMN status TYPE task_status_enum 
USING status::task_status_enum;

-- Set the new default value
ALTER TABLE tasks 
ALTER COLUMN status SET DEFAULT 'todo'::task_status_enum;