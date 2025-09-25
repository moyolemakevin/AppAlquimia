import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonChip,
  IonContent,
  IonIcon,
  IonLabel,
  IonSpinner,
  IonHeader,
  IonToolbar,
  IonTitle,
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  chatbubbleEllipsesOutline,
  leafOutline,
  moonOutline,
  flashOutline,
  personOutline,
  heartOutline,
  bookOutline,
  notificationsOutline,
} from 'ionicons/icons';
import { take } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { AceitesService } from '../../core/services/aceites.service';
import { Aceite } from '../../core/models';
import { getTimeGreeting } from '../../core/utils/time.utils';

addIcons({
  'chatbubble-ellipses-outline': chatbubbleEllipsesOutline,
  'leaf-outline': leafOutline,
  'moon-outline': moonOutline,
  'flash-outline': flashOutline,
  'person-outline': personOutline,
  'heart-outline': heartOutline,
  'book-outline': bookOutline,
  'notifications-outline': notificationsOutline,
});

@Component({
  selector: 'app-home',
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
    IonChip,
    IonLabel,
    IonSpinner,
  ],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly aceitesService = inject(AceitesService);
  private readonly router = inject(Router);

  readonly user = computed(() => this.authService.currentUser);
  readonly greeting = computed(() => {
    const base = getTimeGreeting();
    const name = this.user()?.name && this.user()!.name.trim() !== '' ? this.user()!.name : this.user()?.username ?? 'Usuario';
    return `${base}, ${name}`;
  });

  highlightedAceites = signal<Aceite[]>([]);
  isLoadingAceites = signal<boolean>(false);

  readonly quickPrompts = [
    { label: 'Que aceite me recomiendas para relajarme?', icon: 'leaf-outline', query: 'relajarme' },
    { label: 'Cual es bueno para dormir mejor?', icon: 'moon-outline', query: 'dormir mejor' },
    { label: 'Que aceite ayuda con la concentracion?', icon: 'flash-outline', query: 'concentracion' },
  ];

  readonly shortcuts = [
    { label: 'Explorar aceites', icon: 'leaf-outline', route: '/app/aceites' },
    { label: 'Mis favoritos', icon: 'heart-outline', route: '/app/favoritos' },
    { label: 'Tips y consejos', icon: 'book-outline', route: '/app/tips' },
    { label: 'Mi perfil', icon: 'person-outline', route: '/app/profile' },
    { label: 'Notificaciones', icon: 'notifications-outline', route: '/app/notifications' },
  ];

  ngOnInit(): void {
    this.loadHighlightedAceites();
  }

  openAssistant(query?: string): void {
    this.router.navigate(['/app/assistant'], { queryParams: query ? { q: query } : undefined });
  }

  navigateTo(route: string): void {
    this.router.navigateByUrl(route);
  }

  private loadHighlightedAceites(): void {
    this.isLoadingAceites.set(true);
    this.aceitesService
      .getAceites()
      .pipe(take(1))
      .subscribe({
        next: (items) => {
          this.highlightedAceites.set(items.slice(0, 3));
          this.isLoadingAceites.set(false);
        },
        error: () => {
          this.isLoadingAceites.set(false);
        },
      });
  }
}
