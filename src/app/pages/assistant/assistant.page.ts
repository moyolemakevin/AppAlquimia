import { Component, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonAvatar,
  IonButton,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonText,
  IonTitle,
  IonToolbar,
  IonChip,
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import {
  chatbubbleEllipsesOutline,
  flashOutline,
  happyOutline,
  leafOutline,
  moonOutline,
  paperPlaneOutline,
  sparklesOutline,
} from 'ionicons/icons';
import { ActivatedRoute } from '@angular/router';
import { Subject, take, takeUntil } from 'rxjs';

import { AssistantService } from '../../core/services/assistant.service';
import { ChatMessage } from '../../core/models';

addIcons({
  'paper-plane-outline': paperPlaneOutline,
  'sparkles-outline': sparklesOutline,
  'leaf-outline': leafOutline,
  'flash-outline': flashOutline,
  'moon-outline': moonOutline,
  'happy-outline': happyOutline,
  'chatbubble-ellipses-outline': chatbubbleEllipsesOutline,
});

interface QuickPrompt {
  label: string;
  icon: string;
  description: string;
  query: string;
}

@Component({
  selector: 'app-assistant',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonText,
    IonFooter,
    IonInput,
    IonButton,
    IonIcon,
    IonChip,
    IonAvatar,
  ],
  templateUrl: './assistant.page.html',
  styleUrls: ['./assistant.page.scss'],
})
export class AssistantPage implements OnInit, OnDestroy {
  private readonly assistantService = inject(AssistantService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy$ = new Subject<void>();

  @ViewChild(IonContent, { static: true }) content?: IonContent;

  messages = signal<ChatMessage[]>([
    {
      sender: 'assistant',
      text: 'Hola, soy tu asistente de aromaterapia. Preguntame que aceite necesitas y te guiare paso a paso.',
      timestamp: new Date().toISOString(),
    },
  ]);
  suggestions = signal<string[]>([]);
  currentMessage = '';
  isSending = false;

  readonly quickPrompts: QuickPrompt[] = [
    {
      label: 'Relajacion nocturna',
      icon: 'moon-outline',
      description: 'Rutina antes de dormir',
      query: 'Que aceite puedo usar para relajarme antes de dormir?'
    },
    {
      label: 'Energia y enfoque',
      icon: 'flash-outline',
      description: 'Impulso matutino',
      query: 'Necesito un aceite para concentrarme y tener mas energia.'
    },
    {
      label: 'Cuidado de piel',
      icon: 'happy-outline',
      description: 'Rutina facial natural',
      query: 'Recomiendame un aceite esencial para mejorar la piel del rostro.'
    },
    {
      label: 'Ambiente zen',
      icon: 'leaf-outline',
      description: 'Difusor equilibrado',
      query: 'Que mezcla puedo usar en el difusor para crear un ambiente zen?'
    },
    {
      label: 'Mascotas seguras',
      icon: 'sparkles-outline',
      description: 'Bienestar para peludos',
      query: 'Hay aceites seguros para usar cerca de mis mascotas?'
    }
  ];

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const q = params.get('q');
      if (q) {
        this.currentMessage = q;
        this.handleSend();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async handleSend(): Promise<void> {
    const message = this.currentMessage.trim();
    if (message === '' || this.isSending) {
      return;
    }

    const userMessage: ChatMessage = {
      sender: 'user',
      text: message,
      timestamp: new Date().toISOString(),
    };
    this.appendMessage(userMessage);
    this.currentMessage = '';
    this.isSending = true;

    this.assistantService
      .sendMessage(message)
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const assistantMessage: ChatMessage = {
            sender: 'assistant',
            text: response.reply,
            timestamp: new Date().toISOString(),
            topic: response.topic,
          };
          this.appendMessage(assistantMessage);
          this.suggestions.set(response.suggestions);
          this.isSending = false;
        },
        error: () => {
          this.appendMessage({
            sender: 'assistant',
            text: 'Lo siento, no pude procesar tu solicitud. Intenta nuevamente.',
            timestamp: new Date().toISOString(),
          });
          this.isSending = false;
        },
      });
  }

  useSuggestion(suggestion: string): void {
    this.currentMessage = suggestion;
    this.handleSend();
  }

  private appendMessage(message: ChatMessage): void {
    this.messages.update((items) => [...items, message]);
    requestAnimationFrame(() => this.content?.scrollToBottom(200));
  }
}

