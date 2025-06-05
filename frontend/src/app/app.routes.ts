import { Routes } from '@angular/router';
import { IncidentListComponent } from './components/incident-list/incident-list'; 
import { IncidentFormComponent } from './components/incident-form/incident-form';
import { StatisticsBoardComponent } from './components/statistics-board/statistics-board';

export const routes: Routes = [
    { path: '', redirectTo: 'incidents', pathMatch: 'full' },
  { path: 'incidents', component: IncidentListComponent, title: 'Lista de Incidentes' },
  { path: 'incidents/new', component: IncidentFormComponent, title: 'Nuevo Incidente' }, // Ruta para crear
  { path: 'incidents/edit/:id', component: IncidentFormComponent, title: 'Editar Incidente' }, // Ruta para editar (el :id es un parámetro)
  { path: 'statistics', component: StatisticsBoardComponent, title: 'Estadísticas de Incidentes' }, // Ruta añadida
  { path: '**', redirectTo: 'incidents' }
];
