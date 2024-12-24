import { Injectable } from '@angular/core';
import { Tag } from '../models/tag';
import Swal from 'sweetalert2';
import { TagService } from './tag.service';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  constructor(
    private tagService: TagService,
    private translate: TranslateService
  ) {}

  async createTag(): Promise<Tag | undefined> {
    const allTags = await firstValueFrom(this.tagService.getTags());
    
    const { value: formValues } = await Swal.fire({
      title: this.translate.instant('TAGS.CREATE_TITLE'),
      html: `
        <div class="tag-dialog-content">
          <input id="tagName" class="swal2-input" placeholder="${this.translate.instant('TAGS.NAME_PLACEHOLDER')}">
          <div class="color-picker">
            ${this.tagService.COLORS.map(color => `
              <button type="button" class="color-btn" data-color="${color}" 
                style="background: ${color}">
              </button>
            `).join('')}
            <div class="custom-color">
              <input type="color" id="customColor" value="${this.tagService.COLORS[0]}">
              <label for="customColor">${this.translate.instant('TAGS.CUSTOM_COLOR')}</label>
            </div>
          </div>
          <div class="existing-tags">
            ${allTags?.map(tag => `
              <div class="tag-item" data-id="${tag.id}">
                <span class="tag-color" style="background: ${tag.color}"></span>
                <span class="tag-name">${tag.name}</span>
                <button class="tag-delete-btn" data-tag-id="${tag.id}">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: this.translate.instant('TAGS.SAVE'),
      cancelButtonText: this.translate.instant('TAGS.CANCEL'),
      confirmButtonColor: '#007AFF',
      customClass: {
        container: 'ios-dialog-container',
        popup: 'ios-dialog',
        title: 'ios-dialog-title',
        htmlContainer: 'ios-dialog-text',
        actions: 'ios-dialog-actions',
        confirmButton: 'swal2-confirm',
        cancelButton: 'swal2-cancel',
        input: 'swal2-input'
      },
      buttonsStyling: true,
      showClass: {
        popup: 'animate__animated animate__fadeIn animate__faster'
      },
      hideClass: {
        popup: 'animate__animated animate__fadeOut animate__faster'
      },
      didOpen: () => {
        const colorButtons = document.querySelectorAll<HTMLButtonElement>('.color-btn');
        const customColorInput = document.getElementById('customColor') as HTMLInputElement;
        
        colorButtons.forEach(button => {
          button.addEventListener('click', () => {
            colorButtons.forEach(b => {
              b.style.transform = 'scale(1)';
              b.classList.remove('color-selected');
            });
            button.style.transform = 'scale(1.2)';
            button.classList.add('color-selected');
            customColorInput.value = button.dataset['color'] || customColorInput.value;
          });
        });

        customColorInput.addEventListener('input', () => {
          colorButtons.forEach(b => {
            b.style.transform = 'scale(1)';
            b.classList.remove('color-selected');
          });
        });

        const deleteButtons = document.querySelectorAll('.tag-delete-btn');
        deleteButtons.forEach(btn => {
          btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const tagId = (e.currentTarget as HTMLElement).dataset['tagId'];
            if (tagId) {
              const deleteResult = await Swal.fire({
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

              if (deleteResult.isConfirmed) {
                this.tagService.deleteTag(tagId);
                (e.currentTarget as HTMLElement).closest('.tag-item')?.remove();
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
          });
        });
      },
      preConfirm: () => {
        const name = (document.getElementById('tagName') as HTMLInputElement).value;
        const selectedColor = document.querySelector('.color-selected') as HTMLElement;
        const customColor = (document.getElementById('customColor') as HTMLInputElement).value;
        const color = selectedColor?.dataset['color'] || customColor;
        
        if (!name || !color) {
          Swal.showValidationMessage(this.translate.instant('TAGS.VALIDATION_ERROR'));
          return false;
        }
        
        return { name, color };
      }
    });

    if (formValues) {
      const tag = this.tagService.addTag(formValues.name, formValues.color);
      Swal.fire({
        title: this.translate.instant('TAGS.CREATED'),
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        customClass: {
          container: 'ios-dialog-container',
          popup: 'ios-dialog'
        }
      });
      return tag;
    }
    return undefined;
  }

  async manageTags(currentTags: Tag[] = []): Promise<Tag[]> {
    const allTags = await firstValueFrom(this.tagService.getTags());
    
    const showManageDialog = async (tags: Tag[] = currentTags) => {
      let isProcessing = false;

      const { value: result, dismiss } = await Swal.fire({
        title: this.translate.instant('TAGS.MANAGE_TITLE'),
        html: `
          <div class="tag-dialog-content">
            <div class="existing-tags">
              ${allTags?.map(tag => `
                <div class="tag-item ${tags.some(t => t.id === tag.id) ? 'selected' : ''}" 
                     data-id="${tag.id}">
                  <span class="tag-color" style="background: ${tag.color}"></span>
                  <span class="tag-name">${tag.name}</span>
                  <button class="tag-delete-btn" data-tag-id="${tag.id}">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              `).join('')}
            </div>
            <button class="new-tag-btn" id="newTagBtn">
              <i class="fas fa-plus"></i> ${this.translate.instant('TAGS.CREATE_NEW')}
            </button>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: this.translate.instant('TAGS.APPLY'),
        cancelButtonText: this.translate.instant('TAGS.CANCEL'),
        confirmButtonColor: '#007AFF',
        customClass: {
          container: 'ios-dialog-container',
          popup: 'ios-dialog',
          title: 'ios-dialog-title',
          htmlContainer: 'ios-dialog-text',
          actions: 'ios-dialog-actions',
          confirmButton: 'swal2-confirm',
          cancelButton: 'swal2-cancel'
        },
        buttonsStyling: true,
        showClass: {
          popup: 'animate__animated animate__fadeIn animate__faster'
        },
        hideClass: {
          popup: 'animate__animated animate__fadeOut animate__faster'
        },
        didOpen: () => {
          const tagItems = document.querySelectorAll('.tag-item');
          const deleteButtons = document.querySelectorAll('.tag-delete-btn');

          tagItems.forEach(item => {
            item.addEventListener('click', (e) => {
              if (!(e.target as HTMLElement).closest('.tag-delete-btn')) {
                item.classList.toggle('selected');
              }
            });
          });

          deleteButtons.forEach(btn => {
            btn.addEventListener('click', async (e) => {
              e.stopPropagation();
              const tagId = (e.currentTarget as HTMLElement).dataset['tagId'];
              if (tagId) {
                const deleteResult = await Swal.fire({
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

                if (deleteResult.isConfirmed) {
                  this.tagService.deleteTag(tagId);
                  (e.currentTarget as HTMLElement).closest('.tag-item')?.remove();
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
            });
          });

          const newTagBtn = document.getElementById('newTagBtn');
          newTagBtn?.addEventListener('click', async (e) => {
            e.preventDefault();
            if (isProcessing) return;
            isProcessing = true;

            try {
              Swal.close();
              const newTag = await this.createTag();
              if (newTag) {
                await showManageDialog([...tags, newTag]);
              } else {
                await showManageDialog(tags);
              }
            } finally {
              isProcessing = false;
            }
          });
        },
        preConfirm: () => {
          const selectedIds = Array.from(document.querySelectorAll('.tag-item.selected'))
            .map(el => (el as HTMLElement).dataset['id'] || '');
          return allTags.filter(tag => selectedIds.includes(tag.id));
        }
      });

      if (dismiss === Swal.DismissReason.cancel) {
        return tags;
      }
      return result || tags;
    };

    return showManageDialog();
  }
} 