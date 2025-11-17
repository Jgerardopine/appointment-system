# Data Transfer Objects (DTOs)
# Demonstrates: Clean separation between API and Domain layers

from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import date, time, datetime
from enum import Enum


class AppointmentStatusDTO(str, Enum):
    """Status enumeration for API"""
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    NO_SHOW = "no_show"


class CreateAppointmentDTO(BaseModel):
    """
    DTO for creating appointments
    Demonstrates: Input validation, API contract
    """
    patient_id: str = Field(..., description="Patient ID")
    doctor_id: str = Field(..., description="Doctor ID")
    appointment_date: date = Field(..., description="Date of appointment")
    appointment_time: time = Field(..., description="Start time of appointment")
    duration_minutes: int = Field(default=30, ge=15, le=120, description="Duration in minutes")
    reason: Optional[str] = Field(None, max_length=500, description="Reason for appointment")
    notes: Optional[str] = Field(None, max_length=1000, description="Additional notes")

    @validator('appointment_date')
    def validate_date(cls, v):
        """Validate appointment date is not in the past"""
        if v < date.today():
            raise ValueError('Appointment date cannot be in the past')
        return v

    @validator('appointment_time')
    def validate_time(cls, v):
        """Validate appointment time is in 15-minute intervals"""
        if v.minute % 15 != 0:
            raise ValueError('Appointment time must be in 15-minute intervals')
        return v

    class Config:
        schema_extra = {
            "example": {
                "patient_id": "123e4567-e89b-12d3-a456-426614174000",
                "doctor_id": "987f6543-e21b-12d3-a456-426614174000",
                "appointment_date": "2024-11-25",
                "appointment_time": "10:00:00",
                "duration_minutes": 30,
                "reason": "Regular checkup",
                "notes": "Patient requested morning appointment"
            }
        }


class UpdateAppointmentDTO(BaseModel):
    """
    DTO for updating appointments
    Demonstrates: Partial updates, Optional fields
    """
    appointment_date: Optional[date] = Field(None, description="New date")
    appointment_time: Optional[time] = Field(None, description="New time")
    duration_minutes: Optional[int] = Field(None, ge=15, le=120)
    status: Optional[AppointmentStatusDTO] = Field(None, description="New status")
    reason: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = Field(None, max_length=1000)

    @validator('appointment_date')
    def validate_date(cls, v):
        if v and v < date.today():
            raise ValueError('Cannot reschedule to past date')
        return v

    class Config:
        schema_extra = {
            "example": {
                "appointment_date": "2024-11-26",
                "appointment_time": "14:00:00",
                "status": "confirmed"
            }
        }


class TimeSlotDTO(BaseModel):
    """DTO for time slots"""
    start_time: time
    end_time: time
    available: bool = True

    @property
    def duration_minutes(self) -> int:
        start_minutes = self.start_time.hour * 60 + self.start_time.minute
        end_minutes = self.end_time.hour * 60 + self.end_time.minute
        return end_minutes - start_minutes


class AppointmentResponseDTO(BaseModel):
    """
    DTO for appointment responses
    Demonstrates: Output formatting, API response structure
    """
    id: str
    patient_id: str
    doctor_id: str
    appointment_date: date
    start_time: time
    end_time: time
    duration_minutes: int
    status: AppointmentStatusDTO
    reason: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    cancelled_at: Optional[datetime]
    cancellation_reason: Optional[str]

    @classmethod
    def from_domain(cls, appointment):
        """
        Convert from domain entity to DTO
        Demonstrates: Mapping between layers
        """
        return cls(
            id=str(appointment.id),
            patient_id=str(appointment.patient_id),
            doctor_id=str(appointment.doctor_id),
            appointment_date=appointment.appointment_date,
            start_time=appointment.time_slot.start_time,
            end_time=appointment.time_slot.end_time,
            duration_minutes=appointment.time_slot.duration_minutes,
            status=appointment.status.value,
            reason=appointment.reason,
            notes=appointment.notes,
            created_at=appointment.created_at,
            updated_at=appointment.updated_at,
            cancelled_at=appointment.cancelled_at,
            cancellation_reason=appointment.cancellation_reason
        )

    class Config:
        schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "patient_id": "123e4567-e89b-12d3-a456-426614174000",
                "doctor_id": "987f6543-e21b-12d3-a456-426614174000",
                "appointment_date": "2024-11-25",
                "start_time": "10:00:00",
                "end_time": "10:30:00",
                "duration_minutes": 30,
                "status": "confirmed",
                "reason": "Regular checkup",
                "notes": "First visit",
                "created_at": "2024-11-17T10:00:00Z",
                "updated_at": "2024-11-17T10:00:00Z",
                "cancelled_at": None,
                "cancellation_reason": None
            }
        }


