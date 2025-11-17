# PostgreSQL Repository Implementation
# Demonstrates: Repository Pattern, Dependency Inversion, Data Access Layer

import asyncpg
import json
from typing import List, Optional, Dict, Any
from datetime import date, time, datetime
import logging

from domain.entities import (
    Appointment, 
    AppointmentStatus, 
    AppointmentId,
    PatientId,
    DoctorId,
    TimeSlot
)
from application.use_cases import IAppointmentRepository

logger = logging.getLogger(__name__)

class PostgreSQLAppointmentRepository(IAppointmentRepository):
    """
    PostgreSQL implementation of the Appointment Repository
    Demonstrates: 
    - Repository Pattern (encapsulates data access)
    - Dependency Inversion (implements interface)
    - Single Responsibility (only handles persistence)
    """
    
    def __init__(self, database):
        """
        Initialize with database connection
        Database is injected (Dependency Injection)
        """
        self.database = database
    
    async def save(self, appointment: Appointment) -> Appointment:
        """
        Save a new appointment to the database
        Demonstrates: Data mapping between domain and persistence
        """
        query = """
            INSERT INTO appointments (
                id, patient_id, doctor_id, 
                appointment_date, start_time, end_time,
                status, reason, notes,
                created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        """
        
        try:
            async with self.database.acquire() as connection:
                row = await connection.fetchrow(
                    query,
                    str(appointment.id),
                    str(appointment.patient_id),
                    str(appointment.doctor_id),
                    appointment.appointment_date,
                    appointment.time_slot.start_time,
                    appointment.time_slot.end_time,
                    appointment.status.value,
                    appointment.reason,
                    appointment.notes,
                    appointment.created_at,
                    appointment.updated_at
                )
                
                logger.info(f"Appointment saved successfully: {appointment.id}")
                return self._map_row_to_appointment(row)
                
        except asyncpg.UniqueViolationError as e:
            logger.error(f"Duplicate appointment: {e}")
            raise ValueError("An appointment already exists for this time slot")
        except Exception as e:
            logger.error(f"Error saving appointment: {e}")
            raise
    
    async def find_by_id(self, appointment_id: AppointmentId) -> Optional[Appointment]:
        """
        Find an appointment by its ID
        """
        query = """
            SELECT * FROM appointments WHERE id = $1
        """
        
        try:
            async with self.database.acquire() as connection:
                row = await connection.fetchrow(query, str(appointment_id))
                
                if row:
                    return self._map_row_to_appointment(row)
                return None
                
        except Exception as e:
            logger.error(f"Error finding appointment by ID: {e}")
            raise
    
    async def find_by_patient(self, patient_id: PatientId) -> List[Appointment]:
        """
        Find all appointments for a patient
        """
        query = """
            SELECT * FROM appointments 
            WHERE patient_id = $1
            ORDER BY appointment_date, start_time
        """
        
        try:
            async with self.database.acquire() as connection:
                rows = await connection.fetch(query, str(patient_id))
                
                return [self._map_row_to_appointment(row) for row in rows]
                
        except Exception as e:
            logger.error(f"Error finding appointments by patient: {e}")
            raise
    
    async def find_by_doctor_and_date(
        self, 
        doctor_id: DoctorId, 
        appointment_date: date
    ) -> List[Appointment]:
        """
        Find all appointments for a doctor on a specific date
        """
        query = """
            SELECT * FROM appointments 
            WHERE doctor_id = $1 AND appointment_date = $2
            ORDER BY start_time
        """
        
        try:
            async with self.database.acquire() as connection:
                rows = await connection.fetch(
                    query, 
                    str(doctor_id), 
                    appointment_date
                )
                
                return [self._map_row_to_appointment(row) for row in rows]
                
        except Exception as e:
            logger.error(f"Error finding appointments by doctor and date: {e}")
            raise
    
    async def update(self, appointment: Appointment) -> Appointment:
        """
        Update an existing appointment
        """
        query = """
            UPDATE appointments SET
                patient_id = $2,
                doctor_id = $3,
                appointment_date = $4,
                start_time = $5,
                end_time = $6,
                status = $7,
                reason = $8,
                notes = $9,
                updated_at = $10,
                cancelled_at = $11,
                cancellation_reason = $12
            WHERE id = $1
            RETURNING *
        """
        
        try:
            async with self.database.acquire() as connection:
                row = await connection.fetchrow(
                    query,
                    str(appointment.id),
                    str(appointment.patient_id),
                    str(appointment.doctor_id),
                    appointment.appointment_date,
                    appointment.time_slot.start_time,
                    appointment.time_slot.end_time,
                    appointment.status.value,
                    appointment.reason,
                    appointment.notes,
                    appointment.updated_at,
                    appointment.cancelled_at,
                    appointment.cancellation_reason
                )
                
                if row:
                    logger.info(f"Appointment updated successfully: {appointment.id}")
                    return self._map_row_to_appointment(row)
                    
                raise ValueError(f"Appointment not found: {appointment.id}")
                
        except Exception as e:
            logger.error(f"Error updating appointment: {e}")
            raise
    
    async def delete(self, appointment_id: AppointmentId) -> bool:
        """
        Delete an appointment (soft delete by setting status)
        """
        query = """
            UPDATE appointments 
            SET status = 'cancelled', 
                cancelled_at = $2,
                cancellation_reason = 'Deleted',
                updated_at = $3
            WHERE id = $1
            RETURNING id
        """
        
        try:
            async with self.database.acquire() as connection:
                row = await connection.fetchrow(
                    query,
                    str(appointment_id),
                    datetime.utcnow(),
                    datetime.utcnow()
                )
                
                if row:
                    logger.info(f"Appointment deleted successfully: {appointment_id}")
                    return True
                return False
                
        except Exception as e:
            logger.error(f"Error deleting appointment: {e}")
            raise
    
    async def find_by_date_range(
        self, 
        start_date: date, 
        end_date: date,
        status: Optional[AppointmentStatus] = None
    ) -> List[Appointment]:
        """
        Find appointments within a date range
        Additional method not in interface but useful
        """
        query = """
            SELECT * FROM appointments 
            WHERE appointment_date BETWEEN $1 AND $2
        """
        params = [start_date, end_date]
        
        if status:
            query += " AND status = $3"
            params.append(status.value)
        
        query += " ORDER BY appointment_date, start_time"
        
        try:
            async with self.database.acquire() as connection:
                rows = await connection.fetch(query, *params)
                
                return [self._map_row_to_appointment(row) for row in rows]
                
        except Exception as e:
            logger.error(f"Error finding appointments by date range: {e}")
            raise
    
    async def count_by_status(self, status: AppointmentStatus) -> int:
        """
        Count appointments by status
        Useful for analytics
        """
        query = """
            SELECT COUNT(*) FROM appointments WHERE status = $1
        """
        
        try:
            async with self.database.acquire() as connection:
                count = await connection.fetchval(query, status.value)
                return count or 0
                
        except Exception as e:
            logger.error(f"Error counting appointments: {e}")
            raise
    
    def _map_row_to_appointment(self, row) -> Appointment:
        """
        Map a database row to an Appointment domain entity
        Private method for internal use only
        Demonstrates: Data mapping layer
        """
        if not row:
            return None
        
        return Appointment(
            id=AppointmentId(row['id']),
            patient_id=PatientId(row['patient_id']),
            doctor_id=DoctorId(row['doctor_id']),
            appointment_date=row['appointment_date'],
            time_slot=TimeSlot(
                start_time=row['start_time'],
                end_time=row['end_time']
            ),
            status=AppointmentStatus(row['status']),
            reason=row.get('reason'),
            notes=row.get('notes'),
            created_at=row['created_at'],
            updated_at=row['updated_at'],
            cancelled_at=row.get('cancelled_at'),
            cancellation_reason=row.get('cancellation_reason')
        )

