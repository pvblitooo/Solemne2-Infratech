import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Incident, Technician } from '../models/incident';

@Injectable({
  providedIn: 'root'
})
export class IncidentService {
  private http = inject(HttpClient);

  private apiUrl = 'http://127.0.0.1:8000/api';

  constructor() { }

  getIncidents(filters: { [param: string]: string | number | boolean } = {}): Observable<Incident[]> {
    let params = new HttpParams();
    for (const key in filters) {
      if (filters[key]) { 
        params = params.append(key, filters[key]);
      }
    }
    return this.http.get<Incident[]>(`${this.apiUrl}/incidents/`, { params });
  }

  getTechnicians(): Observable<Technician[]> {
    return this.http.get<Technician[]>(`${this.apiUrl}/technicians/`);
  }

  getIncidentById(id: string): Observable<Incident> {
    return this.http.get<Incident>(`${this.apiUrl}/incidents/${id}/`);
  }

  addIncident(incidentData: Partial<Incident>): Observable<Incident> {
    return this.http.post<Incident>(`${this.apiUrl}/incidents/`, incidentData).pipe(
      tap(() => console.log('Incidente creado vía API'))
    );
  }

  updateIncident(id: string, incidentData: Partial<Incident>): Observable<Incident> {
    return this.http.put<Incident>(`${this.apiUrl}/incidents/${id}/`, incidentData).pipe(
      tap(() => console.log(`Incidente ${id} actualizado vía API`))
    );
  }

}