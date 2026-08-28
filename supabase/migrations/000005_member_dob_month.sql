ALTER TABLE members ADD COLUMN dob_month INTEGER GENERATED ALWAYS AS (EXTRACT(MONTH FROM dob)) STORED;
CREATE INDEX idx_members_dob_month ON members(dob_month);
