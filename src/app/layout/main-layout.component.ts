import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonApp,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonMenuToggle,
  IonRouterOutlet,
  IonSplitPane,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../core/services/auth.service';
import { getTimeGreeting } from '../core/utils/time.utils';

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  requiresAdmin?: boolean;
  action?: 'logout';
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonApp,
    IonSplitPane,
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonMenuToggle,
    IonRouterOutlet,
  ],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
})
export class MainLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly user = computed(() => this.authService.currentUser);
  readonly greeting = computed(() => {
    const current = this.user();
    const name = current?.name && current.name.trim() !== '' ? current.name : current?.username ?? 'Usuario';
    return `${getTimeGreeting()} ${name}`;
  });

  readonly menuItems: MenuItem[] = [
    { label: 'Inicio', icon: 'home-outline', route: '/app/home' },
    { label: 'Aceites Esenciales', icon: 'leaf-outline', route: '/app/aceites' },
    { label: 'Asistente IA', icon: 'chatbubble-ellipses-outline', route: '/app/assistant' },
    { label: 'Mis Favoritos', icon: 'heart-outline', route: '/app/favoritos' },
    { label: 'Tips y Consejos', icon: 'book-outline', route: '/app/tips' },
    { label: 'Notificaciones', icon: 'notifications-outline', route: '/app/notifications' },
    { label: 'Administracion', icon: 'settings-outline', route: '/app/admin', requiresAdmin: true },
    { label: 'Mi Perfil', icon: 'person-outline', route: '/app/profile' },
    { label: 'Editar Perfil', icon: 'create-outline', route: '/app/profile/edit' },
    { label: 'Cerrar Sesion', icon: 'log-out-outline', action: 'logout' },
  ];

  handleMenuItem(item: MenuItem): void {
    if (item.action === 'logout') {
      this.authService.logout();
      this.router.navigateByUrl('/login');
      return;
    }

    if (item.route) {
      this.router.navigateByUrl(item.route);
    }
  }

  canDisplay(item: MenuItem): boolean {
    if (!item.requiresAdmin) {
      return true;
    }

    return this.authService.currentUser?.role === 'admin';
  }
}