import { Component, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonButton,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonList,
  IonText,
  IonTitle,
  IonToolbar,
  IonChip,
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { paperPlaneOutline } from 'ionicons/icons';
import { ActivatedRoute } from '@angular/router';
import { Subject, take, takeUntil } from 'rxjs';

import { AssistantService } from '../../core/services/assistant.service';
import { ChatMessage } from '../../core/models';

addIcons({ 'paper-plane-outline': paperPlaneOutline });

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
    IonText,
    IonFooter,
    IonInput,
    IonButton,
    IonIcon,
    IonChip,
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
