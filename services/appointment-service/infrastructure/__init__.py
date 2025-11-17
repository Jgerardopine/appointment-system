# Infrastructure Module
# Makes infrastructure classes importable

from .database import Database
from .repositories import (
    PostgreSQLAppointmentRepository,
    CachedAppointmentRepository
)
from .messaging import (
    Event,
    EventType,
    EventBus,
    EventPublisher,
    EventStore,
    IEventHandler,
    NotificationEventHandler,
    AuditEventHandler
)

__all__ = [
    # Database
    'Database',
    # Repositories
    'PostgreSQLAppointmentRepository',
    'CachedAppointmentRepository',
    # Events and Messaging
    'Event',
    'EventType',
    'EventBus',
    'EventPublisher',
    'EventStore',
    'IEventHandler',
    'NotificationEventHandler',
    'AuditEventHandler'
]
