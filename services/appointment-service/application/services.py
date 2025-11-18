# Domain Services
# Demonstrates: Domain Logic Encapsulation, Business Rules

from typing import List, Dict, Any
from datetime import date, time, datetime, timedelta
import logging

from domain.entities import Appointment, AppointmentStatus, TimeSlot
from domain.value_objects import DoctorId, PatientId

logger = logging.getLogger(__name__)

class AvailabilityService:
    """
    Domain Service for managing appointment availability
    Demonstrates: Domain Service Pattern, Business Logic Encapsulation
    """
    
    def __init__(self, appointment_repository):
        """
        Initialize with repository
        Note: Domain services can use repositories but remain focused on domain logic
        """
        self.appointment_repository = appointment_repository
    
    async def is_slot_available(
        self, 
        doctor_id: DoctorId, 
        appointment_date: date, 
        time_slot: TimeSlot
    ) -> bool:
        """
        Check if a specific time slot is available for a doctor
        Business Rule: No overlapping appointments
        """
        # Get all appointments for the doctor on that date
        existing_appointments = await self.appointment_repository.find_by_doctor_and_date(
            doctor_id, appointment_date
        )
        
        # Check for overlaps
        for appointment in existing_appointments:
            if appointment.status in [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED]:
                if time_slot.overlaps_with(appointment.time_slot):
                    logger.info(
                        f"Slot  {time_slot.start_time}-{time_slot.end_time}  overlaps with existing appointment"
                    )
                    return False
        
        return True
    
    async def get_available_slots(
        self,
        doctor_id: DoctorId,
        appointment_date: date,
        duration_minutes: int = 30
    ) -> List[TimeSlot]:
        """
        Get all available time slots for a doctor on a specific date
        Business Rules:
        - Working hours: 8:00 AM to 6:00 PM
        - Lunch break: 1:00 PM to 2:00 PM
        - Minimum slot duration: 15 minutes
        """
        available_slots = []
        
        # Define working hours
        working_start = time(8, 0)  # 8:00 AM
        lunch_start = time(13, 0)   # 1:00 PM
        lunch_end = time(14, 0)     # 2:00 PM
        working_end = time(18, 0)   # 6:00 PM
        
        # Get existing appointments
        existing_appointments = await self.appointment_repository.find_by_doctor_and_date(
            doctor_id, appointment_date
        )
        
        # Filter only scheduled/confirmed appointments
        booked_slots = [
            apt.time_slot for apt in existing_appointments
            if apt.status in [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED]
        ]
        
        # Generate possible slots
        current_time = working_start
        
        while current_time < working_end:
            # Calculate end time for this slot
            end_minutes = current_time.hour * 60 + current_time.minute + duration_minutes
            end_hour = end_minutes // 60
            end_minute = end_minutes % 60
            
            # Skip if goes beyond working hours
            if end_hour >= 18:
                break
            
            slot_end = time(end_hour, end_minute)
            
            # Skip lunch break
            if (current_time < lunch_end and slot_end > lunch_start):
                current_time = lunch_end
                continue
            
            # Create potential slot
            potential_slot = TimeSlot(current_time, slot_end)
            
            # Check if slot is available
            is_available = True
            for booked_slot in booked_slots:
                if potential_slot.overlaps_with(booked_slot):
                    is_available = False
                    break
            
            if is_available:
                available_slots.append(potential_slot)
            
            # Move to next slot (15-minute increments)
            next_minutes = current_time.hour * 60 + current_time.minute + 15
            current_time = time(next_minutes // 60, next_minutes % 60)
        
        return available_slots
    
    async def get_next_available_slot(
        self,
        doctor_id: DoctorId,
        starting_date: date,
        duration_minutes: int = 30,
        max_days_ahead: int = 30
    ) -> tuple[date, TimeSlot] | None:
        """
        Find the next available slot for a doctor
        """
        current_date = starting_date
        end_date = starting_date + timedelta(days=max_days_ahead)
        
        while current_date <= end_date:
            # Skip weekends
            if current_date.weekday() >= 5:  # Saturday = 5, Sunday = 6
                current_date = current_date + timedelta(days=1)
                continue
            
            available_slots = await self.get_available_slots(
                doctor_id, current_date, duration_minutes
            )
            
            if available_slots:
                return current_date, available_slots[0]
            
            current_date = current_date + timedelta(days=1)
        
        return None

class ValidationService:
    """
    Domain Service for validating appointments
    Demonstrates: Business Rules Validation, Specification Pattern
    """
    
    def validate_appointment_data(self, data: Dict[str, Any]) -> bool:
        """
        Validate appointment data structure and required fields
        """
        required_fields = ['patient_id', 'doctor_id', 'appointment_date', 'appointment_time']
        
        for field in required_fields:
            if field not in data or not data[field]:
                logger.error(f"Missing required field: {field}")
                return False
        
        '''# Validate date format
        try:
            date.fromisoformat(data['appointment_date'])
        except ValueError:
            logger.error(f"Invalid date format: {data['appointment_date']}")
            return False
        
        # Validate time format
        try:
            time.fromisoformat(data['appointment_time'])
        except ValueError:
            logger.error(f"Invalid time format: {data['appointment_time']}")
            return False
        
        return True
        '''
        # Validate date format
        try:
            appointment_date = data['appointment_date']
            if isinstance(appointment_date, str):
                date.fromisoformat(appointment_date)
            elif not isinstance(appointment_date, date):
                logger.error(f"Invalid date type: {type(appointment_date)}")
                return False
        except ValueError:
            logger.error(f"Invalid date format: {data['appointment_date']}")
            return False

        # Validate time format
        try:
            appointment_time = data['appointment_time']
            if isinstance(appointment_time, str):
                time.fromisoformat(appointment_time)
            elif not isinstance(appointment_time, time):
                logger.error(f"Invalid time type: {type(appointment_time)}")
                return False
        except ValueError:
            logger.error(f"Invalid time format: {data['appointment_time']}")
            return False
        return True
    
    def validate_business_rules(self, appointment: Appointment) -> bool:
        """
        Validate appointment against business rules
        Business Rules:
        1. Cannot book appointments in the past
        2. Cannot book more than 90 days in advance
        3. Appointments must be during working hours
        4. Minimum appointment duration is 15 minutes
        """
        
        # Rule 1: No past appointments
        if appointment.appointment_date < date.today():
            logger.error("Cannot book appointments in the past")
            return False
        
        # Rule 2: Maximum 90 days in advance
        max_date = date.today() + timedelta(days=90)
        if appointment.appointment_date > max_date:
            logger.error("Cannot book appointments more than 90 days in advance")
            return False
        
        # Rule 3: Working hours only (8 AM to 6 PM)
        if appointment.time_slot.start_time < time(8, 0) or \
           appointment.time_slot.end_time > time(18, 0):
            logger.error("Appointments must be during working hours (8 AM to 6 PM)")
            return False
        
        # Rule 4: Minimum duration
        if appointment.time_slot.duration_minutes < 15:
            logger.error("Minimum appointment duration is 15 minutes")
            return False
        
        # Rule 5: No appointments on weekends
        if appointment.appointment_date.weekday() >= 5:
            logger.error("No appointments on weekends")
            return False
        
        return True
    
    def validate_cancellation(self, appointment: Appointment) -> bool:
        """
        Validate if an appointment can be cancelled
        Business Rule: Cannot cancel appointments less than 2 hours before
        """
        appointment_datetime = datetime.combine(
            appointment.appointment_date,
            appointment.time_slot.start_time
        )
        
        min_cancellation_time = appointment_datetime - timedelta(hours=2)
        
        if datetime.now() > min_cancellation_time:
            logger.error("Cannot cancel appointments less than 2 hours before")
            return False
        
        if appointment.status in [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED]:
            logger.error(f"Cannot cancel appointment with status: {appointment.status}")
            return False
        
        return True
    
    def validate_reschedule(
        self, 
        appointment: Appointment, 
        new_date: date, 
        new_time_slot: TimeSlot
    ) -> bool:
        """
        Validate if an appointment can be rescheduled
        Business Rules:
        1. Cannot reschedule completed or cancelled appointments
        2. Cannot reschedule less than 4 hours before
        3. New date must follow all booking rules
        """
        
        # Rule 1: Check status
        if appointment.status in [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED]:
            logger.error(f"Cannot reschedule appointment with status: {appointment.status}")
            return False
        
        # Rule 2: Minimum notice for reschedule
        appointment_datetime = datetime.combine(
            appointment.appointment_date,
            appointment.time_slot.start_time
        )
        
        min_reschedule_time = appointment_datetime - timedelta(hours=4)
        
        if datetime.now() > min_reschedule_time:
            logger.error("Cannot reschedule appointments less than 4 hours before")
            return False
        
        # Rule 3: Validate new appointment details
        temp_appointment = Appointment(
            id=appointment.id,
            patient_id=appointment.patient_id,
            doctor_id=appointment.doctor_id,
            appointment_date=new_date,
            time_slot=new_time_slot,
            status=appointment.status,
            reason=appointment.reason,
            notes=appointment.notes
        )
        
        return self.validate_business_rules(temp_appointment)

class ConflictResolutionService:
    """
    Domain Service for handling appointment conflicts
    Demonstrates: Strategy Pattern for conflict resolution
    """
    
    def __init__(self, appointment_repository):
        self.appointment_repository = appointment_repository
    
    async def detect_conflicts(
        self,
        doctor_id: DoctorId,
        appointment_date: date,
        time_slot: TimeSlot,
        exclude_appointment_id: str = None
    ) -> List[Appointment]:
        """
        Detect conflicting appointments
        """
        appointments = await self.appointment_repository.find_by_doctor_and_date(
            doctor_id, appointment_date
        )
        
        conflicts = []
        for apt in appointments:
            # Skip if it's the same appointment being updated
            if exclude_appointment_id and str(apt.id) == exclude_appointment_id:
                continue
            
            # Check for active appointments only
            if apt.status in [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED]:
                if time_slot.overlaps_with(apt.time_slot):
                    conflicts.append(apt)
        
        return conflicts
    
    async def resolve_double_booking(
        self,
        conflict_appointments: List[Appointment],
        priority_rules: Dict[str, Any] = None
    ) -> Appointment:
        """
        Resolve double booking conflicts based on priority rules
        Default: First confirmed, then first created
        """
        if not conflict_appointments:
            return None
        
        # Sort by priority
        # 1. Confirmed appointments have priority
        # 2. Earlier created appointments have priority
        sorted_appointments = sorted(
            conflict_appointments,
            key=lambda x: (
                x.status != AppointmentStatus.CONFIRMED,
                x.created_at
            )
        )
        
        return sorted_appointments[0]

class ReminderService:
    """
    Domain Service for appointment reminders
    Demonstrates: Business Logic for notifications
    """
    
    def __init__(self, appointment_repository, notification_service):
        self.appointment_repository = appointment_repository
        self.notification_service = notification_service
    
    async def get_appointments_needing_reminder(
        self,
        hours_before: int = 24
    ) -> List[Appointment]:
        """
        Get appointments that need reminders
        """
        reminder_time = datetime.now() + timedelta(hours=hours_before)
        reminder_date = reminder_time.date()
        
        # This would need a more sophisticated query in real implementation
        # For now, simplified logic
        appointments = []
        
        # Would query appointments for the specific date/time range
        # that haven't been reminded yet
        
        return appointments
    
    def should_send_reminder(self, appointment: Appointment) -> bool:
        """
        Determine if a reminder should be sent
        Business Rules:
        1. Only for scheduled or confirmed appointments
        2. Not for past appointments
        3. Patient has contact information
        """
        
        if appointment.status not in [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED]:
            return False
        
        if appointment.appointment_date < date.today():
            return False
        
        # Additional checks would go here
        # - Check if reminder already sent
        # - Check patient preferences
        # - Check quiet hours
        
        return True

class WaitlistService:
    """
    Domain Service for managing appointment waitlist
    Demonstrates: Complex domain logic
    """
    
    def __init__(self, appointment_repository):
        self.appointment_repository = appointment_repository
        self.waitlist = []  # In real implementation, this would be persisted
    
    async def add_to_waitlist(
        self,
        patient_id: PatientId,
        doctor_id: DoctorId,
        preferred_dates: List[date],
        preferred_times: List[TimeSlot]
    ) -> str:
        """
        Add patient to waitlist for appointments
        """
        waitlist_entry = {
            'id': str(datetime.now().timestamp()),
            'patient_id': patient_id,
            'doctor_id': doctor_id,
            'preferred_dates': preferred_dates,
            'preferred_times': preferred_times,
            'created_at': datetime.now()
        }
        
        self.waitlist.append(waitlist_entry)
        return waitlist_entry['id']
    
    async def check_waitlist_for_slot(
        self,
        doctor_id: DoctorId,
        appointment_date: date,
        time_slot: TimeSlot
    ) -> List[Dict[str, Any]]:
        """
        Check if anyone on waitlist wants this slot
        """
        matches = []
        
        for entry in self.waitlist:
            if entry['doctor_id'] != doctor_id:
                continue
            
            if appointment_date in entry['preferred_dates']:
                for preferred_slot in entry['preferred_times']:
                    if time_slot.overlaps_with(preferred_slot):
                        matches.append(entry)
                        break
        
        # Sort by creation time (first come, first served)
        matches.sort(key=lambda x: x['created_at'])
        
        return matches
