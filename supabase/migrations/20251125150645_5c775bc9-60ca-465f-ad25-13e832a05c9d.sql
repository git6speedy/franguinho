-- Add whatsapp_ai_instructions field to stores table
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS whatsapp_ai_instructions TEXT;