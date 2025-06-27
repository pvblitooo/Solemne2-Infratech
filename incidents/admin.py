from django.contrib import admin
from .models import Technician, Incident

admin.site.register(Technician)
admin.site.register(Incident)