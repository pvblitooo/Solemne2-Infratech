export interface Incident {
  id: string;
  type: string;
  area: string;
  description: string;
  status: 'Nuevo' | 'En Proceso' | 'Resuelto';
  priority: 'Alta' | 'Media' | 'Baja';
  creationDate: Date;
  resolutionDate?: Date;
  assignedTo?: string;
  resolutionTime?: string;
}

export interface Technician {
  id: string;
  name: string;
  specialty: string;
}