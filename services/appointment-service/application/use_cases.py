# Application Use Cases
# Demonstrates: Clean Architecture, Use Case Pattern, Dependency Injection

from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from datetime import datetime, date, time
import logging

from domain.entities import (
    Appointment, 
    AppointmentStatus, 
    AppointmentId,
    PatientId,
    DoctorId,
    TimeSlot
)
from domain.value_objects import Email, Phone, TelegramId

logger = logging.getLogger(__name__)

# Abstract Repository Interface (Dependency Inversion Principle)
class IAppointmentRepository(ABC):
    """
    Repository interface for appointments
    Demonstrates: Interface Segregation, Dependency Inversion
    """
    
    @abstractmethod
    async def save(self, appointment: Appointment) -> Appointment:
        """Save an appointment"""
        pass
    
    @abstractmethod
    async def find_by_id(self, appointment_id: AppointmentId) -> Optional[Appointment]:
        """Find appointment by ID"""
        pass
    
    @abstractmethod
    async def find_by_patient(self, patient_id: PatientId) -> List[Appointment]:
        """Find all appointments for a patient"""
        pass
    
    @abstractmethod
    async def find_by_doctor_and_date(
        self, 
        doctor_id: DoctorId, 
        appointment_date: date
    ) -> List[Appointment]:
        """Find appointments for a doctor on a specific date"""
        pass
    
    @abstractmethod
    async def update(self, appointment: Appointment) -> Appointment:
        """Update an appointment"""
        pass
    
    @abstractmethod
    async def delete(self, appointment_id: AppointmentId) -> bool:
        """Delete an appointment"""
        pass

# Event Publisher Interface
class IEventPublisher(ABC):
    """
    Event publisher interface
    Demonstrates: Observer Pattern abstraction
    """
    
    @abstractmethod
    async def publish(self, event_type: str, data: Dict[str, Any]) -> None:
        """Publish an event"""
        pass

# Domain Service Interfaces
class IAvailabilityService(ABC):
    """Service for checking availability"""
    
    @abstractmethod
    async def is_slot_available(
        self, 
        doctor_id: DoctorId, 
        date: date, 
        time_slot: TimeSlot
    ) -> bool:
        """Check if a time slot is available"""
        pass
    
    @abstractmethod
    async def get_available_slots(
        self,
        doctor_id: DoctorId,
        date: date,
        duration_minutes: int
    ) -> List[TimeSlot]:
        """Get all available slots for a doctor on a date"""
        pass

class IValidationService(ABC):
    """Service for validations"""
    
    @abstractmethod
    def validate_appointment_data(self, data: Dict[str, Any]) -> bool:
        """Validate appointment data"""
        pass
    
    @abstractmethod
    def validate_business_rules(self, appointment: Appointment) -> bool:
        """Validate business rules"""
        pass

