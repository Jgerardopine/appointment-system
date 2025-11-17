# Domain Entities for Appointment Service
# Demonstrates: Domain-Driven Design, Value Objects, Entities

from dataclasses import dataclass, field
from datetime import datetime, date, time
from typing import Optional, List
from enum import Enum
import uuid

class AppointmentStatus(Enum):
    """
    Appointment status enumeration
    Demonstrates: Type safety and domain modeling
    """
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    NO_SHOW = "no_show"
    
    def can_transition_to(self, new_status: 'AppointmentStatus') -> bool:
        """
        Define valid status transitions
        Demonstrates: State pattern
        """
        transitions = {
            AppointmentStatus.SCHEDULED: [
                AppointmentStatus.CONFIRMED,
                AppointmentStatus.CANCELLED
            ],
            AppointmentStatus.CONFIRMED: [
                AppointmentStatus.CANCELLED,
                AppointmentStatus.COMPLETED,
                AppointmentStatus.NO_SHOW
            ],
            AppointmentStatus.CANCELLED: [],  # Terminal state
            AppointmentStatus.COMPLETED: [],  # Terminal state
            AppointmentStatus.NO_SHOW: []     # Terminal state
        }
        return new_status in transitions.get(self, [])

@dataclass(frozen=True)
class AppointmentId:
    """
    Value Object for Appointment ID
    Demonstrates: Value Object pattern - immutable, no identity
    """
    value: str
    
    def __post_init__(self):
        if not self.value:
            object.__setattr__(self, 'value', str(uuid.uuid4()))
    
    def __str__(self) -> str:
        return self.value

@dataclass(frozen=True)
class PatientId:
    """Value Object for Patient ID"""
    value: str
    
    def __str__(self) -> str:
        return self.value

@dataclass(frozen=True)
class DoctorId:
    """Value Object for Doctor ID"""
    value: str
    
    def __str__(self) -> str:
        return self.value

@dataclass
class TimeSlot:
    """
    Value Object representing a time slot
    Demonstrates: Value Object pattern with business logic
    """
    start_time: time
    end_time: time
    
    def __post_init__(self):
        if self.start_time >= self.end_time:
            raise ValueError("Start time must be before end time")
    
    @property
    def duration_minutes(self) -> int:
        """Calculate duration in minutes"""
        start_minutes = self.start_time.hour * 60 + self.start_time.minute
        end_minutes = self.end_time.hour * 60 + self.end_time.minute
        return end_minutes - start_minutes
    
    def overlaps_with(self, other: 'TimeSlot') -> bool:
        """Check if this time slot overlaps with another"""
        return not (self.end_time <= other.start_time or 
                   self.start_time >= other.end_time)
    
    def contains(self, check_time: time) -> bool:
        """Check if a time is within this slot"""
        return self.start_time <= check_time < self.end_time

