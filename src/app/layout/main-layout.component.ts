import { Component, computed, inject } from '@angular/core';
import { addIcons } from 'ionicons';
import { CommonModule } from '@angular/common';
import {
  IonApp,
  IonBadge,
  IonChip,
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
  
  IonToolbar,
} from '@ionic/angular/standalone';
import { Router, RouterModule } from '@angular/router';
import { bookOutline, chatbubbleEllipsesOutline, createOutline, heartOutline, homeOutline, leafOutline, logOutOutline, notificationsOutline, personOutline, settingsOutline } from 'ionicons/icons';

import { AuthService } from '../core/services/auth.service';
import { getTimeGreeting } from '../core/utils/time.utils';

addIcons({
  'home-outline': homeOutline,
  'leaf-outline': leafOutline,
  'chatbubble-ellipses-outline': chatbubbleEllipsesOutline,
  'heart-outline': heartOutline,
  'book-outline': bookOutline,
  'notifications-outline': notificationsOutline,
  'settings-outline': settingsOutline,
  'person-outline': personOutline,
  'create-outline': createOutline,
  'log-out-outline': logOutOutline,
});

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
    
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonChip,
    IonBadge,
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

  readonly userInitials = computed(() => {
    const current = this.user();
    if (!current) {
      return 'AE';
    }

    const base = (current.name && current.name.trim() !== '' ? current.name : current.username ?? 'Alquimia Esencial')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');

    return base || 'AE';
  });

  readonly roleLabel = computed(() => (this.user()?.role === 'admin' ? 'Administrador' : 'Miembro'));

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

  isActive(route?: string | null): boolean {
    if (!route) {
      return false;
    }

    return this.router.url.startsWith(route);
  }
}


