from django.urls import path
from .views import (
    TechnicianListView,
    IncidentListCreateView,
    IncidentRetrieveUpdateView
)

urlpatterns = [
    path('technicians/', TechnicianListView.as_view(), name='technician-list'),
    path('incidents/', IncidentListCreateView.as_view(), name='incident-list-create'),
    path('incidents/<uuid:pk>/', IncidentRetrieveUpdateView.as_view(), name='incident-detail-update'),
]