@dataclass
class Appointment:
    """
    Appointment Entity
    Demonstrates: Entity pattern - has identity and lifecycle
    Single Responsibility Principle - only manages appointment data
    """
    id: AppointmentId
    patient_id: PatientId
    doctor_id: DoctorId
    appointment_date: date
    time_slot: TimeSlot
    status: AppointmentStatus
    reason: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    cancelled_at: Optional[datetime] = None
    cancellation_reason: Optional[str] = None
    
    def __post_init__(self):
        """Validate entity invariants"""
        self._validate_invariants()
    
    def _validate_invariants(self):
        """
        Ensure business rules are maintained
        Demonstrates: Encapsulation of business logic
        """
        if self.appointment_date < date.today():
            raise ValueError("Cannot create appointment in the past")
        
        if self.status == AppointmentStatus.CANCELLED and not self.cancellation_reason:
            raise ValueError("Cancellation reason is required for cancelled appointments")
    
    def update_status(self, new_status: AppointmentStatus) -> None:
        """
        Update appointment status with validation
        Demonstrates: Encapsulation and business rule enforcement
        """
        if not self.status.can_transition_to(new_status):
            raise ValueError(
                f"Cannot transition from {self.status.value} to {new_status.value}"
            )
        
        self.status = new_status
        self.updated_at = datetime.utcnow()
        
        if new_status == AppointmentStatus.CANCELLED:
            self.cancelled_at = datetime.utcnow()
    
    def cancel(self, reason: str) -> None:
        """
        Cancel the appointment
        Demonstrates: Domain logic encapsulation
        """
        if not reason:
            raise ValueError("Cancellation reason is required")
        
        self.update_status(AppointmentStatus.CANCELLED)
        self.cancellation_reason = reason
    
    def confirm(self) -> None:
        """Confirm the appointment"""
        self.update_status(AppointmentStatus.CONFIRMED)
    
    def complete(self) -> None:
        """Mark appointment as completed"""
        self.update_status(AppointmentStatus.COMPLETED)
    
    def mark_no_show(self) -> None:
        """Mark appointment as no-show"""
        self.update_status(AppointmentStatus.NO_SHOW)
    
    def reschedule(self, new_date: date, new_time_slot: TimeSlot) -> None:
        """
        Reschedule the appointment
        Demonstrates: Complex domain operation
        """
        if self.status not in [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED]:
            raise ValueError("Can only reschedule scheduled or confirmed appointments")
        
        if new_date < date.today():
            raise ValueError("Cannot reschedule to past date")
        
        self.appointment_date = new_date
        self.time_slot = new_time_slot
        self.updated_at = datetime.utcnow()
    
    def is_upcoming(self) -> bool:
        """Check if appointment is in the future"""
        return self.appointment_date >= date.today()
    
    def is_past(self) -> bool:
        """Check if appointment is in the past"""
        return self.appointment_date < date.today()
    
    def to_dict(self) -> dict:
        """Convert to dictionary for persistence"""
        return {
            'id': str(self.id),
            'patient_id': str(self.patient_id),
            'doctor_id': str(self.doctor_id),
            'appointment_date': self.appointment_date.isoformat(),
            'start_time': self.time_slot.start_time.isoformat(),
            'end_time': self.time_slot.end_time.isoformat(),
            'status': self.status.value,
            'reason': self.reason,
            'notes': self.notes,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'cancelled_at': self.cancelled_at.isoformat() if self.cancelled_at else None,
            'cancellation_reason': self.cancellation_reason
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> 'Appointment':
        """Create from dictionary"""
        return cls(
            id=AppointmentId(data.get('id', '')),
            patient_id=PatientId(data['patient_id']),
            doctor_id=DoctorId(data['doctor_id']),
            appointment_date=date.fromisoformat(data['appointment_date']),
            time_slot=TimeSlot(
                start_time=time.fromisoformat(data['start_time']),
                end_time=time.fromisoformat(data['end_time'])
            ),
            status=AppointmentStatus(data['status']),
            reason=data.get('reason'),
            notes=data.get('notes'),
            created_at=datetime.fromisoformat(data['created_at']) if 'created_at' in data else datetime.utcnow(),
            updated_at=datetime.fromisoformat(data['updated_at']) if 'updated_at' in data else datetime.utcnow(),
            cancelled_at=datetime.fromisoformat(data['cancelled_at']) if data.get('cancelled_at') else None,
            cancellation_reason=data.get('cancellation_reason')
        )

@dataclass
class AppointmentAggregate:
    """
    Appointment Aggregate Root
    Demonstrates: Aggregate pattern for consistency boundary
    """
    appointment: Appointment
    patient_history: List[Appointment] = field(default_factory=list)
    
    def has_recent_no_shows(self, threshold: int = 2) -> bool:
        """Check if patient has recent no-shows"""
        recent_no_shows = [
            apt for apt in self.patient_history
            if apt.status == AppointmentStatus.NO_SHOW
            and apt.appointment_date >= date.today()
        ]
        return len(recent_no_shows) >= threshold
    
    def can_book_appointment(self) -> bool:
        """
        Business rule: Cannot book if too many no-shows
        Demonstrates: Business logic at aggregate level
        """
        return not self.has_recent_no_shows()
