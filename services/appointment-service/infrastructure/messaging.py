# Event Publishing System
# Demonstrates: Observer Pattern, Event-Driven Architecture

import json
import asyncio
import aiohttp
from typing import Dict, Any, List, Callable
from datetime import datetime
import logging
from abc import ABC, abstractmethod
from enum import Enum

logger = logging.getLogger(__name__)

class EventType(Enum):
    """
    Event types in the system
    Demonstrates: Type safety for events
    """
    APPOINTMENT_CREATED = "appointment.created"
    APPOINTMENT_UPDATED = "appointment.updated"
    APPOINTMENT_CANCELLED = "appointment.cancelled"
    APPOINTMENT_CONFIRMED = "appointment.confirmed"
    APPOINTMENT_COMPLETED = "appointment.completed"
    APPOINTMENT_RESCHEDULED = "appointment.rescheduled"
    PATIENT_REGISTERED = "patient.registered"
    NOTIFICATION_SENT = "notification.sent"
    REMINDER_SCHEDULED = "reminder.scheduled"

class Event:
    """
    Domain Event
    Demonstrates: Event as first-class citizen
    """
    
    def __init__(
        self,
        event_type: EventType,
        aggregate_id: str,
        data: Dict[str, Any],
        metadata: Dict[str, Any] = None
    ):
        self.id = str(datetime.utcnow().timestamp())
        self.event_type = event_type
        self.aggregate_id = aggregate_id
        self.data = data
        self.metadata = metadata or {}
        self.occurred_at = datetime.utcnow()
        self.version = "1.0"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert event to dictionary"""
        return {
            'id': self.id,
            'event_type': self.event_type.value,
            'aggregate_id': self.aggregate_id,
            'data': self.data,
            'metadata': self.metadata,
            'occurred_at': self.occurred_at.isoformat(),
            'version': self.version
        }
    
    def to_json(self) -> str:
        """Convert event to JSON"""
        return json.dumps(self.to_dict())

class IEventHandler(ABC):
    """
    Event Handler Interface
    Demonstrates: Interface Segregation
    """
    
    @abstractmethod
    async def handle(self, event: Event) -> None:
        """Handle an event"""
        pass
    
    @abstractmethod
    def can_handle(self, event_type: EventType) -> bool:
        """Check if handler can handle this event type"""
        pass

class EventBus:
    """
    In-memory Event Bus
    Demonstrates: Mediator Pattern, Pub-Sub
    """
    
    def __init__(self):
        self.handlers: Dict[EventType, List[IEventHandler]] = {}
        self.middleware: List[Callable] = []
    
    def register_handler(self, event_type: EventType, handler: IEventHandler):
        """Register an event handler"""
        if event_type not in self.handlers:
            self.handlers[event_type] = []
        
        self.handlers[event_type].append(handler)
        logger.debug(f"Handler registered for {event_type.value}")
    
    def add_middleware(self, middleware: Callable):
        """Add middleware to process events"""
        self.middleware.append(middleware)
    
    async def publish(self, event: Event):
        """
        Publish an event to all registered handlers
        Demonstrates: Async event handling
        """
        # Apply middleware
        for mw in self.middleware:
            event = await mw(event)
        
        # Get handlers for this event type
        handlers = self.handlers.get(event.event_type, [])
        
        if not handlers:
            logger.warning(f"No handlers registered for {event.event_type.value}")
            return
        
        # Execute handlers concurrently
        tasks = [handler.handle(event) for handler in handlers]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Log any errors
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(
                    f"Handler {handlers[i].__class__.__name__} "
                    f"failed for event {event.event_type.value}: {result}"
                )

class EventPublisher:
    """
    Event Publisher for microservices
    Demonstrates: Integration with external services
    """
    
    def __init__(self, event_bus: EventBus = None):
        self.event_bus = event_bus or EventBus()
        self.webhook_urls: List[str] = []
    
    def register_webhook(self, url: str):
        """Register a webhook URL for events"""
        self.webhook_urls.append(url)
        logger.info(f"Webhook registered: {url}")
    
    async def publish(self, event_type: str, data: Dict[str, Any]):
        """
        Publish an event
        Demonstrates: Multiple dispatch mechanisms
        """
        # Create event
        event = Event(
            event_type=EventType(event_type),
            aggregate_id=data.get('id', ''),
            data=data
        )
        
        # Publish to internal event bus
        await self.event_bus.publish(event)
        
        # Publish to webhooks
        await self._publish_to_webhooks(event)
        
        logger.info(f"Event published: {event_type}")
    
    async def _publish_to_webhooks(self, event: Event):
        """
        Send event to registered webhooks
        Demonstrates: HTTP integration
        """
        if not self.webhook_urls:
            return
        
        async with aiohttp.ClientSession() as session:
            tasks = []
            for url in self.webhook_urls:
                task = self._send_to_webhook(session, url, event)
                tasks.append(task)
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    logger.error(f"Failed to send to webhook {self.webhook_urls[i]}: {result}")

    async def _send_to_webhook(
        self, 
        session: aiohttp.ClientSession, 
        url: str, 
        event: Event
    ):
        """Send event to a single webhook"""
        try:
            async with session.post(
                url,
                json=event.to_dict(),
                headers={'Content-Type': 'application/json'},
                timeout=aiohttp.ClientTimeout(total=5)
            ) as response:
                if response.status >= 400:
                    logger.error(f"Webhook {url} returned {response.status}")
        except asyncio.TimeoutError:
            logger.error(f"Webhook {url} timed out")
        except Exception as e:
            logger.error(f"Error sending to webhook {url}: {e}")

# Example Event Handlers

class NotificationEventHandler(IEventHandler):
    """
    Handler for sending notifications
    Demonstrates: Concrete event handler
    """
    
    def __init__(self, notification_service):
        self.notification_service = notification_service
    
    async def handle(self, event: Event) -> None:
        """Handle appointment events and send notifications"""
        if event.event_type == EventType.APPOINTMENT_CREATED:
            await self._handle_appointment_created(event)
        elif event.event_type == EventType.APPOINTMENT_CANCELLED:
            await self._handle_appointment_cancelled(event)
        elif event.event_type == EventType.APPOINTMENT_CONFIRMED:
            await self._handle_appointment_confirmed(event)
    
    def can_handle(self, event_type: EventType) -> bool:
        """Check if this handler can handle the event"""
        return event_type in [
            EventType.APPOINTMENT_CREATED,
            EventType.APPOINTMENT_CANCELLED,
            EventType.APPOINTMENT_CONFIRMED
        ]
    
    async def _handle_appointment_created(self, event: Event):
        """Send notification for created appointment"""
        appointment_data = event.data
        
        # Send confirmation notification
        await self.notification_service.send_confirmation(
            patient_id=appointment_data['patient_id'],
            appointment_date=appointment_data['appointment_date'],
            appointment_time=appointment_data['start_time']
        )
    
    async def _handle_appointment_cancelled(self, event: Event):
        """Send notification for cancelled appointment"""
        appointment_data = event.data
        
        # Send cancellation notification
        await self.notification_service.send_cancellation(
            patient_id=appointment_data['patient_id'],
            appointment_id=appointment_data['appointment_id'],
            reason=appointment_data.get('reason', 'No reason provided')
        )
    
    async def _handle_appointment_confirmed(self, event: Event):
        """Send notification for confirmed appointment"""
        appointment_data = event.data
        
        # Send confirmation notification
        await self.notification_service.send_reminder(
            patient_id=appointment_data['patient_id'],
            appointment_id=appointment_data['appointment_id'],
            message="Your appointment has been confirmed"
        )

class AuditEventHandler(IEventHandler):
    """
    Handler for audit logging
    Demonstrates: Cross-cutting concerns
    """
    
    def __init__(self, audit_repository):
        self.audit_repository = audit_repository
    
    async def handle(self, event: Event) -> None:
        """Log all events for audit"""
        audit_entry = {
            'event_id': event.id,
            'event_type': event.event_type.value,
            'aggregate_id': event.aggregate_id,
            'data': event.data,
            'metadata': event.metadata,
            'occurred_at': event.occurred_at
        }
        
        await self.audit_repository.save(audit_entry)
        logger.debug(f"Audit log created for event: {event.id}")
    
    def can_handle(self, event_type: EventType) -> bool:
        """Handle all events for auditing"""
        return True

class EventStore:
    """
    Event Store for Event Sourcing
    Demonstrates: Event Sourcing Pattern
    """
    
    def __init__(self, database):
        self.database = database
    
    async def append(self, event: Event):
        """Append event to the store"""
        query = """
            INSERT INTO events (
                id, event_type, aggregate_id, 
                data, metadata, occurred_at, version
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        """
        
        await self.database.execute(
            query,
            event.id,
            event.event_type.value,
            event.aggregate_id,
            json.dumps(event.data),
            json.dumps(event.metadata),
            event.occurred_at,
            event.version
        )
    
    async def get_events_for_aggregate(
        self, 
        aggregate_id: str,
        after_version: int = 0
    ) -> List[Event]:
        """Get all events for an aggregate"""
        query = """
            SELECT * FROM events 
            WHERE aggregate_id = $1 AND version > $2
            ORDER BY occurred_at
        """
        
        rows = await self.database.fetch(query, aggregate_id, after_version)
        
        events = []
        for row in rows:
            event = Event(
                event_type=EventType(row['event_type']),
                aggregate_id=row['aggregate_id'],
                data=json.loads(row['data']),
                metadata=json.loads(row['metadata'])
            )
            event.id = row['id']
            event.occurred_at = row['occurred_at']
            event.version = row['version']
            events.append(event)
        
        return events
    
    async def replay_events(
        self,
        aggregate_id: str,
        handler: IEventHandler
    ):
        """
        Replay events for an aggregate
        Useful for rebuilding state
        """
        events = await self.get_events_for_aggregate(aggregate_id)
        
        for event in events:
            if handler.can_handle(event.event_type):
                await handler.handle(event)

# Middleware example
async def logging_middleware(event: Event) -> Event:
    """
    Middleware to log all events
    Demonstrates: Middleware pattern
    """
    logger.info(f"Event: {event.event_type.value} for {event.aggregate_id}")
    return event

async def validation_middleware(event: Event) -> Event:
    """
    Middleware to validate events
    Demonstrates: Validation as middleware
    """
    if not event.aggregate_id:
        raise ValueError("Event must have an aggregate_id")
    
    if not event.data:
        raise ValueError("Event must have data")
    
    return event
