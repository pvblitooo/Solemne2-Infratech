import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; 
import { RouterModule } from '@angular/router'; // Para routerLink
import { FormsModule } from '@angular/forms';
import { Incident } from '../../models/incident';
import { IncidentService } from '../../services/incident';
import { Observable, Subject, combineLatest, BehaviorSubject } from 'rxjs'; // BehaviorSubject
import { map, startWith, debounceTime, takeUntil, distinctUntilChanged, first } from 'rxjs/operators'; // Otros operadores
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';      // Para el input de fecha
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';          // Para el ícono de editar y PDF
import { MatDatepickerModule } from '@angular/material/datepicker'; // Para un selector de fecha de Material
import { MatNativeDateModule } from '@angular/material/core';       // Necesario para MatDatepicker


import jsPDF from 'jspdf';
// Cambia la importación de jspdf-autotable para obtener la función directamente
import autoTable, { HookData } from 'jspdf-autotable'; // <--- CAMBIO IMPORTANTE AQUÍ



@Component({
  selector: 'app-incident-list',
  imports: [
    CommonModule, 
    RouterModule, 
    DatePipe, 
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule // <--- Añadir
  ],
  templateUrl: './incident-list.html',
  styleUrl: './incident-list.scss',
  providers: [DatePipe]
})
export class IncidentListComponent implements OnInit, OnDestroy {
  private incidentService = inject(IncidentService);
  private datePipe = inject(DatePipe); // Inyectar DatePipe para usarlo en el filtro de fecha
  private destroy$ = new Subject<void>();

  allIncidents$!: Observable<Incident[]>;
  filteredIncidents$!: Observable<Incident[]>; // Será inicializado en ngOnInit

  // BehaviorSubjects para los filtros
  filterType$ = new BehaviorSubject<string>('');
  filterArea$ = new BehaviorSubject<string>(''); // Filtro adicional por área
  filterStatus$ = new BehaviorSubject<string>('');
  filterPriority$ = new BehaviorSubject<string>('');
  filterDate$ = new BehaviorSubject<string>(''); // Formato YYYY-MM-DD

  // Opciones para los selectores de filtro (podrían venir del servicio o ser dinámicas)
  types: string[] = ['Hardware', 'Software', 'Red', 'Otro'];
  areas: string[] = ['Ventas', 'Operaciones', 'TI Interna', 'Recursos Humanos', 'Finanzas'];
  statuses: string[] = ['Nuevo', 'En Proceso', 'Resuelto'];
  priorities: string[] = ['Alta', 'Media', 'Baja'];

  // Propiedades para ngModel (vinculación bidireccional con los inputs del template)
  currentFilterType: string = '';
  currentFilterArea: string = '';
  currentFilterStatus: string = '';
  currentFilterPriority: string = '';
  currentFilterDate: string = '';


  ngOnInit(): void {
const testDoc = new jsPDF();
  

    this.allIncidents$ = this.incidentService.getIncidents();

    this.filteredIncidents$ = combineLatest([
      this.allIncidents$,
      this.filterType$.pipe(startWith(''), debounceTime(300), distinctUntilChanged()),
      this.filterArea$.pipe(startWith(''), debounceTime(300), distinctUntilChanged()),
      this.filterStatus$.pipe(startWith(''), debounceTime(300), distinctUntilChanged()),
      this.filterPriority$.pipe(startWith(''), debounceTime(300), distinctUntilChanged()),
      this.filterDate$.pipe(startWith(''), debounceTime(300), distinctUntilChanged())
    ]).pipe(
      map(([incidents, type, area, status, priority, date]) => {
        console.log('Filtrando con:', { type, area, status, priority, date }); // Para depuración
        return incidents.filter(incident =>
          (type ? incident.type.toLowerCase().includes(type.toLowerCase()) : true) &&
          (area ? incident.area.toLowerCase().includes(area.toLowerCase()) : true) &&
          (status ? incident.status === status : true) &&
          (priority ? incident.priority === priority : true) &&
          (date ? this.isSameDate(incident.creationDate, date) : true)
        );
      }),
      takeUntil(this.destroy$)
    );
  }

