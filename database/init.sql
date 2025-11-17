-- Database initialization script for Appointment System
-- This script demonstrates proper database design with foreign keys and constraints

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types for better data integrity
CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'cancelled', 'completed', 'no_show');
CREATE TYPE notification_channel AS ENUM ('email', 'sms', 'telegram', 'whatsapp');
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed', 'cancelled');

-- Table: Patients
-- Stores patient information
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    telegram_id VARCHAR(100) UNIQUE,
    telegram_username VARCHAR(100),
    date_of_birth DATE,
    address TEXT,
    medical_history JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: Doctors
-- Stores doctor information
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    specialty VARCHAR(100) NOT NULL,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    available_days JSONB DEFAULT '[]', -- Array of days: ["Monday", "Tuesday", ...]
    available_hours JSONB DEFAULT '{}', -- {"start": "09:00", "end": "17:00"}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: Appointments
-- Stores appointment details
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    status appointment_status DEFAULT 'scheduled',
    reason TEXT,
    notes TEXT,
    diagnosis JSONB DEFAULT '{}',
    prescription JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    -- Ensure no double booking for doctors
    CONSTRAINT unique_doctor_appointment UNIQUE(doctor_id, appointment_date, appointment_time)
);

-- Table: Notifications
-- Stores notification history
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'reminder', 'confirmation', 'cancellation', etc.
    channel notification_channel NOT NULL,
    status notification_status DEFAULT 'pending',
    recipient VARCHAR(255) NOT NULL, -- email, phone, or telegram_id
    subject VARCHAR(255),
    content TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: Appointment History (for audit trail)
CREATE TABLE IF NOT EXISTS appointment_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'cancelled', etc.
    old_values JSONB,
    new_values JSONB,
    performed_by VARCHAR(255),
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: System Settings
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(255) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_date_time ON appointments(appointment_date, appointment_time);
CREATE INDEX idx_notifications_appointment_id ON notifications(appointment_id);
CREATE INDEX idx_notifications_patient_id ON notifications(patient_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_patients_telegram_id ON patients(telegram_id);
CREATE INDEX idx_patients_email ON patients(email);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to auto-update updated_at
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to log appointment changes
CREATE OR REPLACE FUNCTION log_appointment_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO appointment_history(appointment_id, action, new_values)
        VALUES (NEW.id, 'created', row_to_json(NEW));
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO appointment_history(appointment_id, action, old_values, new_values)
        VALUES (NEW.id, 'updated', row_to_json(OLD), row_to_json(NEW));
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO appointment_history(appointment_id, action, old_values)
        VALUES (OLD.id, 'deleted', row_to_json(OLD));
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for appointment history
CREATE TRIGGER appointment_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON appointments
    FOR EACH ROW EXECUTE FUNCTION log_appointment_changes();

-- Insert sample data for testing
INSERT INTO doctors (name, email, phone, specialty, license_number, available_days, available_hours)
VALUES 
    ('Dr. Juan Pérez', 'juan.perez@clinic.com', '+521234567890', 'General Medicine', 'LIC-001', 
     '["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]', 
     '{"start": "09:00", "end": "17:00"}'),
    ('Dra. María García', 'maria.garcia@clinic.com', '+521234567891', 'Pediatrics', 'LIC-002',
     '["Monday", "Wednesday", "Friday"]',
     '{"start": "10:00", "end": "18:00"}'),
    ('Dr. Carlos López', 'carlos.lopez@clinic.com', '+521234567892', 'Cardiology', 'LIC-003',
     '["Tuesday", "Thursday"]',
     '{"start": "08:00", "end": "14:00"}');

-- Insert default system settings
INSERT INTO system_settings (key, value, description)
VALUES 
    ('appointment_duration_default', '30', 'Default appointment duration in minutes'),
    ('appointment_reminder_hours', '24', 'Hours before appointment to send reminder'),
    ('max_appointments_per_day', '20', 'Maximum appointments per doctor per day'),
    ('booking_advance_days', '30', 'Days in advance that appointments can be booked'),
    ('working_hours', '{"start": "08:00", "end": "20:00"}', 'Clinic working hours');

-- Create view for available appointment slots
CREATE OR REPLACE VIEW available_slots AS
SELECT 
    d.id as doctor_id,
    d.name as doctor_name,
    d.specialty,
    generate_series(
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '30 days',
        INTERVAL '1 day'
    )::date as available_date
FROM doctors d
WHERE d.available_days IS NOT NULL;

-- Create view for upcoming appointments
CREATE OR REPLACE VIEW upcoming_appointments AS
SELECT 
    a.id,
    a.appointment_date,
    a.appointment_time,
    a.status,
    p.name as patient_name,
    p.telegram_id,
    d.name as doctor_name,
    d.specialty
FROM appointments a
JOIN patients p ON a.patient_id = p.id
JOIN doctors d ON a.doctor_id = d.id
WHERE a.appointment_date >= CURRENT_DATE
    AND a.status IN ('scheduled', 'confirmed')
ORDER BY a.appointment_date, a.appointment_time;

-- Grant permissions (adjust based on your needs)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO appointment_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO appointment_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO appointment_user;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database initialization completed successfully!';
END $$;
