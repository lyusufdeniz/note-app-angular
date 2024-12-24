import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EditorModule, TINYMCE_SCRIPT_SRC } from '@tinymce/tinymce-angular';
import tinymce from 'tinymce';
import { Note } from '../../models/note';
import { NoteService } from '../../services/note.service';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { ThemeService } from '../../services/theme.service';
import { Editor } from 'tinymce';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TagService } from '../../services/tag.service';
import { Tag } from '../../models/tag';
import { DialogService } from '../../services/dialog.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-note-editor',
  standalone: true,
  imports: [FormsModule, EditorModule, TranslateModule, CommonModule],
  templateUrl: './note-editor.component.html',
  styleUrl: './note-editor.component.scss',
  providers: [
    { provide: TINYMCE_SCRIPT_SRC, useValue: 'tinymce/tinymce.min.js' }
  ]
})
export class NoteEditorComponent implements OnInit, OnDestroy {
  isDarkMode = false;
  editor!: Editor;
  availableTags: Tag[] = [];
  hasUnsavedChanges = false;

  note: Note = {
    id: '', 
    title: '', 
    content: '',
    lastModified: new Date()
  };

  editorConfig: any = {
    base_url: '/tinymce',
    suffix: '.min',
    height: 'calc(100vh - 180px)',
    menubar: false,
    plugins: [
      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'media', 'table', 'help', 'wordcount', 'textcolor'
    ],
    toolbar: [
      'undo redo | formatselect | bold italic | forecolor backcolor | ' +
      'alignleft aligncenter alignright alignjustify | ' +
      'bullist numlist outdent indent | image | removeformat | help'
    ],
    images_upload_url: 'your_upload_url',
    images_upload_handler: (blobInfo: any, progress: any) => {
      return new Promise((resolve, reject) => {
        try {
          const reader = new FileReader();
          reader.onload = (e: any) => {
            const base64 = e.target.result;
            resolve(base64);
          };
          reader.readAsDataURL(blobInfo.blob());
        } catch (e) {
          reject(e);
        }
      });
    },
    image_title: true,
    automatic_uploads: true,
    file_picker_types: 'image',
    file_picker_callback: (cb: any, value: any, meta: any) => {
      const input = document.createElement('input');
      input.setAttribute('type', 'file');
      input.setAttribute('accept', 'image/*');

      input.addEventListener('change', (e: any) => {
        const file = e.target.files[0];

        const reader = new FileReader();
        reader.addEventListener('load', () => {
          const id = 'blobid' + (new Date()).getTime();
          const blobCache = tinymce.activeEditor?.editorUpload.blobCache;
          if (!blobCache) {
            throw new Error('Editor not initialized');
          }
          const base64 = (reader.result as string).split(',')[1];
          const blobInfo = blobCache.create(id, file, base64);
          blobCache.add(blobInfo);

          cb(blobInfo.blobUri(), { title: file.name });
        });
        reader.readAsDataURL(file);
      });

      input.click();
    },
    image_class_list: [
      { title: 'None', value: '' },
      { title: 'Full Width', value: 'img-fluid' },
      { title: 'Left Aligned', value: 'img-left' },
      { title: 'Right Aligned', value: 'img-right' }
    ],
    textcolor_cols: 8,
    textcolor_rows: 6,
    textcolor_map: [
      // iOS Colors
      "FF3B30", "Red",
      "FF9500", "Orange",
      "FFCC00", "Yellow",
      "34C759", "Green",
      "5856D6", "Purple",
      "007AFF", "Blue",
      "32ADE6", "Light Blue",
      "FF2D55", "Pink",
      // Dark shades
      "1c1c1e", "Black",
      "2c2c2e", "Dark Gray",
      "3a3a3c", "Gray",
      "48484a", "Light Gray",
      "636366", "Silver",
      "8e8e93", "Light Silver",
      "aeaeb2", "Extra Light Gray",
      "ffffff", "White"
    ],
    content_style: `
      body { 
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 16px;
        line-height: 1.6;
        color: var(--editor-text-color) !important;
        background: var(--editor-bg-color) !important;
        padding: 20px;
      }
      .img-fluid { 
        max-width: 100%;
        height: auto;
        margin: 10px 0;
      }
      .img-left {
        float: left;
        margin: 0 20px 20px 0;
        max-width: 50%;
      }
      .img-right {
        float: right;
        margin: 0 0 20px 20px;
        max-width: 50%;
      }
    `,
    setup: (editor: any) => {
      this.editor = editor;
      editor.on('init', () => {
        this.updateEditorColors();
      });
    }
  };

