import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; 
import { RouterModule } from '@angular/router'; 
import { FormsModule } from '@angular/forms';
import { Incident } from '../../models/incident';
import { IncidentService } from '../../services/incident';
import { Observable, Subject, combineLatest, BehaviorSubject } from 'rxjs'; 
import { map, startWith, debounceTime, takeUntil, distinctUntilChanged, first, switchMap } from 'rxjs/operators';     


import jsPDF from 'jspdf';
import autoTable, { HookData } from 'jspdf-autotable'; 



@Component({
  selector: 'app-incident-list',
  imports: [
    CommonModule, 
    RouterModule, 
    DatePipe, 
    FormsModule,
  ],
  templateUrl: './incident-list.html',
  styleUrl: './incident-list.scss',
  providers: [DatePipe]
})
export class IncidentListComponent implements OnInit, OnDestroy {
  private incidentService = inject(IncidentService);
  private datePipe = inject(DatePipe); 
  private destroy$ = new Subject<void>();

  allIncidents$!: Observable<Incident[]>;
  filteredIncidents$!: Observable<Incident[]>; 

  filterType$ = new BehaviorSubject<string>('');
  filterArea$ = new BehaviorSubject<string>(''); 
  filterStatus$ = new BehaviorSubject<string>('');
  filterPriority$ = new BehaviorSubject<string>('');
  filterDate$ = new BehaviorSubject<string>(''); 

  // Opciones para los selectores de filtro 
  types: string[] = ['Hardware', 'Software', 'Red', 'Otro'];
  areas: string[] = ['Ventas', 'Operaciones', 'TI Interna', 'Recursos Humanos', 'Finanzas'];
  statuses: string[] = ['Nuevo', 'En Proceso', 'Resuelto'];
  priorities: string[] = ['Alta', 'Media', 'Baja'];

  // Propiedades para ngModel 
  currentFilterType: string = '';
  currentFilterArea: string = '';
  currentFilterStatus: string = '';
  currentFilterPriority: string = '';
  currentFilterDate: string = '';


  ngOnInit(): void {
const testDoc = new jsPDF();
  

    this.filteredIncidents$ = combineLatest([
      this.filterType$.pipe(startWith(''), distinctUntilChanged()),
      this.filterArea$.pipe(startWith(''), distinctUntilChanged()),
      this.filterStatus$.pipe(startWith(''), distinctUntilChanged()),
      this.filterPriority$.pipe(startWith(''), distinctUntilChanged()),
      this.filterDate$.pipe(startWith(''), distinctUntilChanged())
    ]).pipe(
      debounceTime(300), // Esperar 300ms después del último cambio de filtro
      switchMap(([type, area, status, priority, date]) => {
        // Construye un objeto de filtros solo con los valores que no están vacíos
        const filters = { type, area, status, priority, date };
        // Llama al servicio con los filtros actuales
        return this.incidentService.getIncidents(filters);
      }),
      takeUntil(this.destroy$) // Desuscribirse al destruir el componente
    );
  }

  // Métodos para actualizar los BehaviorSubjects cuando cambian los ngModel
  onFilterTypeChange(value: string): void { this.filterType$.next(value); }
  onFilterAreaChange(value: string): void { this.filterArea$.next(value); }
  onFilterStatusChange(value: string): void { this.filterStatus$.next(value); }
  onFilterPriorityChange(value: string): void { this.filterPriority$.next(value); }
  onFilterDateChange(value: string | null): void { 
    this.filterDate$.next(value || ''); 
  }

  private isSameDate(incidentCreationDate: Date, filterDateStr: string): boolean {
    if (!filterDateStr) return true; 
    
    const incidentDateFormatted = this.datePipe.transform(incidentCreationDate, 'yyyy-MM-dd');
    return incidentDateFormatted === filterDateStr;
  }

  isOverdue(incident: Incident): boolean {
    if (incident.status === 'Resuelto') return false;
    const fortyEightHoursInMs = 48 * 60 * 60 * 1000;
    const creationTime = new Date(incident.creation_date).getTime();
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
      const doc = new jsPDF();
      const reportDate = this.datePipe.transform(new Date(), 'dd/MM/yyyy HH:mm');
      const reportTitle = `Informe de Incidentes Técnicos - InfraTech S.A.`;
      const generatedOn = `Generado el: ${reportDate}`;

      doc.setFontSize(18);
      doc.text(reportTitle, 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(generatedOn, 14, 30);

      // --- CORRECCIÓN: Definimos las cabeceras de la tabla ---
      const head = [[
        'ID', 'Tipo', 'Área', 'Descripción', 'Estado',
        'Prioridad', 'F. Creación', 'Asignado', 'F. Resolución', 'T. Resolución'
      ]];

      // --- CORRECCIÓN: Llenamos el cuerpo de la tabla con los datos de cada incidente ---
      const body = incidentsToReport.map(inc => [
        inc.id.substring(0, 8),
        inc.type,
        inc.area,
        inc.description.substring(0, 35) + (inc.description.length > 35 ? '...' : ''),
        inc.status,
        inc.priority,
        this.datePipe.transform(inc.creation_date, 'dd/MM/yy HH:mm') || 'N/A',
        inc.assigned_to_name || 'N/A',
        inc.resolution_date ? (this.datePipe.transform(inc.resolution_date, 'dd/MM/yy HH:mm') || 'N/A') : 'N/A',
        inc.resolution_time || 'N/A'
      ]);

      console.log('Cabeceras (head):', head);
      console.log('Cuerpo (body):', body);

      autoTable(doc, {
        startY: 38,
        head: head,
        body: body,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
        margin: { top: 10, right: 14, bottom: 10, left: 14 },
        tableWidth: 'auto',
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 18 }, // ID
          3: { cellWidth: 40 }, // Descripción
        },
        didDrawPage: (data: HookData) => {
          doc.setFontSize(10);
          const pageNum = (doc.internal as any).getNumberOfPages();
          doc.text('Página ' + pageNum, data.settings.margin.left, doc.internal.pageSize.height - 10);
        }
      });

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