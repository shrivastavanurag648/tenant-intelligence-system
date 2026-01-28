-- Tenant Intelligence System Database Schema
-- SQLite database schema for complaints, evidence, and status history

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Complaints table - stores all tenant complaints
CREATE TABLE IF NOT EXISTS complaints (
  id TEXT PRIMARY KEY,
  building_address TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Safety', 'Maintenance', 'Sanitation', 'Utilities')),
  status TEXT NOT NULL DEFAULT 'Reported' CHECK (status IN ('Reported', 'Under Review', 'Resolved', 'Dismissed')),
  image_url TEXT,
  upvotes INTEGER NOT NULL DEFAULT 0,
  landlord_name TEXT,
  landlord_contact TEXT,
  ai_category TEXT CHECK (ai_category IN ('Safety', 'Maintenance', 'Sanitation', 'Utilities')),
  ai_confidence REAL,
  user_confirmed_category INTEGER DEFAULT 0 CHECK (user_confirmed_category IN (0, 1)),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Evidence table - stores supporting evidence for complaints
CREATE TABLE IF NOT EXISTS evidence (
  id TEXT PRIMARY KEY,
  complaint_id TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
);

-- Status history table - tracks all status changes for complaints
CREATE TABLE IF NOT EXISTS status_history (
  id TEXT PRIMARY KEY,
  complaint_id TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL CHECK (new_status IN ('Reported', 'Under Review', 'Resolved', 'Dismissed')),
  notes TEXT,
  changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
);

-- Upvotes table - tracks individual upvotes with session deduplication
CREATE TABLE IF NOT EXISTS upvotes (
  id TEXT PRIMARY KEY,
  complaint_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  ip_address TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
  UNIQUE(complaint_id, session_id)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_complaints_building_address ON complaints(building_address);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON complaints(category);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_landlord_name ON complaints(landlord_name);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at);
CREATE INDEX IF NOT EXISTS idx_evidence_complaint_id ON evidence(complaint_id);
CREATE INDEX IF NOT EXISTS idx_status_history_complaint_id ON status_history(complaint_id);
CREATE INDEX IF NOT EXISTS idx_upvotes_complaint_id ON upvotes(complaint_id);
CREATE INDEX IF NOT EXISTS idx_upvotes_session_id ON upvotes(session_id);

-- Trigger to automatically update the updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_complaints_timestamp 
  AFTER UPDATE ON complaints
  FOR EACH ROW
  BEGIN
    UPDATE complaints SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

-- Trigger to automatically create status history entry when complaint status changes
CREATE TRIGGER IF NOT EXISTS create_status_history
  AFTER UPDATE OF status ON complaints
  FOR EACH ROW
  WHEN OLD.status != NEW.status
  BEGIN
    INSERT INTO status_history (id, complaint_id, old_status, new_status, changed_at)
    VALUES (
      lower(hex(randomblob(16))),
      NEW.id,
      OLD.status,
      NEW.status,
      CURRENT_TIMESTAMP
    );
  END;

-- Trigger to create initial status history entry when complaint is created
CREATE TRIGGER IF NOT EXISTS create_initial_status_history
  AFTER INSERT ON complaints
  FOR EACH ROW
  BEGIN
    INSERT INTO status_history (id, complaint_id, old_status, new_status, changed_at)
    VALUES (
      lower(hex(randomblob(16))),
      NEW.id,
      NULL,
      NEW.status,
      CURRENT_TIMESTAMP
    );
  END;

-- Trigger to update upvotes count when upvote is added
CREATE TRIGGER IF NOT EXISTS update_upvotes_count_insert
  AFTER INSERT ON upvotes
  FOR EACH ROW
  BEGIN
    UPDATE complaints 
    SET upvotes = (SELECT COUNT(*) FROM upvotes WHERE complaint_id = NEW.complaint_id)
    WHERE id = NEW.complaint_id;
  END;

-- Trigger to update upvotes count when upvote is removed
CREATE TRIGGER IF NOT EXISTS update_upvotes_count_delete
  AFTER DELETE ON upvotes
  FOR EACH ROW
  BEGIN
    UPDATE complaints 
    SET upvotes = (SELECT COUNT(*) FROM upvotes WHERE complaint_id = OLD.complaint_id)
    WHERE id = OLD.complaint_id;
  END;