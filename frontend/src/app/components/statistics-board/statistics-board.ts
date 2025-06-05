import { Component, OnInit, OnDestroy, inject, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js/auto'; // Importar Chart.js y sus componentes registrables
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Incident } from '../../models/incident';
import { IncidentService } from '../../services/incident';

// Registrar todos los componentes de Chart.js (necesario para Chart.js v3+)
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

  // Podrías añadir más ViewChild y propiedades de Chart para otros gráficos

  ngOnInit(): void {
    // La lógica de creación del gráfico se moverá a ngAfterViewInit
    // para asegurar que el canvas esté disponible en el DOM.
  }

  ngAfterViewInit(): void {
    // Nos suscribimos a los incidentes para (re)crear el gráfico cuando cambien
    this.incidentService.incidents$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(incidents => {
      if (incidents && this.incidentsByStateChartCanvas) { // Asegurarse que el canvas existe
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

    // Destruir gráfico anterior si existe para evitar superposiciones o fugas de memoria al actualizar
    if (this.incidentsByStateChart) {
      this.incidentsByStateChart.destroy();
    }

    this.incidentsByStateChart = new Chart(ctx, {
      type: 'doughnut', // Tipos populares: 'pie', 'bar', 'line', 'doughnut'
      data: {
        labels: labels,
        datasets: [{
          label: 'Incidentes por Estado',
          data: dataValues,
          backgroundColor: [ // Colores para cada estado
            'rgba(0, 123, 255, 0.7)',  // Azul para 'Nuevo' (o el primer estado que aparezca)
            'rgba(255, 193, 7, 0.7)', // Amarillo para 'En Proceso'
            'rgba(40, 167, 69, 0.7)',  // Verde para 'Resuelto'
            'rgba(220, 53, 69, 0.7)', // Rojo (si hubiera otro estado)
            'rgba(108, 117, 125, 0.7)'// Gris (si hubiera otro estado)
          ],
          borderColor: [ // Bordes para cada segmento
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
        maintainAspectRatio: false, // Importante para que el gráfico se ajuste al contenedor
        plugins: {
          legend: {
            position: 'top', // Posición de la leyenda
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
    // Destruir el gráfico explícitamente si existe
    if (this.incidentsByStateChart) {
      this.incidentsByStateChart.destroy();
    }
  }
}