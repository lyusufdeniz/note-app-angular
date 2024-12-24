import { Injectable } from '@angular/core';
import { SettingsService } from './settings.service';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from './language.service';

@Injectable({
  providedIn: 'root'
})
export class OnboardingService {
  private readonly ONBOARDING_KEY = 'onboarding_completed';

  constructor(
    private settingsService: SettingsService,
    private translate: TranslateService,
    private languageService: LanguageService
  ) {}

  async showOnboarding(): Promise<void> {
    if (localStorage.getItem(this.ONBOARDING_KEY)) {
      return;
    }

    // Language selection first
    const { value: selectedLang, dismiss } = await Swal.fire({
      title: 'Choose Your Language / Dilinizi Seçin',
      html: `
        <div class="language-selection">
          <div class="lang-btn" data-lang="en">
            <i class="fi fi-gb"></i>
            <span>English</span>
            <i class="fas fa-chevron-right"></i>
          </div>
          <div class="lang-btn" data-lang="tr">
            <i class="fi fi-tr"></i>
            <span>Türkçe</span>
            <i class="fas fa-chevron-right"></i>
          </div>
        </div>
      `,
      showConfirmButton: false,
      allowOutsideClick: false,
      grow: 'fullscreen',
      customClass: {
        container: 'onboarding-container',
        popup: 'onboarding-popup',
        title: 'onboarding-title'
      },
      didOpen: () => {
        const buttons = document.querySelectorAll('.lang-btn');
        buttons.forEach(btn => {
          btn.addEventListener('click', async () => {
            const lang = (btn as HTMLElement).dataset['lang'];
            if (lang) {
              await this.languageService.setLanguage(lang);
              Swal.clickConfirm();
            }
          });
        });
      }
    });

    // Wait for translations to load
    await new Promise(resolve => setTimeout(resolve, 100));

    // Features tour
    const features = [
      { icon: 'fa-plus', color: '#007AFF', key: 'FEATURE_1' },
      { icon: 'fa-tag', color: '#32D74B', key: 'FEATURE_2' },
      { icon: 'fa-file-export', color: '#007AFF', key: 'FEATURE_3' },
      { icon: 'fa-file-import', color: '#007AFF', key: 'FEATURE_4' },
      { icon: 'fa-moon', color: '#FF9F0A', key: 'FEATURE_5' },
      { icon: 'fa-language', color: '#32D74B', key: 'FEATURE_6' },
      { icon: 'fa-clock', color: '#007AFF', key: 'FEATURE_7' },
      { icon: 'fa-magnifying-glass', color: '#007AFF', key: 'FEATURE_8' }
    ];

    for (let i = 0; i < features.length; i++) {
      const feature = features[i];
      const result = await Swal.fire({
        title: this.translate.instant('ONBOARDING.WELCOME'),
        html: `
          <div class="onboarding-content">
            <div class="feature">
              <i class="fas ${feature.icon}" style="color: ${feature.color}"></i>
              <p>${this.translate.instant(`ONBOARDING.${feature.key}`)}</p>
            </div>
            <div class="step-indicator">
              ${features.map((_, index) => `
                <span class="step ${index === i ? 'active' : index < i ? 'completed' : ''}"></span>
              `).join('')}
            </div>
          </div>
        `,
        confirmButtonText: i === features.length - 1 ? 
          this.translate.instant('ONBOARDING.GET_STARTED') : 
          this.translate.instant('ONBOARDING.NEXT'),
        showCancelButton: true,
        cancelButtonText: i === 0 ? 
          this.translate.instant('ONBOARDING.SKIP') : 
          this.translate.instant('ONBOARDING.PREVIOUS'),
        showDenyButton: false,
        grow: 'fullscreen',
        customClass: {
          container: 'onboarding-container',
          popup: 'onboarding-popup',
          title: 'onboarding-title',
          actions: 'onboarding-actions',
          confirmButton: 'onboarding-confirm',
          cancelButton: 'onboarding-cancel'
        },
        allowOutsideClick: false,
        background: this.settingsService.getSetting('theme') === 'dark' ? '#1c1c1e' : '#ffffff',
        buttonsStyling: false
      });

      if (result.dismiss === Swal.DismissReason.cancel) {
        if (i === 0) {
          break; // Skip if it's first screen
        }
        i -= 2; // Go back one step (the loop will increment i)
      }
    }

    localStorage.setItem(this.ONBOARDING_KEY, 'true');
  }
} 