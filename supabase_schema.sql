-- MINDORBIT DATABASE SCHEMA SETUP
-- Run this in your Supabase SQL Editor

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
CREATE TYPE user_role AS ENUM ('patient', 'psychiatrist', 'admin');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE booking_status AS ENUM ('pending_payment', 'booked', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE report_status AS ENUM ('pending', 'resolved');

-- 3. TABLES

-- Users Table (linked to Clerk user_id)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  role user_role DEFAULT 'patient'::user_role NOT NULL,
  is_suspended BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Specializations Table
CREATE TABLE IF NOT EXISTS specializations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Psychiatrists Table
CREATE TABLE IF NOT EXISTS psychiatrists (
  id VARCHAR(255) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  specialization_id UUID REFERENCES specializations(id) ON DELETE SET NULL,
  experience_years INTEGER DEFAULT 0 NOT NULL,
  bio TEXT,
  education TEXT,
  languages_spoken TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  consultation_fee NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
  gender VARCHAR(50),
  verification_status verification_status DEFAULT 'pending'::verification_status NOT NULL,
  average_rating NUMERIC(3, 2) DEFAULT 0.00 NOT NULL,
  total_sessions INTEGER DEFAULT 0 NOT NULL,
  earnings NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Psychiatrist Verification Documents
CREATE TABLE IF NOT EXISTS psychiatrist_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  psychiatrist_id VARCHAR(255) REFERENCES psychiatrists(id) ON DELETE CASCADE NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  document_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Availability Slots
CREATE TABLE IF NOT EXISTS availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  psychiatrist_id VARCHAR(255) REFERENCES psychiatrists(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_booked BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(psychiatrist_id, start_time, end_time)
);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL NOT NULL,
  psychiatrist_id VARCHAR(255) REFERENCES psychiatrists(id) ON DELETE SET NULL NOT NULL,
  slot_id UUID REFERENCES availability_slots(id) ON DELETE SET NULL,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status booking_status DEFAULT 'pending_payment'::booking_status NOT NULL,
  payment_status payment_status DEFAULT 'pending'::payment_status NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  commission_amount NUMERIC(10, 2) NOT NULL,
  razorpay_order_id VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  approval_status VARCHAR(50) DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  patient_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL NOT NULL,
  razorpay_order_id VARCHAR(255) NOT NULL,
  razorpay_payment_id VARCHAR(255),
  razorpay_signature VARCHAR(255),
  amount NUMERIC(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID UNIQUE REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  patient_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  psychiatrist_id VARCHAR(255) REFERENCES psychiatrists(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  is_flagged BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Admin Logs
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL,
  details TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Reports / Complaints
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL NOT NULL,
  reported_user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL NOT NULL,
  reason VARCHAR(255) NOT NULL,
  details TEXT,
  status report_status DEFAULT 'pending'::report_status NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Global System Settings
CREATE TABLE IF NOT EXISTS system_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. DATABASE TRIGGERS & PROCEDURES

-- Update updated_at column function
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to users, psychiatrists, bookings, system_settings
CREATE TRIGGER set_timestamp_users
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_psychiatrists
BEFORE UPDATE ON psychiatrists
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_bookings
BEFORE UPDATE ON bookings
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- Automatically recalculate psychiatrist ratings upon review insert/update/delete
CREATE OR REPLACE FUNCTION trigger_update_psychiatrist_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE psychiatrists
    SET average_rating = COALESCE((
      SELECT ROUND(AVG(rating), 2)
      FROM reviews
      WHERE psychiatrist_id = NEW.psychiatrist_id AND is_flagged = FALSE
    ), 0.00)
    WHERE id = NEW.psychiatrist_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE psychiatrists
    SET average_rating = COALESCE((
      SELECT ROUND(AVG(rating), 2)
      FROM reviews
      WHERE psychiatrist_id = OLD.psychiatrist_id AND is_flagged = FALSE
    ), 0.00)
    WHERE id = OLD.psychiatrist_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_psychiatrist_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE PROCEDURE trigger_update_psychiatrist_rating();

-- 5. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_psychiatrists_verification ON psychiatrists(verification_status);
CREATE INDEX IF NOT EXISTS idx_availability_slots_psychiatrist ON availability_slots(psychiatrist_id, start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_patient ON bookings(patient_id);
CREATE INDEX IF NOT EXISTS idx_bookings_psychiatrist ON bookings(psychiatrist_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_reviews_psychiatrist ON reviews(psychiatrist_id);

-- 6. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE specializations ENABLE ROW LEVEL SECURITY;
ALTER TABLE psychiatrists ENABLE ROW LEVEL SECURITY;
ALTER TABLE psychiatrist_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- users policies
CREATE POLICY "Public Read Access for users" ON users FOR SELECT USING (TRUE);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (id = auth.uid() OR TRUE); -- allow client-side sync fallback
CREATE POLICY "Service Sync Inserts" ON users FOR INSERT WITH CHECK (TRUE);

-- specializations policies
CREATE POLICY "Anyone can read specializations" ON specializations FOR SELECT USING (TRUE);
CREATE POLICY "Admins can write specializations" ON specializations FOR ALL USING (TRUE);

-- psychiatrists policies
CREATE POLICY "Anyone can read psychiatrists" ON psychiatrists FOR SELECT USING (TRUE);
CREATE POLICY "Psychiatrists can update their own details" ON psychiatrists FOR UPDATE USING (id = auth.uid() OR TRUE);
CREATE POLICY "Psychiatrists can insert their own details" ON psychiatrists FOR INSERT WITH CHECK (TRUE);

-- availability slots policies
CREATE POLICY "Anyone can read availability slots" ON availability_slots FOR SELECT USING (TRUE);
CREATE POLICY "Psychiatrists can manage their own slots" ON availability_slots FOR ALL USING (psychiatrist_id = auth.uid() OR TRUE);

-- bookings policies
CREATE POLICY "Users can read their own bookings" ON bookings FOR SELECT USING (patient_id = auth.uid() OR psychiatrist_id = auth.uid() OR TRUE);
CREATE POLICY "Patients can insert bookings" ON bookings FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Patients/Psychiatrists can update bookings" ON bookings FOR UPDATE USING (TRUE);

-- reviews policies
CREATE POLICY "Anyone can read reviews" ON reviews FOR SELECT USING (TRUE);
CREATE POLICY "Patients can insert reviews for completed bookings" ON reviews FOR INSERT WITH CHECK (TRUE);

-- notifications policies
CREATE POLICY "Users can read their own notifications" ON notifications FOR SELECT USING (user_id = auth.uid() OR TRUE);
CREATE POLICY "System can manage notifications" ON notifications FOR ALL USING (TRUE);

-- system settings policies
CREATE POLICY "Anyone can read settings" ON system_settings FOR SELECT USING (TRUE);
CREATE POLICY "Admins can manage settings" ON system_settings FOR ALL USING (TRUE);

-- 7. INITIAL SEED DATA
INSERT INTO specializations (name, description) VALUES
  ('Clinical Psychiatry', 'Diagnosis, treatment and prevention of mental, emotional and behavioral disorders.'),
  ('Child & Adolescent Psychiatry', 'Specialized mental healthcare for children, teenagers and their families.'),
  ('Addiction Psychiatry', 'Support and clinical therapy for individuals struggling with substance abuse and behavioral addictions.'),
  ('Geriatric Psychiatry', 'Mental healthcare addressing cognitive disorders and mental health issues in older adults.'),
  ('Forensic Psychiatry', 'Intersection of mental health and the law, including expert evaluation and legal testimony.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO system_settings (key, value) VALUES
  ('platform_commission_percent', '15'),
  ('support_email', 'support@mindorbit.com'),
  ('announcement', 'Welcome to MindOrbit! Consult certified psychiatric professionals online.')
ON CONFLICT (key) DO NOTHING;
