-- Create user_status table to store status information
CREATE TABLE public.user_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'busy', 'on_leave', 'offline')),
  status_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_status ENABLE ROW LEVEL SECURITY;

-- Create policies for user status
CREATE POLICY "Users can view all user statuses" 
ON public.user_status 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own status" 
ON public.user_status 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own status" 
ON public.user_status 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_status_updated_at
BEFORE UPDATE ON public.user_status
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();