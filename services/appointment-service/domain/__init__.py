# Domain Module
# Makes domain classes importable

from .entities import (
    Appointment,
    AppointmentStatus,
    AppointmentAggregate
)

from .value_objects import (
    AppointmentId,
    PatientId,
    DoctorId,
    TimeSlot,
    Email,
    Phone,
    DateRange,
    Money,
    TelegramId,
    Specialty
)

__all__ = [
    # Entities
    'Appointment',
    'AppointmentStatus',
    'AppointmentAggregate',
    # Value Objects
    'AppointmentId',
    'PatientId', 
    'DoctorId',
    'TimeSlot',
    'Email',
    'Phone',
    'DateRange',
    'Money',
    'TelegramId',
    'Specialty'
]
