# Appointment Service - Main Application
# Demonstrates: Clean Architecture, SOLID Principles, Repository Pattern

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import List, Optional
from datetime import datetime, date, time
import os
import logging

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

# API Endpoints

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

@app.get("/appointments/{appointment_id}", response_model=AppointmentResponseDTO)
async def get_appointment(appointment_id: str):
    """
    Get appointment by ID
    Demonstrates: Repository pattern
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

@app.get("/appointments/availability/{doctor_id}")
async def check_availability(
    doctor_id: str,
    date: date,
    duration_minutes: int = 30
):
    """
    Check available time slots for a doctor on a specific date
    Demonstrates: Domain service usage
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
