import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  IonButton,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonText,
  IonTitle,
  IonToolbar,
  IonHeader,
  IonPage,
  IonButtons,
  IonSpinner,
} from '@ionic/angular/standalone';
import { Router, RouterModule } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { take } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonText,
    IonButton,
    IonButtons,
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

  get usernameControl() {
    return this.form.get('username');
  }

  get passwordControl() {
    return this.form.get('password');
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
          await this.presentToast(this.apiError, 'danger');
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