-- Add support for multiple payment methods in orders
ALTER TABLE orders 
ADD COLUMN payment_methods jsonb DEFAULT NULL,
ADD COLUMN payment_amounts jsonb DEFAULT NULL;

COMMENT ON COLUMN orders.payment_methods IS 'Array of payment method names when multiple payments are used: ["Pix", "Crédito"]';
COMMENT ON COLUMN orders.payment_amounts IS 'Array of amounts for each payment method: [50.00, 30.00]';

-- Add card_machine_ids for multiple card machines when multiple card payments
ALTER TABLE orders
ADD COLUMN card_machine_ids jsonb DEFAULT NULL;

COMMENT ON COLUMN orders.card_machine_ids IS 'Array of card machine IDs when multiple card payments are used';