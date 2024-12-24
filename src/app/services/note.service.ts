import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Note } from '../../app/models/note';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class NoteService {
  private readonly STORAGE_KEY = 'notes_data';
  private notes: Note[] = [];
  private notesSubject = new BehaviorSubject<Note[]>([]);
  private readonly PAGE_SIZE = 5;

  constructor(private translate: TranslateService) {
    this.loadFromStorage();
  }

  private showError(key: string) {
    Swal.fire({
      title: this.translate.instant(key),
      icon: 'error',
      timer: 2000,
      showConfirmButton: false,
      customClass: {
        container: 'ios-dialog-container',
        popup: 'ios-dialog',
        title: 'ios-dialog-title'
      }
    });
  }

  private loadFromStorage(): void {
    try {
      const savedNotes = localStorage.getItem(this.STORAGE_KEY);
      if (savedNotes) {
        this.notes = JSON.parse(savedNotes);
        // Ensure dates are properly converted from strings
        this.notes = this.notes.map(note => ({
          ...note,
          lastModified: new Date(note.lastModified)
        }));
        this.notesSubject.next(this.notes);
      }
    } catch (error) {
      console.error('Error loading notes from storage:', error);
      this.showError('MESSAGES.ERROR.LOAD');
    }
  }

  private updateStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.notes));
      // Notify subscribers with the current state
      this.notesSubject.next([...this.notes]);
    } catch (error) {
      console.error('Error saving notes to storage:', error);
      this.showError('MESSAGES.ERROR.SAVE');
    }
  }

  getNotes(): Observable<Note[]> {
    return this.notesSubject.asObservable();
  }

  addNote(title: string, content: string): string {
    const newNote: Note = {
      id: Date.now().toString(),
      title,
      content,
      lastModified: new Date(),
      tags: []
    };
    this.notes.unshift(newNote);
    this.updateStorage();
    
    return newNote.id;
  }

  updateNote(note: Note): void {
    const index = this.notes.findIndex(n => n.id === note.id);
    if (index !== -1) {
      this.notes[index] = { ...note, lastModified: new Date() };
      this.updateStorage();
    }
  }

  deleteNote(id: string): void {
    this.notes = this.notes.filter(note => note.id !== id);
    this.updateStorage();
  }

  getNote(id: string): Observable<Note | undefined> {
    return new Observable(subscriber => {
      const note = this.notes.find(n => n.id === id);
      subscriber.next(note);
      subscriber.complete();
    });
  }

  getAllNotes(): Note[] {
    return [...this.notes];
  }

  importNotes(notes: Note[]): void {
    // Convert all dates to proper Date objects
    this.notes = notes.map(note => ({
      ...note,
      lastModified: new Date(note.lastModified),
      // Ensure each note has all required properties
      id: note.id || Date.now().toString(),
      title: note.title || 'Untitled Note',
      content: note.content || '',
      tags: note.tags || []
    }));

    // Sort notes by last modified date
    this.notes.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
    
    // Update storage and notify subscribers
    this.updateStorage();
    this.notesSubject.next(this.notes);
  }

  getNotesByPage(page: number): Note[] {
    const start = page * this.PAGE_SIZE;
    const end = start + this.PAGE_SIZE;
    return [...this.notes]
      .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
      .slice(start, end);
  }

  hasMorePages(currentPage: number): boolean {
    return (currentPage + 1) * this.PAGE_SIZE < this.notes.length;
  }

  getTotalPages(): number {
    return Math.ceil(this.notes.length / this.PAGE_SIZE);
  }

  deleteAllNotes(): void {
    this.notes = [];
    this.updateStorage();
  }

  removeTagFromAllNotes(tagId: string): void {
    this.notes = this.notes.map(note => ({
      ...note,
      tags: note.tags?.filter(t => t.id !== tagId)
    }));
    this.updateStorage();
  }

  removeAllTagsFromNotes(): void {
    this.notes = this.notes.map(note => ({
      ...note,
      tags: []
    }));
    this.updateStorage();
  }

  mergeNotes(importedNotes: Note[]): void {
    const currentNotes = this.getAllNotes();
    const mergedNotes = [...currentNotes];
    
    // Process each imported note
    importedNotes.forEach(importedNote => {
      const existingNoteIndex = currentNotes.findIndex(note => note.id === importedNote.id);
      
      if (existingNoteIndex === -1) {
        // If note doesn't exist, add it
        mergedNotes.push({
          ...importedNote,
          lastModified: new Date(importedNote.lastModified)
        });
      } else {
        // If note exists, keep the most recently modified version
        const existingNote = currentNotes[existingNoteIndex];
        const existingDate = new Date(existingNote.lastModified).getTime();
        const importedDate = new Date(importedNote.lastModified).getTime();
        
        if (importedDate > existingDate) {
          mergedNotes[existingNoteIndex] = {
            ...importedNote,
            lastModified: new Date(importedNote.lastModified)
          };
        }
      }
    });

    // Sort notes by last modified date
    mergedNotes.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());

    // Update the notes array and storage
    this.notes = mergedNotes;
    this.updateStorage();
  }
} 
