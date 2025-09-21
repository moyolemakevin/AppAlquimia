import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonList,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { personCircleOutline } from 'ionicons/icons';
import { take } from 'rxjs';

import { ProfileService, ProfileStats } from '../../core/services/profile.service';
import { User } from '../../core/models';

addIcons({ 'person-circle-outline': personCircleOutline });

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonList,
    IonText,
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

  ngOnInit(): void {
    this.loadProfile();
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