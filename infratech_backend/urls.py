from django.contrib import admin
from django.urls import path, include, re_path # Añadir include
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    # Añadir la ruta para nuestra API
    path('api/', include('incidents.urls')),
    re_path(r'^.*', TemplateView.as_view(template_name='index.html')),
]
