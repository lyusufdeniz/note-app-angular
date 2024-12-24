import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule, registerLocaleData } from '@angular/common';  // For *ngFor and pipes
import { Note } from '../../models/note';
import { NoteService } from '../../services/note.service';
import { ThemeService } from '../../services/theme.service';
import Swal from 'sweetalert2';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../services/language.service';
import { FormsModule } from '@angular/forms';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { TagService } from '../../services/tag.service';
import { Tag } from '../../models/tag';
import { DialogService } from '../../services/dialog.service';
import localeTr from '@angular/common/locales/tr';
import localeEn from '@angular/common/locales/en';
import { TimeFormatService } from '../../services/time-format.service';

interface GroupedNotes {
  date: string;
  notes: Note[];
}

@Component({
  selector: 'app-note-list',
  templateUrl: './note-list.component.html',
  styleUrls: ['./note-list.component.scss'],
  standalone: true,
  imports: [RouterModule, CommonModule, TranslateModule, FormsModule, InfiniteScrollModule]
})
export class NoteListComponent implements OnInit {
  displayedNotes: Note[] = [];
  allNotes: Note[] = [];
  currentPage = 0;
  loading = false;
  hasMore = true;
  searchQuery: string = '';
  selectedNote: Note | null = null;
  isDarkMode = false;
  currentLang = 'en';
  tags: Tag[] = [];
  availableTags: Tag[] = [];
  selectedTags: string[] = [];
  groupedNotes: GroupedNotes[] = [];
  is24HourFormat = false;
  private PAGE_SIZE = 5;

  constructor(
    private noteService: NoteService,
    private themeService: ThemeService,
    private router: Router,
    private languageService: LanguageService,
    private translate: TranslateService,
    private tagService: TagService,
    private dialogService: DialogService,
    private timeFormatService: TimeFormatService
  ) {
    // Register locales
    registerLocaleData(localeTr, 'tr');
    registerLocaleData(localeEn, 'en');

    this.themeService.isDarkMode$.subscribe(
      isDark => this.isDarkMode = isDark
    );
    this.languageService.currentLanguage$.subscribe(
      lang => {
        this.currentLang = lang;
      }
    );
    this.tagService.getTags().subscribe(tags => {
      this.availableTags = tags;
    });
    this.timeFormatService.is24HourFormat$.subscribe(
      is24Hour => this.is24HourFormat = is24Hour
    );
  }

  ngOnInit(): void {
    this.noteService.getNotes().subscribe(notes => {
      this.allNotes = notes;
      this.loadInitialNotes();
    });
  }