class AppointmentListResponseDTO(BaseModel):
    """
    DTO for paginated appointment list
    Demonstrates: Pagination, List responses
    """
    appointments: List[AppointmentResponseDTO]
    total: int
    page: int
    page_size: int
    has_next: bool = False
    has_previous: bool = False

    @validator('has_next', always=True)
    def calculate_has_next(cls, v, values):
        if 'total' in values and 'page' in values and 'page_size' in values:
            return values['page'] * values['page_size'] < values['total']
        return False

    @validator('has_previous', always=True)
    def calculate_has_previous(cls, v, values):
        if 'page' in values:
            return values['page'] > 1
        return False


class AvailableSlotsResponseDTO(BaseModel):
    """DTO for available slots response"""
    doctor_id: str
    date: date
    available_slots: List[TimeSlotDTO]
    total_slots: int

    class Config:
        schema_extra = {
            "example": {
                "doctor_id": "987f6543-e21b-12d3-a456-426614174000",
                "date": "2024-11-25",
                "available_slots": [
                    {
                        "start_time": "09:00:00",
                        "end_time": "09:30:00",
                        "available": True
                    },
                    {
                        "start_time": "10:00:00",
                        "end_time": "10:30:00",
                        "available": True
                    }
                ],
                "total_slots": 2
            }
        }


class ErrorResponseDTO(BaseModel):
    """
    DTO for error responses
    Demonstrates: Consistent error handling
    """
    error: str
    message: str
    details: Optional[dict] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        schema_extra = {
            "example": {
                "error": "ValidationError",
                "message": "Invalid appointment data",
                "details": {
                    "field": "appointment_date",
                    "issue": "Date cannot be in the past"
                },
                "timestamp": "2024-11-17T10:00:00Z"
            }
        }


class HealthCheckResponseDTO(BaseModel):
    """DTO for health check responses"""
    status: str
    service: str
    version: str = "1.0.0"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    dependencies: dict = {}

    class Config:
        schema_extra = {
            "example": {
                "status": "healthy",
                "service": "appointment-service",
                "version": "1.0.0",
                "timestamp": "2024-11-17T10:00:00Z",
                "dependencies": {
                    "database": "connected",
                    "cache": "connected"
                }
            }
        }


class AppointmentFilterDTO(BaseModel):
    """
    DTO for filtering appointments
    Demonstrates: Query parameters handling
    """
    patient_id: Optional[str] = None
    doctor_id: Optional[str] = None
    status: Optional[AppointmentStatusDTO] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    sort_by: str = Field(default="appointment_date")
    # En Pydantic 2, regex se reemplaza por pattern:
    sort_order: str = Field(default="asc", pattern="^(asc|desc)$")

    @validator('date_to')
    def validate_date_range(cls, v, values):
        if v and 'date_from' in values and values['date_from']:
            if v < values['date_from']:
                raise ValueError('date_to must be after date_from')
        return v


class BulkAppointmentCreateDTO(BaseModel):
    """
    DTO for creating multiple appointments
    Demonstrates: Bulk operations
    """
    appointments: List[CreateAppointmentDTO]

    @validator('appointments')
    def validate_appointments(cls, v):
        if not v or len(v) == 0:
            raise ValueError('At least one appointment is required')
        if len(v) > 10:
            raise ValueError('Maximum 10 appointments can be created at once')
        return v


class AppointmentStatisticsDTO(BaseModel):
    """
    DTO for appointment statistics
    Demonstrates: Analytics response
    """
    total_appointments: int
    scheduled_count: int
    confirmed_count: int
    completed_count: int
    cancelled_count: int
    no_show_count: int
    average_duration_minutes: float
    busiest_day: Optional[str]
    busiest_hour: Optional[int]
    cancellation_rate: float
    no_show_rate: float

    class Config:
        schema_extra = {
            "example": {
                "total_appointments": 1000,
                "scheduled_count": 50,
                "confirmed_count": 30,
                "completed_count": 800,
                "cancelled_count": 100,
                "no_show_count": 20,
                "average_duration_minutes": 35.5,
                "busiest_day": "Monday",
                "busiest_hour": 10,
                "cancellation_rate": 0.1,
                "no_show_rate": 0.02
            }
        }
