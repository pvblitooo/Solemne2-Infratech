import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { Incident, Technician } from '../models/incident';

@Injectable({
  providedIn: 'root'
})
export class IncidentService {
  private initialIncidents: Incident[] = [
    {
      id: uuidv4(),
      type: 'Software',
      area: 'Ventas',
      description: 'CRM no carga los datos de clientes.',
      status: 'Nuevo',
      priority: 'Alta',
      creationDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), 
      assignedTo: 'Ana Pérez'
    },
    {
      id: uuidv4(),
      type: 'Hardware',
      area: 'Operaciones',
      description: 'Impresora de bodega no funciona.',
      status: 'En Proceso',
      priority: 'Media',
      creationDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), 
      assignedTo: 'Carlos Ruiz'
    },
    {
      id: uuidv4(),
      type: 'Red',
      area: 'TI Interna',
      description: 'Acceso lento a la carpeta compartida.',
      status: 'Resuelto',
      priority: 'Baja',
      creationDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), 
      resolutionDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), 
      assignedTo: 'Luisa Vera',
      resolutionTime: '1d 0h 0m' 
    }
  ];

  private incidentsSubject = new BehaviorSubject<Incident[]>([...this.initialIncidents]);
  incidents$ = this.incidentsSubject.asObservable(); 

  private technicians: Technician[] = [
    { id: 'tech1', name: 'Ana Pérez', specialty: 'Software CRM' },
    { id: 'tech2', name: 'Carlos Ruiz', specialty: 'Hardware y Periféricos' },
    { id: 'tech3', name: 'Luisa Vera', specialty: 'Redes y Servidores' },
    { id: 'tech4', name: 'Mario Durán', specialty: 'Software General' },
  ];

  constructor() {
    console.log("IncidentService inicializado con:", this.initialIncidents);
  }

  getIncidents(): Observable<Incident[]> {
    return this.incidents$;
  }

  getTechnicians(): Observable<Technician[]> {
    return of([...this.technicians]);
  }

  getIncidentById(id: string): Observable<Incident | undefined> {
    const incident = this.incidentsSubject.getValue().find(inc => inc.id === id);
    return of(incident);
  }

  
  addIncident(incidentData: Omit<Incident, 'id' | 'creationDate' | 'status' | 'resolutionDate' | 'resolutionTime'>): Observable<Incident> {
    const newIncident: Incident = {
      id: uuidv4(),
      ...incidentData, 
      status: 'Nuevo', 
      creationDate: new Date(),
      
    };
    const currentIncidents = this.incidentsSubject.getValue();
    this.incidentsSubject.next([...currentIncidents, newIncident]);
    console.log('Incidente añadido:', newIncident);
    return of(newIncident); 
  }
  
  updateIncident(updatedIncidentData: Incident): Observable<Incident | undefined> {
    let currentIncidents = this.incidentsSubject.getValue();
    const incidentIndex = currentIncidents.findIndex(inc => inc.id === updatedIncidentData.id);

    if (incidentIndex > -1) {
      const originalIncident = currentIncidents[incidentIndex];
      let processedIncident = { ...originalIncident, ...updatedIncidentData };

      
      if (processedIncident.status === 'Resuelto' && originalIncident.status !== 'Resuelto') {
        processedIncident.resolutionDate = new Date();
        processedIncident.resolutionTime = this.calculateResolutionTime(
          originalIncident.creationDate, 
          processedIncident.resolutionDate
        );
      } else if (processedIncident.status !== 'Resuelto' && originalIncident.status === 'Resuelto') {
        
        processedIncident.resolutionDate = undefined;
        processedIncident.resolutionTime = undefined;
      }

      currentIncidents[incidentIndex] = processedIncident;
      this.incidentsSubject.next([...currentIncidents]);
      console.log('Incidente actualizado:', processedIncident);
      return of(processedIncident);
    }
    console.error('Incidente no encontrado para actualizar:', updatedIncidentData.id);
    return of(undefined); 
  }

  // --- MÉTODO AUXILIAR ---
  private calculateResolutionTime(creationDate: Date, resolutionDate: Date | undefined): string | undefined {
    if (!resolutionDate) {
      return undefined;
    }
    let diff = resolutionDate.getTime() - new Date(creationDate).getTime();

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff -= days * (1000 * 60 * 60 * 24);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    diff -= hours * (1000 * 60 * 60);
    const minutes = Math.floor(diff / (1000 * 60));

    return `${days}d ${hours}h ${minutes}m`;
  }
  
}