  // Métodos para actualizar los BehaviorSubjects cuando cambian los ngModel
  onFilterTypeChange(value: string): void { this.filterType$.next(value); }
  onFilterAreaChange(value: string): void { this.filterArea$.next(value); }
  onFilterStatusChange(value: string): void { this.filterStatus$.next(value); }
  onFilterPriorityChange(value: string): void { this.filterPriority$.next(value); }
  onFilterDateChange(value: string | null): void { // El input date puede devolver null
    this.filterDate$.next(value || ''); // Enviar string vacío si es null
  }

  private isSameDate(incidentCreationDate: Date, filterDateStr: string): boolean {
    if (!filterDateStr) return true; // Si no hay fecha de filtro, no filtrar por fecha
    // El input date devuelve 'YYYY-MM-DD'. Necesitamos comparar solo la parte de la fecha.
    const incidentDateFormatted = this.datePipe.transform(incidentCreationDate, 'yyyy-MM-dd');
    return incidentDateFormatted === filterDateStr;
  }

  isOverdue(incident: Incident): boolean {
    if (incident.status === 'Resuelto') return false;
    const fortyEightHoursInMs = 48 * 60 * 60 * 1000;
    const creationTime = new Date(incident.creationDate).getTime();
    const currentTime = Date.now();
    return (currentTime - creationTime) > fortyEightHoursInMs;
  }

  generatePdfReport(): void {
  console.log('generatePdfReport Clickeado!');

  this.filteredIncidents$.pipe(
    first(),
    takeUntil(this.destroy$)
  ).subscribe(incidentsToReport => {
    console.log('Suscripción a filteredIncidents$ ejecutada.');
    console.log('Incidentes para reportar:', incidentsToReport);

    if (!incidentsToReport || incidentsToReport.length === 0) {
      console.log('No hay incidentes para reportar, mostrando alerta.');
      alert('No hay incidentes para reportar según los filtros actuales.');
      return;
    }

    try {
      console.log('Iniciando creación de PDF...');
      // Ya no necesitas el cast "as jsPDFWithAutoTable"
      const doc = new jsPDF(); // <--- CAMBIO: Quitar el cast
      const reportDate = this.datePipe.transform(new Date(), 'dd/MM/yyyy HH:mm');
      const reportTitle = `Informe de Incidentes Técnicos - InfraTech S.A.`;
      const generatedOn = `Generado el: ${reportDate}`;

      doc.setFontSize(18);
      doc.text(reportTitle, 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(generatedOn, 14, 30);

      const head = [[/* ... tus cabeceras ... */]];
      const body = incidentsToReport.map(inc => [/* ... tus datos de fila ... */]);

      console.log('Cabeceras (head):', head);
      console.log('Cuerpo (body):', body);

      // --- CAMBIO IMPORTANTE EN CÓMO SE LLAMA A autoTable ---
      autoTable(doc, { // <--- AQUÍ EL CAMBIO
        startY: 38,
        head: head,
        body: body,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: [255,255,255] },
        margin: { top: 10, right: 14, bottom: 10, left: 14 },
        tableWidth: 'auto',
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 18 },
          3: { cellWidth: 40 },
        },
        didDrawPage: (data: HookData) => {
          doc.setFontSize(10);
          const pageNum = (doc.internal as any).getNumberOfPages();
          doc.text('Página ' + pageNum, data.settings.margin.left, doc.internal.pageSize.height - 10);
        }
      });
      // --- FIN DEL CAMBIO ---

      const fileName = `Reporte_Incidentes_${this.datePipe.transform(new Date(), 'yyyyMMdd_HHmmss')}.pdf`;
      console.log('Intentando guardar PDF con nombre:', fileName);
      doc.save(fileName);
      console.log('Comando doc.save() ejecutado.');

    } catch (error) {
      console.error('ERROR DURANTE LA GENERACIÓN DEL PDF:', error);
      alert('Ocurrió un error al generar el PDF. Revisa la consola del navegador para más detalles.');
    }
  });
}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  clearFilters(): void {
  this.currentFilterType = '';
  this.currentFilterArea = '';
  this.currentFilterStatus = '';
  this.currentFilterPriority = '';
  this.currentFilterDate = '';

  this.filterType$.next('');
  this.filterArea$.next('');
  this.filterStatus$.next('');
  this.filterPriority$.next('');
  this.filterDate$.next('');
}
}