import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private currentLanguage = new BehaviorSubject<string>('en');
  currentLanguage$ = this.currentLanguage.asObservable();

  constructor(
    private translate: TranslateService,
    private settingsService: SettingsService
  ) {
    const lang = this.settingsService.getSetting('language');
    this.setLanguage(lang);
  }

  public setLanguage(lang: string) {
    this.translate.setDefaultLang(lang);
    this.translate.use(lang);
    this.currentLanguage.next(lang);
    this.settingsService.updateSetting('language', lang as 'en' | 'tr');
    document.documentElement.lang = lang;
  }

  toggleLanguage(): void {
    const newLang = this.currentLanguage.value === 'en' ? 'tr' : 'en';
    this.setLanguage(newLang);
  }
} 