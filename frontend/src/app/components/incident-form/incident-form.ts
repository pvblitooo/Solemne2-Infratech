import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'; 
import { Router, ActivatedRoute, RouterModule } from '@angular/router'; 
import { IncidentService } from '../../services/incident';
import { Observable, Subject, takeUntil } from 'rxjs';
import { Incident, Technician } from '../../models/incident';


@Component({
  selector: 'app-incident-form',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, DatePipe],
  templateUrl: './incident-form.html',
  styleUrl: './incident-form.scss',
  providers: [DatePipe]
})
export class IncidentFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private incidentService = inject(IncidentService);
  private destroy$ = new Subject<void>();

  incidentForm!: FormGroup;
  isEditMode = false;
  incidentId: string | null = null;
  currentIncident: Incident | undefined;

  // Listas de opciones para los selectores
  types: string[] = ['Hardware', 'Software', 'Red', 'Otro'];
  areas: string[] = ['Ventas', 'Operaciones', 'TI Interna', 'Recursos Humanos', 'Finanzas'];
  priorities: string[] = ['Alta', 'Media', 'Baja'];
  statuses: string[] = ['Nuevo', 'En Proceso', 'Resuelto'];
  technicians$!: Observable<Technician[]>;

  ngOnInit(): void {
    this.technicians$ = this.incidentService.getTechnicians();

    // Corregido: El nombre del control ahora es 'assigned_to' para coincidir con el modelo y la API.
    // El valor inicial es `null` para el select de "Sin asignar".
    this.incidentForm = this.fb.group({
      type: ['', Validators.required],
      area: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(10)]],
      priority: ['Media', Validators.required],
      assigned_to: [null], // <--- CORRECCIÓN CLAVE
      status: ['Nuevo', Validators.required]
    });

    this.route.paramMap.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      this.incidentId = params.get('id');
      if (this.incidentId) {
        this.isEditMode = true;
        this.loadIncidentData(this.incidentId);
      } else {
        this.isEditMode = false;
        this.incidentForm.get('status')?.disable(); // Correcto: Deshabilitar el campo 'status' al crear.
      }
    });
  }

  loadIncidentData(id: string): void {
    this.incidentService.getIncidentById(id).pipe(
      takeUntil(this.destroy$)
    ).subscribe(incident => {
      if (incident) {
        this.currentIncident = incident;
        // Corregido: Usa los nombres de propiedad en snake_case del modelo de la API.
        this.incidentForm.patchValue({
          type: incident.type,
          area: incident.area,
          description: incident.description,
          priority: incident.priority,
          assigned_to: incident.assigned_to || null, // <--- CORRECCIÓN CLAVE
          status: incident.status
        });
        this.incidentForm.get('status')?.enable();
      } else {
        console.error('Incidente no encontrado para editar, ID:', id);
        this.router.navigate(['/incidents']);
      }
    });
  }

  get f() { return this.incidentForm.controls; }

  // Corregido: Se ha unificado y limpiado la lógica de onSubmit.
  onSubmit(): void {
    if (this.incidentForm.invalid) {
      this.incidentForm.markAllAsTouched();
      return;
    }

    // Usar getRawValue() para obtener todos los valores del formulario,
    // incluyendo los que estén deshabilitados (como 'status' al crear).
    const formValue = this.incidentForm.getRawValue();

    if (this.isEditMode && this.currentIncident) {
      // Llama al servicio de ACTUALIZACIÓN con el ID y los datos del formulario.
      this.incidentService.updateIncident(this.currentIncident.id, formValue).subscribe({
        next: () => {
          console.log('Incidente actualizado exitosamente vía API');
          this.router.navigate(['/incidents']);
        },
        error: (err) => console.error('Error al actualizar incidente:', err)
      });
    } else {
      // Llama al servicio de CREACIÓN con los datos del formulario.
      this.incidentService.addIncident(formValue).subscribe({
        next: () => {
          console.log('Incidente creado exitosamente vía API');
          this.router.navigate(['/incidents']);
        },
        error: (err) => console.error('Error al crear incidente:', err)
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/incidents']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}