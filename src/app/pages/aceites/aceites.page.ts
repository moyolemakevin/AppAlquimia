import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
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
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonSearchbar,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { heartOutline, heart, funnelOutline } from 'ionicons/icons';
import { Subject, takeUntil, take } from 'rxjs';

import { AceitesService } from '../../core/services/aceites.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { Aceite } from '../../core/models';

addIcons({ heart: heart, 'heart-outline': heartOutline, 'funnel-outline': funnelOutline });

@Component({
  selector: 'app-aceites',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSearchbar,
    IonChip,
    IonList,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonText,
    IonSpinner,
    IonLabel,
    IonItem,
    IonInput,
  ],
  templateUrl: './aceites.page.html',
  styleUrls: ['./aceites.page.scss'],
})
export class AceitesPage implements OnInit, OnDestroy {
  private readonly aceitesService = inject(AceitesService);
  private readonly favoritesService = inject(FavoritesService);
  private readonly toastController = inject(ToastController);
  private readonly destroy$ = new Subject<void>();

  aceites = signal<Aceite[]>([]);
  filteredAceites = signal<Aceite[]>([]);
  isLoading = signal<boolean>(false);
  searchTerm = signal<string>('');
  selectedCategory = signal<string>('');
  advancedFiltersVisible = signal<boolean>(false);
  advancedFilters = signal<{ uso: string; emocion: string }>({ uso: '', emocion: '' });

  readonly categories = [
    { label: 'Relajacion', value: 'relajacion' },
    { label: 'Energia', value: 'energia' },
    { label: 'Sueno', value: 'sueno' },
  ];

  ngOnInit(): void {
    this.loadAceites();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchChange(event: CustomEvent): void {
    const value = (event.detail.value as string) ?? '';
    this.searchTerm.set(value.trim());
    this.applyFilters();
  }

  applyCategory(category: string): void {
    this.selectedCategory.set(this.selectedCategory() === category ? '' : category);
    this.applyFilters();
  }

  toggleAdvancedFilters(): void {
    this.advancedFiltersVisible.update((value) => !value);
  }

  updateAdvancedFilter(field: 'uso' | 'emocion', value: string): void {
    const current = this.advancedFilters();
    this.advancedFilters.set({ ...current, [field]: value.trim() });
    this.applyFilters();
  }

  toggleFavorite(aceite: Aceite): void {
    const isFav = aceite.isFavorite;
    const request = isFav
      ? this.favoritesService.removeFavorite(aceite.id)
      : this.favoritesService.addFavorite(aceite.id);

    request.pipe(take(1)).subscribe({
      next: async () => {
        const updated = { ...aceite, isFavorite: !isFav };
        this.aceites.update((items) => items.map((item) => (item.id === aceite.id ? updated : item)));
        this.applyFilters();
        await this.presentToast(updated.isFavorite ? 'Agregado a favoritos' : 'Eliminado de favoritos', updated.isFavorite ? 'success' : 'medium');
      },
      error: async () => {
        await this.presentToast('No fue posible actualizar el favorito', 'danger');
      },
    });
  }

  private loadAceites(): void {
    this.isLoading.set(true);
    this.aceitesService
      .getAceites()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items) => {
          this.aceites.set(items);
          this.applyFilters();
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        },
      });
  }

  private applyFilters(): void {
    const term = this.searchTerm().toLowerCase();
    const category = this.selectedCategory().toLowerCase();
    const { uso, emocion } = this.advancedFilters();
    const usoTerm = uso.toLowerCase();
    const emocionTerm = emocion.toLowerCase();

    const filtered = this.aceites().filter((aceite) => {
      const textPool = `${aceite.nombre} ${aceite.descripcion ?? ''} ${aceite.beneficios ?? ''} ${aceite.emociones_relacionadas ?? ''} ${aceite.usos ?? ''}`.toLowerCase();
      const matchesSearch = term === '' || textPool.includes(term);
      const matchesCategory =
        category === '' ||
        textPool.includes(category) ||
        (aceite.beneficios ?? '').toLowerCase().includes(category) ||
        (aceite.emociones_relacionadas ?? '').toLowerCase().includes(category);
      const matchesUso = usoTerm === '' || (aceite.usos ?? '').toLowerCase().includes(usoTerm);
      const matchesEmocion = emocionTerm === '' || (aceite.emociones_relacionadas ?? '').toLowerCase().includes(emocionTerm);
      return matchesSearch && matchesCategory && matchesUso && matchesEmocion;
    });

    this.filteredAceites.set(filtered);
  }

  private async presentToast(message: string, color: 'primary' | 'success' | 'danger' | 'medium' = 'primary'): Promise<void> {
    const toast = await this.toastController.create({ message, duration: 2000, position: 'bottom', color });
    await toast.present();
  }
}
