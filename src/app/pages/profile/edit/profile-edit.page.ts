import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { take } from 'rxjs';

import { ProfileService, UpdateProfilePayload } from '../../../core/services/profile.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models';

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonText,
  ],
  templateUrl: './profile-edit.page.html',
  styleUrls: ['./profile-edit.page.scss'],
})
export class ProfileEditPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastController = inject(ToastController);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    password: [''],
  });

  isSubmitting = false;
  apiError: string | null = null;
  profile?: User;

  ngOnInit(): void {
    this.loadProfile();
  }

  cancel(): void {
    this.router.navigateByUrl('/app/profile');
  }

  save(): void {
    this.apiError = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.form.disable();

    const { name, email, phone, password } = this.form.getRawValue();

    const payload: UpdateProfilePayload = {
      nombre_completo: name ?? undefined,
      email: email ?? undefined,
      telefono: phone ?? undefined,
    };

    if ((password ?? '').trim() !== '') {
      payload.password = password ?? undefined;
    }

    this.profileService
      .updateProfile(payload)
      .pipe(take(1))
      .subscribe({
        next: async (updatedProfile) => {
          this.isSubmitting = false;
          this.form.enable();
          this.authService.updateCachedUser(updatedProfile);
          await this.presentToast('Perfil actualizado', 'success');
          this.router.navigateByUrl('/app/profile');
        },
        error: async (error) => {
          this.isSubmitting = false;
          this.form.enable();
          this.apiError = error?.error?.message ?? 'No pudimos guardar los cambios';
          await this.presentToast(this.apiError ?? 'No pudimos guardar los cambios', 'danger');
        },
      });
  }

  private loadProfile(): void {
    this.profileService
      .getProfile()
      .pipe(take(1))
      .subscribe({
        next: ({ profile }) => {
          this.profile = profile;
          this.form.patchValue({
            name: profile.name,
            email: profile.email,
            phone: profile.phone ?? '',
          });
        },
      });
  }

  private async presentToast(message: string, color: 'success' | 'danger' = 'success'): Promise<void> {
    const toast = await this.toastController.create({ message, duration: 2000, position: 'bottom', color });
    await toast.present();
  }
}

