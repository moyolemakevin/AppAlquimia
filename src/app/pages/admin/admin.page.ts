import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonAccordion,
  IonAccordionGroup,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonRow,
  IonCol,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { analyticsOutline, constructOutline, peopleOutline } from 'ionicons/icons';
import { Observable, take } from 'rxjs';

import { DashboardService } from '../../core/services/dashboard.service';
import { AceitesService } from '../../core/services/aceites.service';
import { TipsService } from '../../core/services/tips.service';
import { UsersService } from '../../core/services/users.service';
import { DashboardData, Aceite, Tip, User } from '../../core/models';

addIcons({ 'analytics-outline': analyticsOutline, 'construct-outline': constructOutline, 'people-outline': peopleOutline });

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonSpinner,
    IonButton,
    IonIcon,
    IonAccordionGroup,
    IonAccordion,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonSegment,
    IonSegmentButton,
    IonSelect,
    IonSelectOption,
    IonText,
  ],
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
})
export class AdminPage implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly aceitesService = inject(AceitesService);
  private readonly tipsService = inject(TipsService);
  private readonly usersService = inject(UsersService);
  private readonly fb = inject(FormBuilder);
  private readonly toastController = inject(ToastController);

  dashboard = signal<DashboardData | null>(null);
  aceites = signal<Aceite[]>([]);
  tips = signal<Tip[]>([]);
  users = signal<User[]>([]);

  isLoadingDashboard = signal<boolean>(false);
  isLoadingAceites = signal<boolean>(false);
  isLoadingTips = signal<boolean>(false);
  isLoadingUsers = signal<boolean>(false);

  readonly aceiteForm = this.fb.group({
    id: [null as number | null],
    nombre: ['', Validators.required],
    descripcion: [''],
    beneficios: ['', Validators.required],
    usos: [''],
    precauciones: [''],
    emociones_relacionadas: [''],
  });

  readonly tipForm = this.fb.group({
    id: [null as number | null],
    titulo: ['', Validators.required],
    tipo: [''],
    contenido: ['', Validators.required],
  });

  ngOnInit(): void {
    this.refreshAll();
  }

  refreshAll(): void {
    this.loadDashboard();
    this.loadAceites();
    this.loadTips();
    this.loadUsers();
  }

  editAceite(aceite: Aceite): void {
    this.aceiteForm.patchValue({
      id: aceite.id,
      nombre: aceite.nombre,
      descripcion: aceite.descripcion ?? '',
      beneficios: aceite.beneficios ?? '',
      usos: aceite.usos ?? '',
      precauciones: aceite.precauciones ?? '',
      emociones_relacionadas: aceite.emociones_relacionadas ?? '',
    });
  }

  resetAceiteForm(): void {
    this.aceiteForm.reset({ id: null, nombre: '', descripcion: '', beneficios: '', usos: '', precauciones: '', emociones_relacionadas: '' });
  }

  submitAceite(): void {
    if (this.aceiteForm.invalid) {
      this.aceiteForm.markAllAsTouched();
      return;
    }

    const value = this.aceiteForm.getRawValue();
    const payload: Partial<Aceite> = {
      nombre: value.nombre ?? '',
      descripcion: value.descripcion ?? '',
      beneficios: value.beneficios ?? '',
      usos: value.usos ?? '',
      precauciones: value.precauciones ?? '',
      emociones_relacionadas: value.emociones_relacionadas ?? '',
    };

    let request$: Observable<unknown>;
    if (value.id) {
      request$ = this.aceitesService.updateAceite(value.id, payload);
    } else {
      request$ = this.aceitesService.createAceite(payload);
    }

    request$.pipe(take(1)).subscribe({
      next: async () => {
        await this.presentToast('Aceite guardado con exito', 'success');
        this.resetAceiteForm();
        this.loadAceites();
      },
      error: async () => {
        await this.presentToast('No pudimos guardar el aceite', 'danger');
      },
    });
  }

  deleteAceite(id: number): void {
    this.aceitesService.deleteAceite(id).pipe(take(1)).subscribe({
      next: async () => {
        await this.presentToast('Aceite eliminado', 'medium');
        this.loadAceites();
      },
    });
  }

  editTip(tip: Tip): void {
    this.tipForm.patchValue({
      id: tip.id,
      titulo: tip.titulo,
      tipo: tip.tipo ?? '',
      contenido: tip.contenido ?? '',
    });
  }

  resetTipForm(): void {
    this.tipForm.reset({ id: null, titulo: '', tipo: '', contenido: '' });
  }

  submitTip(): void {
    if (this.tipForm.invalid) {
      this.tipForm.markAllAsTouched();
      return;
    }

    const value = this.tipForm.getRawValue();
    const payload: Partial<Tip> = {
      titulo: value.titulo ?? '',
      tipo: value.tipo ?? '',
      contenido: value.contenido ?? '',
    };

    let request$: Observable<unknown>;
    if (value.id) {
      request$ = this.tipsService.updateTip(value.id, payload);
    } else {
      request$ = this.tipsService.createTip(payload);
    }

    request$.pipe(take(1)).subscribe({
      next: async () => {
        await this.presentToast('Tip guardado', 'success');
        this.resetTipForm();
        this.loadTips();
      },
      error: async () => {
        await this.presentToast('No pudimos guardar el tip', 'danger');
      },
    });
  }

  deleteTip(id: number): void {
    this.tipsService.deleteTip(id).pipe(take(1)).subscribe({
      next: async () => {
        await this.presentToast('Tip eliminado', 'medium');
        this.loadTips();
      },
    });
  }

  updateUser(user: User, changes: Partial<User>): void {
    this.usersService
      .updateUser(user.id, {
        rol: changes.role ?? user.role,
        nivel: changes.level ?? user.level,
        activo: changes.active ?? user.active,
      })
      .pipe(take(1))
      .subscribe({
        next: async () => {
          await this.presentToast('Usuario actualizado', 'success');
          this.loadUsers();
        },
        error: async () => {
          await this.presentToast('No pudimos actualizar el usuario', 'danger');
        },
      });
  }

  private loadDashboard(): void {
    this.isLoadingDashboard.set(true);
    this.dashboardService
      .getDashboard()
      .pipe(take(1))
      .subscribe({
        next: (data) => {
          this.dashboard.set(data);
          this.isLoadingDashboard.set(false);
        },
        error: () => {
          this.isLoadingDashboard.set(false);
        },
      });
  }

  private loadAceites(): void {
    this.isLoadingAceites.set(true);
    this.aceitesService
      .getAceites()
      .pipe(take(1))
      .subscribe({
        next: (items) => {
          this.aceites.set(items);
          this.isLoadingAceites.set(false);
        },
        error: () => {
          this.isLoadingAceites.set(false);
        },
      });
  }

  private loadTips(): void {
    this.isLoadingTips.set(true);
    this.tipsService
      .getTips()
      .pipe(take(1))
      .subscribe({
        next: (items) => {
          this.tips.set(items);
          this.isLoadingTips.set(false);
        },
        error: () => {
          this.isLoadingTips.set(false);
        },
      });
  }

  private loadUsers(): void {
    this.isLoadingUsers.set(true);
    this.usersService
      .getUsers()
      .pipe(take(1))
      .subscribe({
        next: (items) => {
          this.users.set(items);
          this.isLoadingUsers.set(false);
        },
        error: () => {
          this.isLoadingUsers.set(false);
        },
      });
  }

  private async presentToast(message: string, color: 'success' | 'danger' | 'medium' = 'success'): Promise<void> {
    const toast = await this.toastController.create({ message, color, duration: 2000, position: 'bottom' });
    await toast.present();
  }
}
