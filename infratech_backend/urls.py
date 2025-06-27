from django.contrib import admin
from django.urls import path, include # Añadir include

urlpatterns = [
    path('admin/', admin.site.urls),
    # Añadir la ruta para nuestra API
    path('api/', include('incidents.urls')),
]
