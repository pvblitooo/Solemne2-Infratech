from rest_framework import generics, status
from rest_framework.response import Response
from django.utils import timezone
from .models import Incident, Technician
from .serializers import IncidentSerializer, TechnicianSerializer

class TechnicianListView(generics.ListAPIView):
    """
    Vista para listar todos los técnicos.
    """
    queryset = Technician.objects.all()
    serializer_class = TechnicianSerializer


class IncidentListCreateView(generics.ListCreateAPIView):
    """
    Vista para listar incidentes (con filtros) y crear nuevos incidentes.
    """
    serializer_class = IncidentSerializer

    def get_queryset(self):
        """
        Sobrescribimos este método para añadir filtros basados en query params.
        Ej: /api/incidents/?status=Nuevo&priority=Alta
        """
        queryset = Incident.objects.all().order_by('-creation_date')
        status = self.request.query_params.get('status')
        priority = self.request.query_params.get('priority')
        type = self.request.query_params.get('type')
        date = self.request.query_params.get('date') # Formato: YYYY-MM-DD

        if status:
            queryset = queryset.filter(status=status)
        if priority:
            queryset = queryset.filter(priority=priority)
        if type:
            queryset = queryset.filter(type__icontains=type)
        if date:
            queryset = queryset.filter(creation_date__date=date)
        
        return queryset


class IncidentRetrieveUpdateView(generics.RetrieveUpdateAPIView):
    """
    Vista para ver, actualizar un incidente específico.
    """
    queryset = Incident.objects.all()
    serializer_class = IncidentSerializer

    def perform_update(self, serializer):
        """
        Sobrescribimos para añadir lógica al actualizar,
        específicamente al cambiar el estado a 'Resuelto'.
        """
        original_status = serializer.instance.status
        new_status = serializer.validated_data.get('status')

        # Si el incidente se está marcando como resuelto
        if new_status == 'Resuelto' and original_status != 'Resuelto':
            serializer.save(resolution_date=timezone.now())
        # Si un incidente resuelto se reabre
        elif new_status != 'Resuelto' and original_status == 'Resuelto':
            serializer.save(resolution_date=None)
        else:
            serializer.save()