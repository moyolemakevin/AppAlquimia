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
  IonSpinner,
} from '@ionic/angular/standalone';
import { Router, RouterModule } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { take } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
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
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastController = inject(ToastController);

  readonly form = this.fb.group(
    {
      name: ['', [Validators.required, Validators.minLength(3)]],
      username: ['', [Validators.required, Validators.minLength(4)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    {
      validators: (group) => {
        const password = group.get('password')?.value;
        const confirm = group.get('confirmPassword')?.value;
        return password === confirm ? null : { passwordMismatch: true };
      },
    },
  );

  isSubmitting = false;
  apiError: string | null = null;

  get passwordMismatch(): boolean {
    return Boolean(this.form.errors?.['passwordMismatch']);
  }

  async submit(): Promise<void> {
    this.apiError = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.form.disable();

    const { username, password, email, name, phone } = this.form.getRawValue();

    this.authService
      .register({
        username: username ?? '',
        password: password ?? '',
        email: email ?? '',
        name: name ?? '',
        phone: phone ?? undefined,
      })
      .pipe(take(1))
      .subscribe({
        next: async () => {
          this.isSubmitting = false;
          this.form.enable();
          await this.presentToast('Cuenta creada. Bienvenido/a!', 'success');
          this.router.navigateByUrl('/app/home');
        },
        error: async (error) => {
          this.isSubmitting = false;
          this.form.enable();
          this.apiError = error?.error?.message ?? 'No se pudo crear la cuenta';
          await this.presentToast(this.apiError ?? 'No se pudo crear la cuenta', 'danger');
        },
      });
  }

  private async presentToast(message: string, color: 'success' | 'danger' = 'success'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      position: 'bottom',
      color,
    });

    await toast.present();
  }
}
