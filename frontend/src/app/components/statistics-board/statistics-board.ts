import { Component, OnInit, OnDestroy, inject, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js/auto'; 
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Incident } from '../../models/incident';
import { IncidentService } from '../../services/incident';

Chart.register(...registerables);

@Component({
  selector: 'app-statistics-board',
  imports: [CommonModule],
  templateUrl: './statistics-board.html',
  styleUrl: './statistics-board.scss'
})
export class StatisticsBoardComponent implements OnInit, AfterViewInit, OnDestroy {
  private incidentService = inject(IncidentService);
  private destroy$ = new Subject<void>();

  @ViewChild('incidentsByStateChartCanvas') incidentsByStateChartCanvas!: ElementRef<HTMLCanvasElement>;
  incidentsByStateChart: Chart | undefined;

  ngOnInit(): void {
    // No es necesario hacer nada aquí, lo manejamos en ngAfterViewInit
  }

  ngAfterViewInit(): void {
    // Corregido: Llamamos al método getIncidents() en lugar de suscribirnos a una propiedad.
    // getIncidents() sin argumentos traerá todos los incidentes.
    this.incidentService.getIncidents().pipe(
      takeUntil(this.destroy$)
    // Corregido: Tipamos explícitamente el parámetro 'incidents'
    ).subscribe((incidents: Incident[]) => {
      if (incidents && this.incidentsByStateChartCanvas) {
        this.createOrUpdateIncidentsByStateChart(incidents);
      }
    });
  }

  private createOrUpdateIncidentsByStateChart(incidents: Incident[]): void {
    const ctx = this.incidentsByStateChartCanvas.nativeElement.getContext('2d');
    if (!ctx) {
      console.error('No se pudo obtener el contexto 2D del canvas.');
      return;
    }

    const counts = incidents.reduce((acc, incident) => {
      acc[incident.status] = (acc[incident.status] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const labels = Object.keys(counts);
    const dataValues = Object.values(counts);

    if (this.incidentsByStateChart) {
      this.incidentsByStateChart.destroy();
    }

    this.incidentsByStateChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          label: 'Incidentes por Estado',
          data: dataValues,
          backgroundColor: [
            'rgba(0, 123, 255, 0.7)',  // Nuevo
            'rgba(255, 193, 7, 0.7)', // En Proceso
            'rgba(40, 167, 69, 0.7)',  // Resuelto
            'rgba(220, 53, 69, 0.7)',
            'rgba(108, 117, 125, 0.7)'
          ],
          borderColor: [
            'rgba(0, 123, 255, 1)',
            'rgba(255, 193, 7, 1)',
            'rgba(40, 167, 69, 1)',
            'rgba(220, 53, 69, 1)',
            'rgba(108, 117, 125, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Distribución de Incidentes por Estado',
            font: { size: 16 }
          }
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.incidentsByStateChart) {
      this.incidentsByStateChart.destroy();
    }
  }
}
