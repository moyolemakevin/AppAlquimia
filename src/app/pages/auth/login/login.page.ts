import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonButton,
  IonChip,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonNote,
  IonSpinner,
} from '@ionic/angular/standalone';
import { Router, RouterModule } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  eyeOffOutline,
  eyeOutline,
  flashOutline,
  leafOutline,
  lockClosedOutline,
  personOutline,
  shieldCheckmarkOutline,
  sparklesOutline,
} from 'ionicons/icons';
import { take } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';

addIcons({
  'person-outline': personOutline,
  'lock-closed-outline': lockClosedOutline,
  'eye-outline': eyeOutline,
  'eye-off-outline': eyeOffOutline,
  'leaf-outline': leafOutline,
  'flash-outline': flashOutline,
  'shield-checkmark-outline': shieldCheckmarkOutline,
  'sparkles-outline': sparklesOutline,
});

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    IonContent,
    IonItem,
    IonInput,
    IonButton,
    IonIcon,
    IonChip,
    IonLabel,
    IonNote,
    IonSpinner,
  ],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastController = inject(ToastController);

  readonly form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  isSubmitting = false;
  apiError: string | null = null;
  passwordFieldType: 'password' | 'text' = 'password';

  get usernameControl() {
    return this.form.get('username');
  }

  get passwordControl() {
    return this.form.get('password');
  }

  togglePasswordVisibility(): void {
    this.passwordFieldType = this.passwordFieldType === 'password' ? 'text' : 'password';
  }

  async submit(): Promise<void> {
    this.apiError = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.form.disable();

    const { username, password } = this.form.getRawValue();

    this.authService
      .login({ username: username ?? '', password: password ?? '' })
      .pipe(take(1))
      .subscribe({
        next: async () => {
          this.isSubmitting = false;
          this.form.enable();
          await this.presentToast('Bienvenido a Alquimia Esencial', 'success');
          this.router.navigateByUrl('/app/home');
        },
        error: async (error) => {
          this.isSubmitting = false;
          this.form.enable();
          this.apiError = error?.error?.message ?? 'No fue posible iniciar sesion';
          await this.presentToast(this.apiError ?? 'No fue posible iniciar sesion', 'danger');
        },
      });
  }

  private async presentToast(message: string, color: 'primary' | 'danger' | 'success' = 'primary'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      position: 'bottom',
      color,
    });

    await toast.present();
  }
}