# Use Case: Create Appointment
class CreateAppointmentUseCase:
    """
    Use Case for creating appointments
    Demonstrates: Single Responsibility, Dependency Injection
    """
    
    def __init__(
        self,
        repository: IAppointmentRepository,
        availability_service: IAvailabilityService,
        validation_service: IValidationService,
        event_publisher: IEventPublisher
    ):
        self.repository = repository
        self.availability_service = availability_service
        self.validation_service = validation_service
        self.event_publisher = event_publisher
    
    async def execute(self, data: Dict[str, Any]) -> Appointment:
        """
        Create a new appointment
        Orchestrates the business logic
        """
        logger.info(f"Creating appointment with data: {data}")
        
        # Step 1: Validate input data
        if not self.validation_service.validate_appointment_data(data):
            raise ValueError("Invalid appointment data")
        
        # Step 2: Create domain entities
        appointment_id = AppointmentId("")  # Will auto-generate
        patient_id = PatientId(data['patient_id'])
        doctor_id = DoctorId(data['doctor_id'])
        appointment_date = date.fromisoformat(data['appointment_date'])
        
        start_time = time.fromisoformat(data['appointment_time'])
        duration = data.get('duration_minutes', 30)
        end_time = time(
            hour=(start_time.hour + duration // 60) % 24,
            minute=(start_time.minute + duration % 60) % 60
        )
        time_slot = TimeSlot(start_time, end_time)
        
        # Step 3: Check availability
        is_available = await self.availability_service.is_slot_available(
            doctor_id, appointment_date, time_slot
        )
        
        if not is_available:
            raise ValueError("Time slot is not available")
        
        # Step 4: Create appointment entity
        appointment = Appointment(
            id=appointment_id,
            patient_id=patient_id,
            doctor_id=doctor_id,
            appointment_date=appointment_date,
            time_slot=time_slot,
            status=AppointmentStatus.SCHEDULED,
            reason=data.get('reason'),
            notes=data.get('notes')
        )
        
        # Step 5: Validate business rules
        if not self.validation_service.validate_business_rules(appointment):
            raise ValueError("Business rules validation failed")
        
        # Step 6: Save to repository
        saved_appointment = await self.repository.save(appointment)
        
        # Step 7: Publish event
        await self.event_publisher.publish(
            'appointment.created',
            saved_appointment.to_dict()
        )
        
        logger.info(f"Appointment created successfully: {saved_appointment.id}")
        return saved_appointment

# Use Case: Update Appointment
class UpdateAppointmentUseCase:
    """
    Use Case for updating appointments
    Demonstrates: Command Pattern
    """
    
    def __init__(
        self,
        repository: IAppointmentRepository,
        validation_service: IValidationService,
        event_publisher: IEventPublisher
    ):
        self.repository = repository
        self.validation_service = validation_service
        self.event_publisher = event_publisher
    
    async def execute(
        self, 
        appointment_id: str, 
        updates: Dict[str, Any]
    ) -> Optional[Appointment]:
        """Update an existing appointment"""
        logger.info(f"Updating appointment {appointment_id}")
        
        # Step 1: Find existing appointment
        appointment = await self.repository.find_by_id(
            AppointmentId(appointment_id)
        )
        
        if not appointment:
            logger.warning(f"Appointment not found: {appointment_id}")
            return None
        
        # Step 2: Apply updates
        if 'status' in updates:
            new_status = AppointmentStatus(updates['status'])
            appointment.update_status(new_status)
        
        if 'appointment_date' in updates or 'appointment_time' in updates:
            new_date = date.fromisoformat(updates.get(
                'appointment_date', 
                appointment.appointment_date.isoformat()
            ))
            
            if 'appointment_time' in updates:
                start_time = time.fromisoformat(updates['appointment_time'])
                duration = updates.get('duration_minutes', 30)
                end_time = time(
                    hour=(start_time.hour + duration // 60) % 24,
                    minute=(start_time.minute + duration % 60) % 60
                )
                new_time_slot = TimeSlot(start_time, end_time)
            else:
                new_time_slot = appointment.time_slot
            
            appointment.reschedule(new_date, new_time_slot)
        
        if 'notes' in updates:
            appointment.notes = updates['notes']
        
        # Step 3: Validate updated appointment
        if not self.validation_service.validate_business_rules(appointment):
            raise ValueError("Updated appointment violates business rules")
        
        # Step 4: Save changes
        updated_appointment = await self.repository.update(appointment)
        
        # Step 5: Publish event
        await self.event_publisher.publish(
            'appointment.updated',
            {
                'appointment_id': str(appointment_id),
                'updates': updates
            }
        )
        
        logger.info(f"Appointment updated successfully: {appointment_id}")
        return updated_appointment

# Use Case: Cancel Appointment
class CancelAppointmentUseCase:
    """
    Use Case for cancelling appointments
    """
    
    def __init__(
        self,
        repository: IAppointmentRepository,
        event_publisher: IEventPublisher
    ):
        self.repository = repository
        self.event_publisher = event_publisher
    
    async def execute(
        self, 
        appointment_id: str, 
        cancellation_reason: Optional[str] = None
    ) -> bool:
        """Cancel an appointment"""
        logger.info(f"Cancelling appointment {appointment_id}")
        
        # Step 1: Find appointment
        appointment = await self.repository.find_by_id(
            AppointmentId(appointment_id)
        )
        
        if not appointment:
            logger.warning(f"Appointment not found: {appointment_id}")
            return False
        
        # Step 2: Cancel the appointment
        reason = cancellation_reason or "Cancelled by user"
        appointment.cancel(reason)
        
        # Step 3: Save changes
        await self.repository.update(appointment)
        
        # Step 4: Publish event
        await self.event_publisher.publish(
            'appointment.cancelled',
            {
                'appointment_id': str(appointment_id),
                'reason': reason,
                'cancelled_at': appointment.cancelled_at.isoformat()
            }
        )
        
        logger.info(f"Appointment cancelled successfully: {appointment_id}")
        return True

# Use Case: Get Appointment
class GetAppointmentUseCase:
    """
    Use Case for retrieving a single appointment
    """
    
    def __init__(self, repository: IAppointmentRepository):
        self.repository = repository
    
    async def execute(self, appointment_id: str) -> Optional[Appointment]:
        """Get appointment by ID"""
        return await self.repository.find_by_id(
            AppointmentId(appointment_id)
        )

# Use Case: List Appointments
class ListAppointmentsUseCase:
    """
    Use Case for listing appointments with filters
    Demonstrates: Query Object Pattern
    """
    
    def __init__(self, repository: IAppointmentRepository):
        self.repository = repository
    
    async def execute(
        self,
        filters: Dict[str, Any],
        page: int = 1,
        page_size: int = 20
    ) -> List[Appointment]:
        """List appointments with filters"""
        appointments = []
        
        # Apply filters based on what's provided
        if 'patient_id' in filters and filters['patient_id']:
            appointments = await self.repository.find_by_patient(
                PatientId(filters['patient_id'])
            )
        elif 'doctor_id' in filters and filters['doctor_id']:
            # For simplicity, we'll need to add this method to repository
            # This demonstrates how use cases orchestrate repository calls
            if 'date' in filters and filters['date']:
                appointments = await self.repository.find_by_doctor_and_date(
                    DoctorId(filters['doctor_id']),
                    filters['date']
                )
        
        # Apply status filter if provided
        if 'status' in filters and filters['status']:
            status = AppointmentStatus(filters['status'])
            appointments = [
                apt for apt in appointments 
                if apt.status == status
            ]
        
        # Apply date range filter
        if 'date_from' in filters and filters['date_from']:
            appointments = [
                apt for apt in appointments
                if apt.appointment_date >= filters['date_from']
            ]
        
        if 'date_to' in filters and filters['date_to']:
            appointments = [
                apt for apt in appointments
                if apt.appointment_date <= filters['date_to']
            ]
        
        # Apply pagination
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        
        return appointments[start_idx:end_idx]

# Use Case: Confirm Appointment
class ConfirmAppointmentUseCase:
    """
    Use Case for confirming appointments
    """
    
    def __init__(
        self,
        repository: IAppointmentRepository,
        event_publisher: IEventPublisher
    ):
        self.repository = repository
        self.event_publisher = event_publisher
    
    async def execute(self, appointment_id: str) -> Optional[Appointment]:
        """Confirm an appointment"""
        logger.info(f"Confirming appointment {appointment_id}")
        
        # Step 1: Find appointment
        appointment = await self.repository.find_by_id(
            AppointmentId(appointment_id)
        )
        
        if not appointment:
            logger.warning(f"Appointment not found: {appointment_id}")
            return None
        
        # Step 2: Confirm the appointment
        appointment.confirm()
        
        # Step 3: Save changes
        confirmed_appointment = await self.repository.update(appointment)
        
        # Step 4: Publish event
        await self.event_publisher.publish(
            'appointment.confirmed',
            {
                'appointment_id': str(appointment_id),
                'confirmed_at': datetime.utcnow().isoformat()
            }
        )
        
        logger.info(f"Appointment confirmed successfully: {appointment_id}")
        return confirmed_appointment

# Use Case: Complete Appointment
class CompleteAppointmentUseCase:
    """
    Use Case for marking appointments as completed
    """
    
    def __init__(
        self,
        repository: IAppointmentRepository,
        event_publisher: IEventPublisher
    ):
        self.repository = repository
        self.event_publisher = event_publisher
    
    async def execute(
        self, 
        appointment_id: str,
        notes: Optional[str] = None
    ) -> Optional[Appointment]:
        """Complete an appointment"""
        logger.info(f"Completing appointment {appointment_id}")
        
        # Step 1: Find appointment
        appointment = await self.repository.find_by_id(
            AppointmentId(appointment_id)
        )
        
        if not appointment:
            logger.warning(f"Appointment not found: {appointment_id}")
            return None
        
        # Step 2: Complete the appointment
        appointment.complete()
        
        if notes:
            appointment.notes = notes
        
        # Step 3: Save changes
        completed_appointment = await self.repository.update(appointment)
        
        # Step 4: Publish event
        await self.event_publisher.publish(
            'appointment.completed',
            {
                'appointment_id': str(appointment_id),
                'completed_at': datetime.utcnow().isoformat(),
                'notes': notes
            }
        )
        
        logger.info(f"Appointment completed successfully: {appointment_id}")
        return completed_appointment
