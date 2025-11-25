# Appointment Service - Main Application (FIXED)
# Demonstrates: Clean Architecture, SOLID Principles, Repository Pattern
# CAMBIOS: Reordenadas rutas para evitar conflictos con availability

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import List, Optional
from datetime import datetime, date, time
import os
import logging
from datetime import timedelta

# Domain Layer Imports
from domain.entities import Appointment, AppointmentStatus
from domain.value_objects import TimeSlot, AppointmentId

# Application Layer Imports
from application.use_cases import (
    CreateAppointmentUseCase,
    UpdateAppointmentUseCase,
    CancelAppointmentUseCase,
    GetAppointmentUseCase,
    ListAppointmentsUseCase
)
from application.services import AvailabilityService, ValidationService

# Infrastructure Layer Imports
from infrastructure.database import Database
from infrastructure.repositories import PostgreSQLAppointmentRepository
from infrastructure.messaging import EventPublisher

# Interface Layer Imports
from interfaces.dto import (
    CreateAppointmentDTO,
    UpdateAppointmentDTO,
    AppointmentResponseDTO,
    AppointmentListResponseDTO
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Dependency Injection Container (Manual DI for educational purposes)
class DIContainer:
    """
    Dependency Injection Container
    Demonstrates: Dependency Inversion Principle
    All high-level modules depend on abstractions, not concretions
    """
    
    def __init__(self):
        # Infrastructure
        self.database = Database(os.getenv("DATABASE_URL"))
        self.event_publisher = EventPublisher()
        
        # Repositories
        self.appointment_repository = PostgreSQLAppointmentRepository(
            self.database
        )
        
        # Domain Services
        self.availability_service = AvailabilityService(
            self.appointment_repository
        )
        self.validation_service = ValidationService()
        
        # Use Cases (Application Services)
        self.create_appointment_use_case = CreateAppointmentUseCase(
            repository=self.appointment_repository,
            availability_service=self.availability_service,
            validation_service=self.validation_service,
            event_publisher=self.event_publisher
        )
        
        self.update_appointment_use_case = UpdateAppointmentUseCase(
            repository=self.appointment_repository,
            validation_service=self.validation_service,
            event_publisher=self.event_publisher
        )
        
        self.cancel_appointment_use_case = CancelAppointmentUseCase(
            repository=self.appointment_repository,
            event_publisher=self.event_publisher
        )
        
        self.get_appointment_use_case = GetAppointmentUseCase(
            repository=self.appointment_repository
        )
        
        self.list_appointments_use_case = ListAppointmentsUseCase(
            repository=self.appointment_repository
        )

# Initialize DI Container
di_container = DIContainer()

# Lifespan context manager for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("Starting Appointment Service...")
    await di_container.database.connect()
    logger.info("Database connected successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Appointment Service...")
    await di_container.database.disconnect()
    logger.info("Database disconnected successfully")

# Create FastAPI application
app = FastAPI(
    title="Appointment Service",
    description="Microservice for managing medical appointments - Demonstrates SOLID Principles",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health Check Endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "appointment-service",
        "timestamp": datetime.utcnow().isoformat()
    }
@app.get("/doctors")
async def list_doctors(
    specialty: Optional[str] = None,
    available_date: Optional[date] = None,
    page: int = 1,
    page_size: int = 20
):
    """
    List all available doctors with optional filters
    
    Query Parameters:
    - specialty: Filter by medical specialty
    - available_date: Filter doctors available on specific date
    - page: Page number (default: 1)
    - page_size: Items per page (default: 20, max: 100)
    """
    try:
        query = """
            SELECT 
                d.id,
                d.name,
                d.email,
                d.phone,
                d.specialty,
                d.license_number,
                d.available_days,
                d.available_hours,
                d.created_at
            FROM doctors d
            WHERE 1=1
        """
        
        params = []
        param_count = 1
        
        # Filter by specialty
        if specialty:
            query += f" AND d.specialty ILIKE ${param_count}"
            params.append(f"%{specialty}%")
            param_count += 1
        
        # Filter by available date
        if available_date:
            # Get day of week from date
            day_name = available_date.strftime("%A")
            query += f" AND d.available_days @> ${param_count}::jsonb"
            params.append(f'["{day_name}"]')
            param_count += 1
        
        # Pagination
        offset = (page - 1) * page_size
        query += f" ORDER BY d.name LIMIT ${param_count} OFFSET ${param_count + 1}"
        params.extend([page_size, offset])
        
        # Execute query
        result = await di_container.database.fetch(query, *params)
        
        # Get total count
        count_query = """
            SELECT COUNT(*) as total FROM doctors d WHERE 1=1
        """
        count_params = []
        
        if specialty:
            count_query += " AND d.specialty ILIKE $1"
            count_params.append(f"%{specialty}%")
        
        if available_date:
            day_name = available_date.strftime("%A")
            param_idx = len(count_params) + 1
            count_query += f" AND d.available_days @> ${param_idx}::jsonb"
            count_params.append(f'["{day_name}"]')
        
        count_result = await di_container.database.fetchrow(count_query, *count_params)
        total = count_result["total"]
        
        return {
            "doctors": [dict(row) for row in result],
            "total": total,
            "page": page,
            "page_size": page_size,
            "has_next": offset + page_size < total,
            "has_previous": page > 1
        }
        
    except Exception as e:
        logger.error(f"Error listing doctors: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/doctors/{doctor_id}")
async def get_doctor(doctor_id: str):
    """
    Get doctor details including specialties and availability
    
    Returns complete doctor information with schedule
    """
    try:
        query = """
            SELECT 
                d.id,
                d.name,
                d.email,
                d.phone,
                d.specialty,
                d.license_number,
                d.available_days,
                d.available_hours,
                d.created_at,
                d.updated_at,
                COUNT(a.id) as total_appointments,
                AVG(EXTRACT(EPOCH FROM (a.updated_at - a.created_at))) as avg_appointment_duration
            FROM doctors d
            LEFT JOIN appointments a ON a.doctor_id = d.id 
                AND a.status = 'completed'
            WHERE d.id = $1
            GROUP BY d.id
        """
        
        result = await di_container.database.fetchrow(query, doctor_id)
        
        if not result:
            raise HTTPException(status_code=404, detail="Doctor not found")
        
        doctor_data = dict(result)
        
        # Get upcoming appointments count
        upcoming_query = """
            SELECT COUNT(*) as upcoming_count
            FROM appointments
            WHERE doctor_id = $1 
                AND appointment_date >= CURRENT_DATE
                AND status IN ('scheduled', 'confirmed')
        """
        upcoming_result = await di_container.database.fetchrow(upcoming_query, doctor_id)
        doctor_data["upcoming_appointments"] = upcoming_result["upcoming_count"]
        
        # Get available time slots for next 7 days
        doctor_data["next_available_slots"] = []
        for i in range(7):
            check_date = date.today() + timedelta(days=i)
            day_name = check_date.strftime("%A")
            
            # Check if doctor works on this day
            if day_name in doctor_data.get("available_days", []):
                slots = await di_container.availability_service.get_available_slots(
                    doctor_id=doctor_id,
                    date=check_date,
                    duration_minutes=30
                )
                
                if slots:
                    doctor_data["next_available_slots"].append({
                        "date": check_date.isoformat(),
                        "day": day_name,
                        "slots_count": len(slots),
                        "first_slot": slots[0].start_time.isoformat() if slots else None
                    })
        
        return doctor_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting doctor: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/doctors/{doctor_id}/statistics")
async def get_doctor_statistics(doctor_id: str):
    """
    Get statistics for a specific doctor
    
    Returns appointment metrics and performance data
    """
    try:
        # Verify doctor exists
        doctor_check = await di_container.database.fetchrow(
            "SELECT id FROM doctors WHERE id = $1",
            doctor_id
        )
        
        if not doctor_check:
            raise HTTPException(status_code=404, detail="Doctor not found")
        
        # Get comprehensive statistics
        stats_query = """
            SELECT 
                COUNT(*) as total_appointments,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
                COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count,
                COUNT(CASE WHEN status = 'no_show' THEN 1 END) as no_show_count,
                COUNT(CASE WHEN status IN ('scheduled', 'confirmed') THEN 1 END) as upcoming_count,
                AVG(duration_minutes) as avg_duration,
                MIN(appointment_date) as first_appointment_date,
                MAX(appointment_date) as last_appointment_date
            FROM appointments
            WHERE doctor_id = $1
        """
        
        stats = await di_container.database.fetchrow(stats_query, doctor_id)
        
        # Calculate rates
        total = stats["total_appointments"] or 1  # Avoid division by zero
        
        return {
            "doctor_id": doctor_id,
            "total_appointments": stats["total_appointments"],
            "completed": stats["completed_count"],
            "cancelled": stats["cancelled_count"],
            "no_show": stats["no_show_count"],
            "upcoming": stats["upcoming_count"],
            "average_duration_minutes": float(stats["avg_duration"]) if stats["avg_duration"] else 0,
            "cancellation_rate": round(stats["cancelled_count"] / total, 3),
            "no_show_rate": round(stats["no_show_count"] / total, 3),
            "completion_rate": round(stats["completed_count"] / total, 3),
            "first_appointment": stats["first_appointment_date"].isoformat() if stats["first_appointment_date"] else None,
            "last_appointment": stats["last_appointment_date"].isoformat() if stats["last_appointment_date"] else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting doctor statistics: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# ============================================================================
# RUTAS CON PATHS ESPECÍFICOS PRIMERO (para evitar conflictos)
# ============================================================================

# ============================================================================
# RUTAS CRUD NORMALES
# ============================================================================

@app.post("/appointments", response_model=AppointmentResponseDTO)
async def create_appointment(
    appointment_data: CreateAppointmentDTO
):
    """
    Create a new appointment
    Demonstrates: Use Case pattern, Clean Architecture
    """
    try:
        appointment = await di_container.create_appointment_use_case.execute(
            appointment_data.dict()
        )
        return AppointmentResponseDTO.from_domain(appointment)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating appointment: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/appointments", response_model=AppointmentListResponseDTO)
async def list_appointments(
    patient_id: Optional[str] = None,
    doctor_id: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    status: Optional[AppointmentStatus] = None,
    page: int = 1,
    page_size: int = 20
):
    """
    List appointments with filters
    Demonstrates: Query object pattern
    """
    try:
        filters = {
            "patient_id": patient_id,
            "doctor_id": doctor_id,
            "date_from": date_from,
            "date_to": date_to,
            "status": status
        }
        
        appointments = await di_container.list_appointments_use_case.execute(
            filters=filters,
            page=page,
            page_size=page_size
        )
        
        return AppointmentListResponseDTO(
            appointments=[
                AppointmentResponseDTO.from_domain(apt) 
                for apt in appointments
            ],
            total=len(appointments),
            page=page,
            page_size=page_size
        )
    except Exception as e:
        logger.error(f"Error listing appointments: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/appointments/availability/{doctor_id}")
async def check_availability(
    doctor_id: str,
    date: date,
    duration_minutes: int = 30
):
    """
    Check available time slots for a doctor on a specific date
    Demonstrates: Domain service usage
    ⚠️ ESTA RUTA DEBE ESTAR ANTES DE /appointments/{appointment_id}
    """
    try:
        available_slots = await di_container.availability_service.get_available_slots(
            doctor_id=doctor_id,
            date=date,
            duration_minutes=duration_minutes
        )
        
        return {
            "doctor_id": doctor_id,
            "date": date.isoformat(),
            "available_slots": [
                {
                    "start_time": slot.start_time.isoformat(),
                    "end_time": slot.end_time.isoformat()
                }
                for slot in available_slots
            ]
        }
    except Exception as e:
        logger.error(f"Error checking availability: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/appointments/{appointment_id}", response_model=AppointmentResponseDTO)
async def get_appointment(appointment_id: str):
    """
    Get appointment by ID
    Demonstrates: Repository pattern
    ⚠️ ESTA RUTA DEBE ESTAR DESPUÉS de rutas con paths específicos
    """
    try:
        appointment = await di_container.get_appointment_use_case.execute(
            appointment_id
        )
        if not appointment:
            raise HTTPException(status_code=404, detail="Appointment not found")
        return AppointmentResponseDTO.from_domain(appointment)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting appointment: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.put("/appointments/{appointment_id}", response_model=AppointmentResponseDTO)
async def update_appointment(
    appointment_id: str,
    appointment_data: UpdateAppointmentDTO
):
    """
    Update an existing appointment
    Demonstrates: Command pattern
    """
    try:
        appointment = await di_container.update_appointment_use_case.execute(
            appointment_id=appointment_id,
            updates=appointment_data.dict(exclude_unset=True)
        )
        if not appointment:
            raise HTTPException(status_code=404, detail="Appointment not found")
        return AppointmentResponseDTO.from_domain(appointment)
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating appointment: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.delete("/appointments/{appointment_id}")
async def cancel_appointment(
    appointment_id: str,
    reason: Optional[str] = None
):
    """
    Cancel an appointment
    Demonstrates: Command pattern, Event-driven architecture
    """
    try:
        result = await di_container.cancel_appointment_use_case.execute(
            appointment_id=appointment_id,
            cancellation_reason=reason
        )
        if not result:
            raise HTTPException(status_code=404, detail="Appointment not found")
        return {
            "message": "Appointment cancelled successfully",
            "appointment_id": appointment_id
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling appointment: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/appointments/{appointment_id}/confirm")
async def confirm_appointment(appointment_id: str):
    """
    Confirm an appointment
    Demonstrates: State pattern implementation
    """
    try:
        appointment = await di_container.get_appointment_use_case.execute(
            appointment_id
        )
        if not appointment:
            raise HTTPException(status_code=404, detail="Appointment not found")
        
        # Update status to confirmed
        updated = await di_container.update_appointment_use_case.execute(
            appointment_id=appointment_id,
            updates={"status": AppointmentStatus.CONFIRMED}
        )
        
        return AppointmentResponseDTO.from_domain(updated)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error confirming appointment: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Run the application
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("PORT", 3001)),
        log_level="info"
    )
