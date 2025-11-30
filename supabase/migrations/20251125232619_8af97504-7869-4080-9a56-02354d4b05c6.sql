-- Add ai_enabled column to whatsapp_messages to track if AI is enabled for each conversation
ALTER TABLE whatsapp_messages 
ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN DEFAULT true;