-- Add must_change_password flag to profiles
-- When true, the user must change their password before accessing the system
ALTER TABLE profiles ADD COLUMN must_change_password BOOLEAN NOT NULL DEFAULT false;
