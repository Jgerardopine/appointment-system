# Value Objects for Domain Model
# Demonstrates: Value Object Pattern, Immutability, Business Logic Encapsulation

from dataclasses import dataclass
from datetime import time, date, datetime
from typing import Optional
import re
import uuid

@dataclass(frozen=True)
class AppointmentId:
    """
    Value Object for Appointment ID
    Immutable and self-validating
    """
    value: str
    
    def __post_init__(self):
        if not self.value:
            object.__setattr__(self, 'value', str(uuid.uuid4()))
        elif not self._is_valid_uuid(self.value):
            raise ValueError(f"Invalid appointment ID format: {self.value}")
    
    @staticmethod
    def _is_valid_uuid(value: str) -> bool:
        try:
            uuid.UUID(value)
            return True
        except ValueError:
            return False
    
    def __str__(self) -> str:
        return self.value

@dataclass(frozen=True)
class PatientId:
    """Value Object for Patient ID"""
    value: str
    
    def __post_init__(self):
        if not self.value:
            raise ValueError("Patient ID cannot be empty")
    
    def __str__(self) -> str:
        return self.value

@dataclass(frozen=True)
class DoctorId:
    """Value Object for Doctor ID"""
    value: str
    
    def __post_init__(self):
        if not self.value:
            raise ValueError("Doctor ID cannot be empty")
    
    def __str__(self) -> str:
        return self.value

@dataclass(frozen=True)
class TimeSlot:
    """
    Value Object representing a time slot
    Encapsulates time slot logic and validations
    """
    start_time: time
    end_time: time
    
    def __post_init__(self):
        if self.start_time >= self.end_time:
            raise ValueError("Start time must be before end time")
        if self.start_time.minute % 15 != 0 or self.end_time.minute % 15 != 0:
            raise ValueError("Times must be in 15-minute intervals")
    
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
    
    def to_string(self) -> str:
        """Human-readable format"""
        return f"{self.start_time.strftime('%H:%M')} - {self.end_time.strftime('%H:%M')}"

@dataclass(frozen=True)
class Email:
    """
    Value Object for Email
    Self-validating email address
    """
    value: str
    
    def __post_init__(self):
        if not self._is_valid_email(self.value):
            raise ValueError(f"Invalid email format: {self.value}")
    
    @staticmethod
    def _is_valid_email(email: str) -> bool:
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    def __str__(self) -> str:
        return self.value
    
    @property
    def domain(self) -> str:
        """Extract domain from email"""
        return self.value.split('@')[1]

@dataclass(frozen=True)
class Phone:
    """
    Value Object for Phone Number
    Handles phone validation and formatting
    """
    value: str
    country_code: str = "+52"  # Default Mexico
    
    def __post_init__(self):
        # Remove all non-numeric characters except +
        cleaned = re.sub(r'[^0-9+]', '', self.value)
        
        # Validate format
        if not self._is_valid_phone(cleaned):
            raise ValueError(f"Invalid phone format: {self.value}")
        
        object.__setattr__(self, 'value', cleaned)
    
    @staticmethod
    def _is_valid_phone(phone: str) -> bool:
        # Simple validation: must have at least 10 digits
        digits_only = re.sub(r'[^0-9]', '', phone)
        return len(digits_only) >= 10
    
    def format_international(self) -> str:
        """Format as international number"""
        if self.value.startswith('+'):
            return self.value
        return f"{self.country_code}{self.value}"
    
    def format_local(self) -> str:
        """Format for local display"""
        # Remove country code if present
        local = self.value.replace(self.country_code, '')
        if len(local) == 10:
            return f"({local[:3]}) {local[3:6]}-{local[6:]}"
        return local

@dataclass(frozen=True)
class DateRange:
    """
    Value Object for Date Range
    Encapsulates date range logic
    """
    start_date: date
    end_date: date
    
    def __post_init__(self):
        if self.start_date > self.end_date:
            raise ValueError("Start date must be before or equal to end date")
    
    def contains(self, check_date: date) -> bool:
        """Check if a date is within this range"""
        return self.start_date <= check_date <= self.end_date
    
    def overlaps_with(self, other: 'DateRange') -> bool:
        """Check if this range overlaps with another"""
        return not (self.end_date < other.start_date or 
                   self.start_date > other.end_date)
    
    @property
    def days(self) -> int:
        """Number of days in range"""
        return (self.end_date - self.start_date).days + 1
    
    def to_list(self) -> list[date]:
        """Get all dates in range"""
        dates = []
        current = self.start_date
        while current <= self.end_date:
            dates.append(current)
            current = date.fromordinal(current.toordinal() + 1)
        return dates

@dataclass(frozen=True)
class Money:
    """
    Value Object for Money
    Handles currency and calculations
    """
    amount: float
    currency: str = "MXN"
    
    def __post_init__(self):
        if self.amount < 0:
            raise ValueError("Amount cannot be negative")
        # Round to 2 decimal places
        object.__setattr__(self, 'amount', round(self.amount, 2))
    
    def add(self, other: 'Money') -> 'Money':
        """Add two money values"""
        if self.currency != other.currency:
            raise ValueError("Cannot add different currencies")
        return Money(self.amount + other.amount, self.currency)
    
    def multiply(self, factor: float) -> 'Money':
        """Multiply money by a factor"""
        return Money(self.amount * factor, self.currency)
    
    def format(self) -> str:
        """Format for display"""
        return f"${self.amount:,.2f} {self.currency}"

@dataclass(frozen=True)
class TelegramId:
    """
    Value Object for Telegram User ID
    """
    value: str
    
    def __post_init__(self):
        if not self.value or not self.value.isdigit():
            raise ValueError(f"Invalid Telegram ID: {self.value}")
    
    def __str__(self) -> str:
        return self.value

@dataclass(frozen=True)
class Specialty:
    """
    Value Object for Medical Specialty
    """
    value: str
    
    VALID_SPECIALTIES = [
        "General Medicine",
        "Pediatrics",
        "Cardiology",
        "Dermatology",
        "Psychiatry",
        "Orthopedics",
        "Ophthalmology",
        "Neurology",
        "Gynecology",
        "Urology"
    ]
    
    def __post_init__(self):
        if self.value not in self.VALID_SPECIALTIES:
            raise ValueError(f"Invalid specialty: {self.value}")
    
    def __str__(self) -> str:
        return self.value