  private groupNotesByDate(notes: Note[]): GroupedNotes[] {
    const groups = notes.reduce((groups: { [key: string]: Note[] }, note) => {
      const date = new Date(note.lastModified).toLocaleDateString(this.currentLang, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(note);
      return groups;
    }, {});

    return Object.keys(groups).map(date => ({
      date,
      notes: groups[date]
    })).sort((a, b) => {
      return new Date(b.notes[0].lastModified).getTime() - 
             new Date(a.notes[0].lastModified).getTime();
    });
  }

  private loadInitialNotes(): void {
    this.currentPage = 0;
    this.hasMore = true;
    this.groupedNotes = []; // Clear existing notes
    this.loadMoreNotes();
  }

  onScroll(): void {
    console.log('Scrolled!'); // Debug log
    if (!this.loading && this.hasMore && !this.searchQuery && this.selectedTags.length === 0) {
      console.log('Loading more notes...'); // Debug log
      this.loadMoreNotes();
    }
  }

  private loadMoreNotes(): void {
    if (this.loading || !this.hasMore) return;

    console.log('Current page:', this.currentPage); // Debug log
    this.loading = true;
    const start = this.currentPage * this.PAGE_SIZE;
    const end = start + this.PAGE_SIZE;
    
    // Get all notes sorted by last modified date
    const sortedNotes = this.allNotes
      .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
    
    console.log('Total notes:', sortedNotes.length); // Debug log
    console.log('Loading notes from', start, 'to', end); // Debug log

    const newNotes = sortedNotes.slice(start, end);

    if (newNotes.length > 0) {
      const newGroupedNotes = this.groupNotesByDate(newNotes);
      this.mergeGroupedNotes(newGroupedNotes);
      this.currentPage++;
      this.hasMore = end < sortedNotes.length;
      console.log('Loaded notes:', newNotes.length); // Debug log
      console.log('Has more:', this.hasMore); // Debug log
    } else {
      this.hasMore = false;
    }

    setTimeout(() => {
      this.loading = false;
    }, 300);
  }

  private mergeGroupedNotes(newGroups: GroupedNotes[]): void {
    newGroups.forEach(newGroup => {
      const existingGroup = this.groupedNotes.find(g => g.date === newGroup.date);
      if (existingGroup) {
        existingGroup.notes.push(...newGroup.notes);
        existingGroup.notes.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
      } else {
        this.groupedNotes.push(newGroup);
      }
    });
    this.groupedNotes.sort((a, b) => {
      return new Date(b.notes[0].lastModified).getTime() - 
             new Date(a.notes[0].lastModified).getTime();
    });
  }

  createNewNote(): void {
    const newNoteId = this.noteService.addNote('Untitled Note', '');
    this.router.navigate(['/note', newNoteId]);
  }

  deleteNote(id: string): void {
    Swal.fire({
      title: this.translate.instant('NOTES.DELETE_CONFIRM'),
      text: this.translate.instant('NOTES.DELETE_MESSAGE'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('NOTES.DELETE'),
      cancelButtonText: this.translate.instant('NOTES.CANCEL'),
      confirmButtonColor: '#ff3b30',
      heightAuto: false,
      customClass: {
        container: 'ios-dialog-container',
        popup: 'ios-dialog',
        title: 'ios-dialog-title',
        htmlContainer: 'ios-dialog-text',
        actions: 'ios-dialog-actions',
        confirmButton: 'swal2-deny',
        cancelButton: 'swal2-cancel'
      },
      buttonsStyling: true,
      showClass: {
        popup: 'animate__animated animate__fadeIn animate__faster'
      },
      hideClass: {
        popup: 'animate__animated animate__fadeOut animate__faster'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.noteService.deleteNote(id);
        Swal.fire({
          title: this.translate.instant('NOTES.DELETED'),
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          heightAuto: false,
          customClass: {
            container: 'ios-dialog-container',
            popup: 'ios-dialog'
          }
        });
      }
    });
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  stripHtmlTags(html: string): string {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  toggleLanguage(): void {
    this.languageService.toggleLanguage();
  }

  exportNotes(): void {
    const notesData = this.noteService.getAllNotes();
    const blob = new Blob([JSON.stringify(notesData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notes_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    Swal.fire({
      title: this.translate.instant('NOTES.EXPORTED'),
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
      heightAuto: false,
      background: this.isDarkMode ? '#1c1c1e' : '#ffffff',
      color: this.isDarkMode ? '#ffffff' : '#1c1c1e'
    });
  }

  importNotes(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const importedNotes = JSON.parse(e.target.result);
          
          // Show confirmation dialog before importing
          Swal.fire({
            title: this.translate.instant('NOTES.IMPORT_CONFIRM'),
            text: this.translate.instant('NOTES.IMPORT_MERGE_MESSAGE'),
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: this.translate.instant('NOTES.IMPORT_MERGE'),
            cancelButtonText: this.translate.instant('NOTES.CANCEL'),
            showDenyButton: true,
            denyButtonText: this.translate.instant('NOTES.IMPORT_REPLACE'),
            customClass: {
              container: 'ios-dialog-container',
              popup: 'ios-dialog',
              title: 'ios-dialog-title',
              htmlContainer: 'ios-dialog-text',
              actions: 'ios-dialog-actions',
              confirmButton: 'swal2-confirm',
              denyButton: 'swal2-deny',
              cancelButton: 'swal2-cancel'
            },
            buttonsStyling: true
          }).then((result) => {
            if (result.isConfirmed) {
              // Merge with existing notes
              this.noteService.mergeNotes(importedNotes);
              
              Swal.fire({
                title: this.translate.instant('NOTES.IMPORTED'),
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
                heightAuto: false,
                customClass: {
                  container: 'ios-dialog-container',
                  popup: 'ios-dialog'
                }
              });
            } else if (result.isDenied) {
              // Replace existing notes
              this.noteService.importNotes(importedNotes);
              
              Swal.fire({
                title: this.translate.instant('NOTES.IMPORTED'),
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
                heightAuto: false,
                customClass: {
                  container: 'ios-dialog-container',
                  popup: 'ios-dialog'
                }
              });
            }
          });
        } catch (error) {
          Swal.fire({
            title: this.translate.instant('NOTES.IMPORT_ERROR'),
            icon: 'error',
            timer: 1500,
            showConfirmButton: false,
            heightAuto: false,
            customClass: {
              container: 'ios-dialog-container',
              popup: 'ios-dialog'
            }
          });
        }
      };
      reader.readAsText(file);
    }
  }

  filterNotes(): void {
    if (!this.searchQuery.trim() && this.selectedTags.length === 0) {
      this.loadInitialNotes();
      return;
    }

    const query = this.searchQuery.toLowerCase();
    const filteredNotes = this.allNotes.filter(note => {
      const matchesSearch = !query || 
        note.title.toLowerCase().includes(query) || 
        this.stripHtmlTags(note.content).toLowerCase().includes(query);

      const matchesTags = this.selectedTags.length === 0 || 
        this.selectedTags.every(tagId => note.tags?.some(t => t.id === tagId));

      return matchesSearch && matchesTags;
    });

    this.groupedNotes = this.groupNotesByDate(filteredNotes);
    this.hasMore = false;
    this.currentPage = 0;
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.selectedTags = [];
    this.loadInitialNotes();
  }

  editNote(id: string): void {
    this.router.navigate(['/note', id]);
  }

  deleteAllNotes(): void {
    Swal.fire({
      title: this.translate.instant('NOTES.DELETE_ALL_CONFIRM'),
      text: this.translate.instant('NOTES.DELETE_ALL_MESSAGE'),
      input: 'text',
      inputPlaceholder: this.translate.instant('NOTES.DELETE_ALL_PLACEHOLDER'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('NOTES.DELETE'),
      cancelButtonText: this.translate.instant('NOTES.CANCEL'),
      confirmButtonColor: '#ff3b30',
      heightAuto: false,
      customClass: {
        container: 'ios-dialog-container',
        popup: 'ios-dialog',
        title: 'ios-dialog-title',
        htmlContainer: 'ios-dialog-text',
        actions: 'ios-dialog-actions',
        confirmButton: 'swal2-deny',
        cancelButton: 'swal2-cancel',
        input: 'swal2-input'
      },
      buttonsStyling: true,
      inputValidator: (value) => {
        if (value !== 'DELETE') {
          return this.translate.instant('NOTES.DELETE_ALL_ERROR');
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.noteService.deleteAllNotes();
        this.loadInitialNotes();
        Swal.fire({
          title: this.translate.instant('NOTES.ALL_DELETED'),
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          heightAuto: false,
          customClass: {
            container: 'ios-dialog-container',
            popup: 'ios-dialog'
          }
        });
      }
    });
  }

  showOptionsMenu(): void {
    const timeFormatText = this.is24HourFormat ? 'TIME.FORMAT_24' : 'TIME.FORMAT_12';
    Swal.fire({
      title: this.translate.instant('NOTES.OPTIONS'),
      html: `
        <div class="options-menu">
          <button class="option-btn" id="exportBtn">
            <i class="fas fa-file-export"></i>
            <span>${this.translate.instant('NOTES.EXPORT')}</span>
          </button>
          <button class="option-btn" id="importBtn">
            <i class="fas fa-file-import"></i>
            <span>${this.translate.instant('NOTES.IMPORT')}</span>
          </button>
          <button class="option-btn" id="langBtn">
            <i class="${this.currentLang === 'en' ? 'fi fi-gb' : 'fi fi-tr'}"></i>
            <span>${this.translate.instant('LANGUAGE.TOGGLE')}</span>
          </button>
          <button class="option-btn" id="themeBtn">
            <i class="fas ${this.isDarkMode ? 'fa-sun' : 'fa-moon'}"></i>
            <span>${this.translate.instant('THEME.TOGGLE')}</span>
          </button>
          <button class="option-btn danger" id="deleteAllTagsBtn">
            <i class="fas fa-tags"></i>
            <span>${this.translate.instant('TAGS.DELETE_ALL')}</span>
          </button>
          <button class="option-btn danger" id="deleteAllBtn">
            <i class="fas fa-trash-can"></i>
            <span>${this.translate.instant('NOTES.DELETE_ALL')}</span>
          </button>
          <button class="option-btn" id="timeFormatBtn">
            <i class="fas fa-clock"></i>
            <span>${this.translate.instant(timeFormatText)}</span>
          </button>
        </div>
      `,
      showConfirmButton: false,
      showCloseButton: true,
      customClass: {
        container: 'options-container',
        popup: 'options-popup',
        closeButton: 'options-close-button'
      },
      didOpen: () => {
        document.getElementById('exportBtn')?.addEventListener('click', () => {
          Swal.close();
          this.exportNotes();
        });
        
        document.getElementById('importBtn')?.addEventListener('click', () => {
          const fileInput = document.createElement('input');
          fileInput.type = 'file';
          fileInput.accept = '.json';
          fileInput.onchange = (e) => {
            Swal.close();
            this.importNotes(e);
          };
          fileInput.click();
        });
        
        document.getElementById('langBtn')?.addEventListener('click', () => {
          Swal.close();
          this.toggleLanguage();
        });
        
        document.getElementById('themeBtn')?.addEventListener('click', () => {
          Swal.close();
          this.toggleTheme();
        });
        
        document.getElementById('deleteAllTagsBtn')?.addEventListener('click', async () => {
          Swal.close();
          await this.deleteAllTags();
        });
        
        document.getElementById('deleteAllBtn')?.addEventListener('click', () => {
          Swal.close();
          this.deleteAllNotes();
        });
        
        document.getElementById('timeFormatBtn')?.addEventListener('click', () => {
          Swal.close();
          this.timeFormatService.toggleTimeFormat();
        });
      }
    });
  }

  async deleteAllTags(): Promise<void> {
    const result = await Swal.fire({
      title: this.translate.instant('TAGS.DELETE_ALL_CONFIRM'),
      text: this.translate.instant('TAGS.DELETE_ALL_MESSAGE'),
      input: 'text',
      inputPlaceholder: this.translate.instant('TAGS.DELETE_ALL_PLACEHOLDER'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('TAGS.DELETE'),
      cancelButtonText: this.translate.instant('TAGS.CANCEL'),
      confirmButtonColor: '#ff3b30',
      customClass: {
        container: 'ios-dialog-container',
        popup: 'ios-dialog',
        title: 'ios-dialog-title',
        htmlContainer: 'ios-dialog-text',
        actions: 'ios-dialog-actions',
        confirmButton: 'swal2-deny',
        cancelButton: 'swal2-cancel',
        input: 'swal2-input'
      },
      buttonsStyling: true,
      inputValidator: (value) => {
        if (value !== 'DELETE') {
          return this.translate.instant('TAGS.DELETE_ALL_ERROR');
        }
        return null;
      }
    });

    if (result.isConfirmed) {
      this.tagService.deleteAllTags();
      this.noteService.removeAllTagsFromNotes();
      
      Swal.fire({
        title: this.translate.instant('TAGS.ALL_DELETED'),
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        customClass: {
          container: 'ios-dialog-container',
          popup: 'ios-dialog'
        }
      });
    }
  }

  async deleteTag(tag: Tag): Promise<void> {
    const result = await Swal.fire({
      title: this.translate.instant('TAGS.DELETE_CONFIRM'),
      text: this.translate.instant('TAGS.DELETE_MESSAGE'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('TAGS.DELETE'),
      cancelButtonText: this.translate.instant('TAGS.CANCEL'),
      confirmButtonColor: '#ff3b30',
      customClass: {
        container: 'ios-dialog-container',
        popup: 'ios-dialog',
        title: 'ios-dialog-title',
        htmlContainer: 'ios-dialog-text',
        actions: 'ios-dialog-actions',
        confirmButton: 'swal2-deny',
        cancelButton: 'swal2-cancel'
      },
      buttonsStyling: true
    });

    if (result.isConfirmed) {
      this.tagService.deleteTag(tag.id);
      this.selectedTags = this.selectedTags.filter(id => id !== tag.id);
      this.noteService.removeTagFromAllNotes(tag.id);
      this.filterNotes();
      
      Swal.fire({
        title: this.translate.instant('TAGS.DELETED'),
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        customClass: {
          container: 'ios-dialog-container',
          popup: 'ios-dialog'
        }
      });
    }
  }

  getTimeFormat(): string {
    return this.timeFormatService.getTimeFormat();
  }

  async openTagDialog(): Promise<void> {
    await this.dialogService.createTag();
  }

  toggleTagFilter(tag: Tag): void {
    const index = this.selectedTags.indexOf(tag.id);
    if (index === -1) {
      this.selectedTags.push(tag.id);
    } else {
      this.selectedTags.splice(index, 1);
    }
    this.filterNotes();
  }

  showNotePreview(note: Note): void {
    Swal.fire({
      title: note.title,
      html: `
        <div class="note-preview-content">
          <div class="note-content">
            ${note.content}
          </div>
          ${note.tags?.length ? `
            <div class="note-tags">
              ${note.tags.map(tag => `
                <span class="tag" style="background-color: ${tag.color}">
                  ${tag.name}
                </span>
              `).join('')}
            </div>
          ` : ''}
          <div class="note-footer">
            <span class="date">
              <i class="fas fa-clock"></i>
              ${new Date(note.lastModified).toLocaleDateString(this.currentLang, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: this.is24HourFormat ? '2-digit' : 'numeric',
                minute: '2-digit',
                hour12: !this.is24HourFormat
              })}
            </span>
          </div>
        </div>
      `,
      showCancelButton: true,
      showConfirmButton: false,
      cancelButtonText: '<i class="fas fa-times"></i>',
      customClass: {
        container: 'ios-dialog-container',
        popup: 'ios-dialog preview-dialog',
        title: 'ios-dialog-title',
        htmlContainer: 'ios-dialog-text',
        actions: 'ios-dialog-actions',
        cancelButton: 'swal2-cancel preview-icon-btn'
      },
      buttonsStyling: true,
      showClass: {
        popup: 'animate__animated animate__fadeIn animate__faster'
      },
      hideClass: {
        popup: 'animate__animated animate__fadeOut animate__faster'
      }
    });
  }
}