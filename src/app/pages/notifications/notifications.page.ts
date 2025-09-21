import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonRefresher,
  IonRefresherContent,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { notificationsOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { take } from 'rxjs';

import { NotificationsService } from '../../core/services/notifications.service';
import { NotificationItem } from '../../core/models';

addIcons({ 'notifications-outline': notificationsOutline, 'checkmark-circle-outline': checkmarkCircleOutline });

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonText,
  ],
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
})
export class NotificationsPage implements OnInit {
  private readonly notificationsService = inject(NotificationsService);
  private readonly toastController = inject(ToastController);

  notifications = signal<NotificationItem[]>([]);
  isLoading = signal<boolean>(false);

  ngOnInit(): void {
    this.loadNotifications();
  }

  ionViewWillEnter(): void {
    this.loadNotifications();
  }

  refresh(event: CustomEvent): void {
    this.loadNotifications(() => (event.target as HTMLIonRefresherElement).complete());
  }

  markAsRead(notification: NotificationItem): void {
    if (notification.leida) {
      return;
    }

    this.notificationsService
      .markAsRead(notification.id, true)
      .pipe(take(1))
      .subscribe({
        next: async () => {
          this.notifications.update((items) =>
            items.map((item) => (item.id === notification.id ? { ...item, leida: 1 } : item)),
          );
          await this.presentToast('Notificacion marcada como leida', 'success');
        },
        error: async () => {
          await this.presentToast('No pudimos actualizar la notificacion', 'danger');
        },
      });
  }

  private loadNotifications(onComplete?: () => void): void {
    this.isLoading.set(true);
    this.notificationsService
      .getNotifications()
      .pipe(take(1))
      .subscribe({
        next: (items) => {
          this.notifications.set(items);
          this.isLoading.set(false);
          onComplete?.();
        },
        error: () => {
          this.isLoading.set(false);
          onComplete?.();
        },
      });
  }

  private async presentToast(message: string, color: 'success' | 'danger' = 'success'): Promise<void> {
    const toast = await this.toastController.create({ message, duration: 2000, position: 'bottom', color });
    await toast.present();
  }
}
