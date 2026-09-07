# Security Notes

* **Member-Default Signup**: All new signups via Supabase Auth now strictly default to the 'member' role in the database profile creation trigger. The role is no longer read from raw app or user metadata to prevent privilege escalation on signup.