  constructor(
    private noteService: NoteService,
    private route: ActivatedRoute,
    private router: Router,
    private themeService: ThemeService,
    private translate: TranslateService,
    private tagService: TagService,
    private dialogService: DialogService
  ) {
    this.themeService.isDarkMode$.subscribe(
      isDark => {
        this.isDarkMode = isDark;
        this.updateEditorTheme();
      }
    );
    this.tagService.getTags().subscribe(tags => {
      this.availableTags = tags;
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.loadNote(params['id']);
      }
    });
    this.themeService.isDarkMode$.subscribe(() => {
      this.updateEditorColors();
    });
  }

  private loadNote(id: string) {
    this.noteService.getNote(id).subscribe(note => {
      if (note) {
        this.note = note;
      }
    });
  }

  saveNote() {
    this.noteService.updateNote(this.note);
    this.hasUnsavedChanges = false;
    
    Swal.fire({
      title: this.translate.instant('EDITOR.SAVED'),
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
      background: this.isDarkMode ? '#1c1c1e' : '#ffffff',
      color: this.isDarkMode ? '#ffffff' : '#1c1c1e'
    });
  }

  private updateEditorTheme() {
    if (this.editor) {
      const editor = tinymce.EditorManager.get(this.editor.id);
      if (editor) {
        const newTheme = this.isDarkMode ? 'oxide-dark' : 'oxide';
        const content = editor.getContent();
        editor.options.set('skin', newTheme);
        editor.options.set('content_css', this.isDarkMode ? 'dark' : 'default');
        editor.options.set('body_class', this.isDarkMode ? 'dark-mode' : 'light-mode');
        editor.dom.addClass(editor.getBody(), this.isDarkMode ? 'dark-mode' : 'light-mode');
        editor.dom.removeClass(editor.getBody(), this.isDarkMode ? 'light-mode' : 'dark-mode');
        editor.setContent(content);
      }
    }
  }

  ngOnDestroy() {
    if (this.editor) {
      this.editor.destroy();
    }
  }

  isTagSelected(tag: Tag): boolean {
    return this.note.tags?.some(t => t.id === tag.id) ?? false;
  }

  toggleTag(tag: Tag): void {
    if (!this.note.tags) {
      this.note.tags = [];
    }

    const index = this.note.tags.findIndex(t => t.id === tag.id);
    if (index === -1) {
      this.note.tags.push(tag);
    } else {
      this.note.tags.splice(index, 1);
    }
    this.hasUnsavedChanges = true;
  }

  removeTag(tag: Tag): void {
    this.note.tags = this.note.tags?.filter(t => t.id !== tag.id);
    this.hasUnsavedChanges = true;
  }

  async createNewTag(): Promise<void> {
    const newTag = await this.dialogService.createTag();
    if (newTag) {
      if (!this.note.tags) {
        this.note.tags = [];
      }
      this.note.tags.push(newTag);
      this.hasUnsavedChanges = true;
    }
  }

  private updateEditorColors(): void {
    if (this.editor) {
      const isDark = document.body.classList.contains('dark-mode');
      const editorBody = this.editor.getBody();
      
      if (isDark) {
        editorBody.style.setProperty('--editor-text-color', '#ffffff');
        editorBody.style.setProperty('--editor-bg-color', '#1c1c1e');
      } else {
        editorBody.style.setProperty('--editor-text-color', '#1c1c1e');
        editorBody.style.setProperty('--editor-bg-color', '#ffffff');
      }
    }
  }
}