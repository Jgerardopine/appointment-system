# Interfaces Module
# Makes DTOs and interface classes importable

from .dto import (
    CreateAppointmentDTO,
    UpdateAppointmentDTO,
    AppointmentResponseDTO,
    AppointmentListResponseDTO,
    TimeSlotDTO,
    AvailableSlotsResponseDTO,
    ErrorResponseDTO,
    HealthCheckResponseDTO,
    AppointmentFilterDTO,
    BulkAppointmentCreateDTO,
    AppointmentStatisticsDTO,
    AppointmentStatusDTO
)

__all__ = [
    'CreateAppointmentDTO',
    'UpdateAppointmentDTO',
    'AppointmentResponseDTO',
    'AppointmentListResponseDTO',
    'TimeSlotDTO',
    'AvailableSlotsResponseDTO',
    'ErrorResponseDTO',
    'HealthCheckResponseDTO',
    'AppointmentFilterDTO',
    'BulkAppointmentCreateDTO',
    'AppointmentStatisticsDTO',
    'AppointmentStatusDTO'
]
