-- Add image_url column to game_plans table
ALTER TABLE game_plans 
ADD COLUMN image_url TEXT NULL;

-- Optional: Add a comment to document the column
COMMENT ON COLUMN game_plans.image_url IS 'URL or path to the plan reward image';
