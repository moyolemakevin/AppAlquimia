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
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { heart, heartOutline } from 'ionicons/icons';
import { take } from 'rxjs';

import { FavoritesService } from '../../core/services/favorites.service';
import { Aceite } from '../../core/models';

addIcons({ heart: heart, 'heart-outline': heartOutline });

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
    IonText,
    IonSpinner,
  ],
  templateUrl: './favoritos.page.html',
  styleUrls: ['./favoritos.page.scss'],
})
export class FavoritosPage implements OnInit {
  private readonly favoritesService = inject(FavoritesService);
  private readonly toastController = inject(ToastController);

  favoritos = signal<Aceite[]>([]);
  isLoading = signal<boolean>(false);

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
        },
        error: async () => {
          await this.presentToast('No pudimos actualizar tus favoritos', 'danger');
        },
      });
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
          onComplete?.();
        },
        error: () => {
          this.isLoading.set(false);
          onComplete?.();
        },
      });
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


