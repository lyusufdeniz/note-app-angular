import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Tag } from '../../models/tag';
import { TagService } from '../../services/tag.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-tag-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="tag-dialog">
      <h2>{{ 'TAGS.CREATE_TITLE' | translate }}</h2>
      <div class="input-group">
        <input 
          type="text" 
          [(ngModel)]="tagName"
          [placeholder]="'TAGS.NAME_PLACEHOLDER' | translate"
          class="tag-input"
          autofocus>
      </div>
      <div class="color-picker">
        <button 
          *ngFor="let color of tagService.COLORS"
          [style.background-color]="color"
          [class.selected]="selectedColor === color"
          (click)="selectedColor = color"
          class="color-btn">
        </button>
      </div>
      <div class="preview" *ngIf="tagName && selectedColor">
        <span class="tag-preview" [style.background-color]="selectedColor">
          {{ tagName }}
        </span>
      </div>
      <div class="actions">
        <button class="cancel-btn" (click)="cancel()">
          {{ 'TAGS.CANCEL' | translate }}
        </button>
        <button 
          class="save-btn" 
          [disabled]="!isValid"
          (click)="save()">
          {{ 'TAGS.SAVE' | translate }}
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./tag-dialog.component.scss']
})
export class TagDialogComponent {
  tagName = '';
  selectedColor = '';

  constructor(public tagService: TagService) {}

  get isValid(): boolean {
    return this.tagName.trim().length > 0 && this.selectedColor !== '';
  }

  save(): void {
    if (this.isValid) {
      const tag = this.tagService.addTag(this.tagName.trim(), this.selectedColor);
      // Close dialog and return tag
    }
  }

  cancel(): void {
    // Close dialog
  }
} 