class CachedAppointmentRepository(IAppointmentRepository):
    """
    Cached repository implementation
    Demonstrates: Decorator Pattern, Caching Strategy
    """
    
    def __init__(self, repository: IAppointmentRepository, cache_service):
        """
        Wrap another repository with caching
        Demonstrates: Composition over inheritance
        """
        self.repository = repository
        self.cache = cache_service
        self.cache_ttl = 300  # 5 minutes
    
    async def save(self, appointment: Appointment) -> Appointment:
        """Save and invalidate cache"""
        result = await self.repository.save(appointment)
        
        # Invalidate related cache entries
        await self._invalidate_cache(appointment)
        
        return result
    
    async def find_by_id(self, appointment_id: AppointmentId) -> Optional[Appointment]:
        """Find with cache"""
        cache_key = f"appointment:{appointment_id}"
        
        # Check cache first
        cached = await self.cache.get(cache_key)
        if cached:
            logger.debug(f"Cache hit for appointment: {appointment_id}")
            return Appointment.from_dict(json.loads(cached))
        
        # Fetch from repository
        appointment = await self.repository.find_by_id(appointment_id)
        
        if appointment:
            # Store in cache
            await self.cache.setex(
                cache_key,
                self.cache_ttl,
                json.dumps(appointment.to_dict())
            )
        
        return appointment
    
    async def find_by_patient(self, patient_id: PatientId) -> List[Appointment]:
        """Find by patient with cache"""
        cache_key = f"patient_appointments:{patient_id}"
        
        # Check cache
        cached = await self.cache.get(cache_key)
        if cached:
            logger.debug(f"Cache hit for patient appointments: {patient_id}")
            appointments_data = json.loads(cached)
            return [Appointment.from_dict(data) for data in appointments_data]
        
        # Fetch from repository
        appointments = await self.repository.find_by_patient(patient_id)
        
        # Store in cache
        await self.cache.setex(
            cache_key,
            self.cache_ttl,
            json.dumps([apt.to_dict() for apt in appointments])
        )
        
        return appointments
    
    async def find_by_doctor_and_date(
        self, 
        doctor_id: DoctorId, 
        appointment_date: date
    ) -> List[Appointment]:
        """Find by doctor and date with cache"""
        cache_key = f"doctor_appointments:{doctor_id}:{appointment_date.isoformat()}"
        
        # Check cache
        cached = await self.cache.get(cache_key)
        if cached:
            logger.debug(f"Cache hit for doctor appointments: {doctor_id} on {appointment_date}")
            appointments_data = json.loads(cached)
            return [Appointment.from_dict(data) for data in appointments_data]
        
        # Fetch from repository
        appointments = await self.repository.find_by_doctor_and_date(
            doctor_id, appointment_date
        )
        
        # Store in cache
        await self.cache.setex(
            cache_key,
            self.cache_ttl,
            json.dumps([apt.to_dict() for apt in appointments])
        )
        
        return appointments
    
    async def update(self, appointment: Appointment) -> Appointment:
        """Update and invalidate cache"""
        result = await self.repository.update(appointment)
        
        # Invalidate related cache entries
        await self._invalidate_cache(appointment)
        
        return result
    
    async def delete(self, appointment_id: AppointmentId) -> bool:
        """Delete and invalidate cache"""
        # Get appointment first to know what cache to invalidate
        appointment = await self.repository.find_by_id(appointment_id)
        
        result = await self.repository.delete(appointment_id)
        
        if result and appointment:
            await self._invalidate_cache(appointment)
        
        return result
    
    async def _invalidate_cache(self, appointment: Appointment):
        """
        Invalidate all cache entries related to an appointment
        """
        keys_to_delete = [
            f"appointment:{appointment.id}",
            f"patient_appointments:{appointment.patient_id}",
            f"doctor_appointments:{appointment.doctor_id}:{appointment.appointment_date.isoformat()}"
        ]
        
        for key in keys_to_delete:
            await self.cache.delete(key)
        
        logger.debug(f"Cache invalidated for appointment: {appointment.id}")
