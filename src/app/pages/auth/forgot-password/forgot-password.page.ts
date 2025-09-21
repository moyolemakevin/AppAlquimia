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
  IonSpinner,
} from '@ionic/angular/standalone';
import { Router, RouterModule } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { take } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
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
    IonSpinner,
  ],
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
})
export class ForgotPasswordPage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toastController = inject(ToastController);
  private readonly router = inject(Router);

  readonly form = this.fb.group({
    username: ['', Validators.required],
    answer: [''],
    newPassword: [''],
  });

  securityQuestion: string | null = null;
  isSubmitting = false;
  apiError: string | null = null;

  async submit(): Promise<void> {
    this.apiError = null;

    if (!this.securityQuestion) {
      if (!this.form.get('username')?.value) {
        this.form.get('username')?.markAsTouched();
        return;
      }

      await this.requestSecurityQuestion();
      return;
    }

    if (!this.form.get('answer')?.value || !this.form.get('newPassword')?.value) {
      this.form.get('answer')?.markAsTouched();
      this.form.get('newPassword')?.markAsTouched();
      return;
    }

    await this.resetPassword();
  }

  private async requestSecurityQuestion(): Promise<void> {
    this.isSubmitting = true;
    this.form.disable();

    const username = this.form.get('username')?.value ?? '';

    this.authService
      .forgotPassword({ username })
      .pipe(take(1))
      .subscribe({
        next: async (response: any) => {
          this.isSubmitting = false;
          this.form.enable();
          this.securityQuestion = response?.data?.question ?? 'Responde la pregunta de seguridad';
          this.form.get('answer')?.setValidators([Validators.required]);
          this.form.get('newPassword')?.setValidators([Validators.required, Validators.minLength(6)]);
          this.form.get('answer')?.updateValueAndValidity();
          this.form.get('newPassword')?.updateValueAndValidity();
          await this.presentToast('Responde la pregunta de seguridad para continuar');
        },
        error: async (error) => {
          this.isSubmitting = false;
          this.form.enable();
          this.apiError = error?.error?.message ?? 'No pudimos obtener la pregunta de seguridad';
          await this.presentToast(this.apiError, 'danger');
        },
      });
  }

  private async resetPassword(): Promise<void> {
    this.isSubmitting = true;
    this.form.disable();

    const { username, answer, newPassword } = this.form.getRawValue();

    this.authService
      .forgotPassword({
        username: username ?? '',
        answer: answer ?? '',
        newPassword: newPassword ?? '',
      })
      .pipe(take(1))
      .subscribe({
        next: async () => {
          this.isSubmitting = false;
          this.form.enable();
          await this.presentToast('Clave actualizada. Inicia sesion con tu nueva clave', 'success');
          this.router.navigateByUrl('/login');
        },
        error: async (error) => {
          this.isSubmitting = false;
          this.form.enable();
          this.apiError = error?.error?.message ?? 'No fue posible actualizar la clave';
          await this.presentToast(this.apiError, 'danger');
        },
      });
  }

  private async presentToast(message: string, color: 'primary' | 'success' | 'danger' = 'primary'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      position: 'bottom',
      color,
    });

    await toast.present();
  }
}