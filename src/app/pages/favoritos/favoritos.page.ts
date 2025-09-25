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
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { heart, heartOutline, leafOutline } from 'ionicons/icons';
import { take } from 'rxjs';

import { FavoritesService } from '../../core/services/favorites.service';
import { Aceite } from '../../core/models';

addIcons({ heart: heart, 'heart-outline': heartOutline, 'leaf-outline': leafOutline });

@Component({
  selector: 'app-favoritos',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonButton,
    IonIcon,
    
    IonSpinner,
  ],
  templateUrl: './favoritos.page.html',
  styleUrls: ['./favoritos.page.scss'],
})
export class FavoritosPage implements OnInit {
  private readonly favoritesService = inject(FavoritesService);
  private readonly toastController = inject(ToastController);
  private readonly router = inject(Router);

  favoritos = signal<Aceite[]>([]);
  isLoading = signal<boolean>(false);
  private readonly lastSync = signal<string>('Reciente');

  ngOnInit(): void {
    this.loadFavorites();
  }

  ionViewWillEnter(): void {
    this.loadFavorites();
  }

  refresh(event: CustomEvent): void {
    this.loadFavorites(() => (event.target as HTMLIonRefresherElement).complete());
  }

  remove(aceite: Aceite): void {
    this.favoritesService
      .removeFavorite(aceite.id)
      .pipe(take(1))
      .subscribe({
        next: async () => {
          this.favoritos.update((items) => items.filter((item) => item.id !== aceite.id));
          await this.presentToast('Aceite eliminado de favoritos', 'medium');
          this.touchSync();
        },
        error: async () => {
          await this.presentToast('No pudimos actualizar tus favoritos', 'danger');
        },
      });
  }

  goToAceites(): void {
    this.router.navigateByUrl('/app/aceites');
  }

  lastUpdated(): string {
    return this.lastSync();
  }

  private loadFavorites(onComplete?: () => void): void {
    this.isLoading.set(true);
    this.favoritesService
      .getFavorites(true)
      .pipe(take(1))
      .subscribe({
        next: (items) => {
          this.favoritos.set(items as Aceite[]);
          this.isLoading.set(false);
          this.touchSync();
          onComplete?.();
        },
        error: () => {
          this.isLoading.set(false);
          onComplete?.();
        },
      });
  }

  private touchSync(): void {
    const now = new Date();
    const formatted = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    this.lastSync.set(formatted);
  }

  private async presentToast(message: string, color: 'primary' | 'medium' | 'danger' = 'primary'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      color,
    });
    await toast.present();
  }
}
