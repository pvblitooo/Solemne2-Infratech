import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'; // Para formularios reactivos
import { Router, ActivatedRoute, RouterModule } from '@angular/router'; // Router para navegar, ActivatedRoute para params, RouterModule para routerLink (si se usa en el template)
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
export class IncidentFormComponent implements OnInit, OnDestroy { // Implementar OnDestroy
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private incidentService = inject(IncidentService);
  private destroy$ = new Subject<void>(); // Subject para desuscripciones

  incidentForm!: FormGroup;
  isEditMode = false;
  incidentId: string | null = null;
  currentIncident: Incident | undefined; // Para guardar el incidente actual en modo edición

  types: string[] = ['Hardware', 'Software', 'Red', 'Otro'];
  areas: string[] = ['Ventas', 'Operaciones', 'TI Interna', 'Recursos Humanos', 'Finanzas'];
  priorities: string[] = ['Alta', 'Media', 'Baja'];
  statuses: string[] = ['Nuevo', 'En Proceso', 'Resuelto']; // Opciones para el estado
  technicians$!: Observable<Technician[]>;

  ngOnInit(): void {
    this.technicians$ = this.incidentService.getTechnicians();

    this.incidentForm = this.fb.group({
      type: ['', Validators.required],
      area: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(10)]],
      priority: ['Media', Validators.required],
      assignedTo: [''],
      status: ['Nuevo', Validators.required] // Añadir control de estado, requerido
    });

    this.route.paramMap.pipe(
      takeUntil(this.destroy$) // Desuscribirse cuando el componente se destruya
    ).subscribe(params => {
      this.incidentId = params.get('id');
      if (this.incidentId) {
        this.isEditMode = true;
        this.loadIncidentData(this.incidentId);
      } else {
        this.isEditMode = false;
        // Asegurar que el estado por defecto sea 'Nuevo' y no editable al crear
        this.incidentForm.get('status')?.disable(); // Deshabilitar campo status al crear
      }
    });
  }

  loadIncidentData(id: string): void {
    this.incidentService.getIncidentById(id).pipe(
      takeUntil(this.destroy$)
    ).subscribe(incident => {
      if (incident) {
        this.currentIncident = incident; // Guardar el incidente original
        this.incidentForm.patchValue({
          type: incident.type,
          area: incident.area,
          description: incident.description,
          priority: incident.priority,
          assignedTo: incident.assignedTo || '',
          status: incident.status
        });
        this.incidentForm.get('status')?.enable(); // Habilitar campo status al editar
      } else {
        console.error('Incidente no encontrado para editar, ID:', id);
        this.router.navigate(['/incidents']); // Redirigir si no se encuentra
      }
    });
  }

  get f() { return this.incidentForm.controls; }

  onSubmit(): void {
    if (this.incidentForm.invalid) {
      this.incidentForm.markAllAsTouched();
      return;
    }

    const formValue = this.incidentForm.value;

    if (this.isEditMode && this.currentIncident) {
      // Lógica para ACTUALIZAR
      const updatedIncident: Incident = {
        ...this.currentIncident, // Mantiene id, creationDate y otras props no editables directamente
        type: formValue.type,
        area: formValue.area,
        description: formValue.description,
        priority: formValue.priority,
        assignedTo: formValue.assignedTo || undefined,
        status: formValue.status // El servicio se encarga de resolutionDate y resolutionTime
      };

      this.incidentService.updateIncident(updatedIncident).subscribe({
        next: (result) => {
          if (result) {
            console.log('Incidente actualizado exitosamente:', result);
            this.router.navigate(['/incidents']);
          } else {
            console.error('Fallo al actualizar incidente, no se encontró en el servicio.');
            // Mostrar error al usuario
          }
        },
        error: (err) => console.error('Error al actualizar incidente:', err)
      });

    } else if (!this.isEditMode) {
      // Lógica para CREAR
      const incidentDataToCreate: Omit<Incident, 'id' | 'creationDate' | 'status' | 'resolutionDate' | 'resolutionTime'> = {
        type: formValue.type,
        area: formValue.area,
        description: formValue.description,
        priority: formValue.priority,
        assignedTo: formValue.assignedTo || undefined
      };
      this.incidentService.addIncident(incidentDataToCreate).subscribe({
        next: (newIncident) => {
          console.log('Incidente creado exitosamente:', newIncident);
          this.router.navigate(['/incidents']);
        },
        error: (err) => console.error('Error al crear incidente:', err)
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/incidents']);
  }

  ngOnDestroy(): void { // Implementar ngOnDestroy
    this.destroy$.next();
    this.destroy$.complete();
  }
}