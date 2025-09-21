import { Component, OnInit, inject, signal } from '@angular/core';
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
  IonSearchbar,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { bulbOutline } from 'ionicons/icons';
import { take } from 'rxjs';

import { TipsService } from '../../core/services/tips.service';
import { Tip } from '../../core/models';

addIcons({ 'bulb-outline': bulbOutline });

@Component({
  selector: 'app-tips',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSearchbar,
    IonChip,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonText,
    IonSpinner,
    IonButton,
    IonIcon,
  ],
  templateUrl: './tips.page.html',
  styleUrls: ['./tips.page.scss'],
})
export class TipsPage implements OnInit {
  private readonly tipsService = inject(TipsService);

  tips = signal<Tip[]>([]);
  filteredTips = signal<Tip[]>([]);
  isLoading = signal<boolean>(false);
  searchTerm = signal<string>('');
  selectedType = signal<string>('');

  readonly types = [
    { label: 'Seguridad', value: 'seguridad' },
    { label: 'Relajacion', value: 'relajacion' },
    { label: 'Energia', value: 'energia' },
    { label: 'Sueno', value: 'sueno' },
    { label: 'DIY', value: 'diy' },
  ];

  ngOnInit(): void {
    this.loadTips();
  }

  onSearchChange(event: CustomEvent): void {
    const term = (event.detail.value as string) ?? '';
    this.searchTerm.set(term.trim());
    this.applyFilters();
  }

  applyType(type: string): void {
    this.selectedType.set(this.selectedType() === type ? '' : type);
    this.applyFilters();
  }

  private loadTips(): void {
    this.isLoading.set(true);
    this.tipsService
      .getTips()
      .pipe(take(1))
      .subscribe({
        next: (items) => {
          this.tips.set(items);
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
    const type = this.selectedType().toLowerCase();
    const filtered = this.tips().filter((tip) => {
      const text = `${tip.titulo} ${tip.contenido ?? ''}`.toLowerCase();
      const matchesTerm = term === '' || text.includes(term);
      const matchesType = type === '' || (tip.tipo ?? '').toLowerCase().includes(type);
      return matchesTerm && matchesType;
    });
    this.filteredTips.set(filtered);
  }
}
