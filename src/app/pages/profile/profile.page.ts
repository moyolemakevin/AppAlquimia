import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonButton,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonLabel,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { personCircleOutline, shieldCheckmarkOutline, sparklesOutline } from 'ionicons/icons';
import { take } from 'rxjs';

import { ProfileService, ProfileStats } from '../../core/services/profile.service';
import { User } from '../../core/models';

addIcons({
  'person-circle-outline': personCircleOutline,
  'shield-checkmark-outline': shieldCheckmarkOutline,
  'sparkles-outline': sparklesOutline,
});

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonText,
    IonChip,
    IonLabel,
    IonIcon,
  ],
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  private readonly profileService = inject(ProfileService);
  private readonly router = inject(Router);

  profile = signal<User | null>(null);
  stats = signal<ProfileStats | null>(null);
  isLoading = signal<boolean>(false);

  readonly roleLabelComputed = computed(() => (this.profile()?.role === 'admin' ? 'Administrador' : 'Miembro'));

  ngOnInit(): void {
    this.loadProfile();
  }

  get initials(): string {
    const user = this.profile();
    if (!user) {
      return 'AE';
    }

    const reference = user.name && user.name.trim() !== '' ? user.name : user.username ?? 'Alquimia Esencial';
    return reference
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'AE';
  }

  get roleLabel(): string {
    return this.roleLabelComputed();
  }

  get memberSince(): string {
    const value = this.profile()?.registeredAt;
    if (!value) {
      return 'Sin registro';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'Sin registro';
    }
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}/${month}/${day}`;
  }

  get lastAccess(): string {
    const value = this.stats()?.ultimo_login;
    if (!value) {
      return 'Sin registro';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'Sin registro';
    }
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  editProfile(): void {
    this.router.navigateByUrl('/app/profile/edit');
  }

  private loadProfile(): void {
    this.isLoading.set(true);
    this.profileService
      .getProfile()
      .pipe(take(1))
      .subscribe({
        next: ({ profile, stats }) => {
          this.profile.set(profile);
          this.stats.set(stats ? { ...stats } : null);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        },
      });
  }
}
