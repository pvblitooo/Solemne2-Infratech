export interface Incident {
  id: string;
  type: string;
  area: string;
  description: string;
  status: 'Nuevo' | 'En Proceso' | 'Resuelto';
  priority: 'Alta' | 'Media' | 'Baja';
  creation_date: Date; // <-- CAMBIO
  resolution_date?: Date; // <-- CAMBIO
  assigned_to?: number; // El ID del técnico ahora será un número (la clave primaria de Django)
  assigned_to_name?: string; // Propiedad de solo lectura que viene del serializer
  resolution_time?: string; // <-- CAMBIO
}

export interface Technician {
  id: number; // El ID ahora es un número
  name: string;
  specialty: string;
}