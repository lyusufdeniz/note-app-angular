import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Tag } from '../models/tag';

@Injectable({
  providedIn: 'root'
})
export class TagService {
  private readonly STORAGE_KEY = 'tags_data';
  private tags: Tag[] = [];
  private tagsSubject = new BehaviorSubject<Tag[]>([]);

  // iOS-style predefined colors
  readonly COLORS = [
    '#FF3B30', // Red
    '#FF9500', // Orange
    '#FFCC00', // Yellow
    '#34C759', // Green
    '#5856D6', // Purple
    '#007AFF', // Blue
    '#32ADE6', // Light Blue
    '#FF2D55', // Pink
  ];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const savedTags = localStorage.getItem(this.STORAGE_KEY);
    if (savedTags) {
      this.tags = JSON.parse(savedTags);
      this.tagsSubject.next(this.tags);
    }
  }

  private updateStorage(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.tags));
    this.tagsSubject.next(this.tags);
  }

  getTags(): Observable<Tag[]> {
    return this.tagsSubject.asObservable();
  }

  addTag(name: string, color: string): Tag {
    const newTag: Tag = {
      id: Date.now().toString(),
      name,
      color
    };
    this.tags.push(newTag);
    this.updateStorage();
    return newTag;
  }

  updateTag(tag: Tag): void {
    const index = this.tags.findIndex(t => t.id === tag.id);
    if (index !== -1) {
      this.tags[index] = tag;
      this.updateStorage();
    }
  }

  deleteTag(tagId: string): void {
    this.tags = this.tags.filter(t => t.id !== tagId);
    this.updateStorage();
    this.tagsSubject.next(this.tags);
  }

  getTag(id: string): Tag | undefined {
    return this.tags.find(tag => tag.id === id);
  }

  deleteAllTags(): void {
    this.tags = [];
    this.updateStorage();
    this.tagsSubject.next(this.tags);
  }
} 