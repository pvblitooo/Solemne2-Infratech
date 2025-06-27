from django.db import models
from django.utils import timezone
import uuid

class Technician(models.Model):
    name = models.CharField(max_length=100)
    specialty = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class Incident(models.Model):
    # Definimos las opciones para los campos con choices
    STATUS_CHOICES = [
        ('Nuevo', 'Nuevo'),
        ('En Proceso', 'En Proceso'),
        ('Resuelto', 'Resuelto'),
    ]
    PRIORITY_CHOICES = [
        ('Alta', 'Alta'),
        ('Media', 'Media'),
        ('Baja', 'Baja'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    type = models.CharField(max_length=50) # Ej: 'Hardware', 'Software', 'Red'
    area = models.CharField(max_length=50) # Ej: 'Ventas', 'Operaciones'
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Nuevo')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='Media')
    creation_date = models.DateTimeField(default=timezone.now)
    resolution_date = models.DateTimeField(null=True, blank=True)
    assigned_to = models.ForeignKey(Technician, on_delete=models.SET_NULL, null=True, blank=True, related_name='incidents')
    
    # Este campo no se almacena en la BD, se calculará bajo demanda
    @property
    def resolution_time(self):
        if self.resolution_date and self.creation_date:
            duration = self.resolution_date - self.creation_date
            days, seconds = duration.days, duration.seconds
            hours = seconds // 3600
            minutes = (seconds % 3600) // 60
            return f"{days}d {hours}h {minutes}m"
        return None

    def __str__(self):
        return f"Incidente {self.type} en {self.area} - {self.status}"

