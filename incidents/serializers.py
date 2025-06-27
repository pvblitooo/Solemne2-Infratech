from rest_framework import serializers
from .models import Incident, Technician

class TechnicianSerializer(serializers.ModelSerializer):
    class Meta:
        model = Technician
        fields = '__all__' # Incluir todos los campos del modelo

class IncidentSerializer(serializers.ModelSerializer):
    # Usamos StringRelatedField para mostrar el nombre del técnico en lugar de su ID.
    # Es de solo lectura porque la asignación se hará por ID.
    assigned_to_name = serializers.StringRelatedField(source='assigned_to', read_only=True)
    
    # Hacemos que el campo 'resolution_time' calculado sea visible en la API
    resolution_time = serializers.CharField(read_only=True)

    class Meta:
        model = Incident
        # Incluimos los campos que queremos exponer en la API
        fields = [
            'id', 'type', 'area', 'description', 'status', 'priority', 
            'creation_date', 'resolution_date', 'assigned_to', 
            'assigned_to_name', 'resolution_time'
        ]
        # Hacemos que ciertos campos sean de solo lectura en la API,
        # ya que se gestionan automáticamente en el backend.
        read_only_fields = ['creation_date', 'resolution_date', 'resolution_time']