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

  types: string[] = ['Hardware', 'Software', 'Red', 'Otro'];
  areas: string[] = ['Ventas', 'Operaciones', 'TI Interna', 'Recursos Humanos', 'Finanzas'];
  priorities: string[] = ['Alta', 'Media', 'Baja'];
  statuses: string[] = ['Nuevo', 'En Proceso', 'Resuelto']; 
  technicians$!: Observable<Technician[]>;

  ngOnInit(): void {
    this.technicians$ = this.incidentService.getTechnicians();

    this.incidentForm = this.fb.group({
      type: ['', Validators.required],
      area: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(10)]],
      priority: ['Media', Validators.required],
      assignedTo: [''],
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
        
        this.incidentForm.get('status')?.disable(); 
      }
    });
  }

  loadIncidentData(id: string): void {
    this.incidentService.getIncidentById(id).pipe(
      takeUntil(this.destroy$)
    ).subscribe(incident => {
      if (incident) {
        this.currentIncident = incident; 
        this.incidentForm.patchValue({
          type: incident.type,
          area: incident.area,
          description: incident.description,
          priority: incident.priority,
          assignedTo: incident.assignedTo || '',
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

  onSubmit(): void {
    if (this.incidentForm.invalid) {
      this.incidentForm.markAllAsTouched();
      return;
    }

    const formValue = this.incidentForm.value;

    if (this.isEditMode && this.currentIncident) {
      // Lógica para ACTUALIZAR
      const updatedIncident: Incident = {
        ...this.currentIncident, 
        type: formValue.type,
        area: formValue.area,
        description: formValue.description,
        priority: formValue.priority,
        assignedTo: formValue.assignedTo || undefined,
        status: formValue.status 
      };

      this.incidentService.updateIncident(updatedIncident).subscribe({
        next: (result) => {
          if (result) {
            console.log('Incidente actualizado exitosamente:', result);
            this.router.navigate(['/incidents']);
          } else {
            console.error('Fallo al actualizar incidente, no se encontró en el servicio.');
            
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

  ngOnDestroy(): void { 
    this.destroy$.next();
    this.destroy$.complete();
  }
}