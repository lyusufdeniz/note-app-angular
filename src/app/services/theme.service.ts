import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private isDarkMode = new BehaviorSubject<boolean>(true);
  isDarkMode$ = this.isDarkMode.asObservable();

  constructor(private settingsService: SettingsService) {
    const theme = this.settingsService.getSetting('theme');
    const isDark = theme === 'dark';
    this.isDarkMode.next(isDark);
    document.body.classList.toggle('dark-mode', isDark);
  }

  toggleTheme(): void {
    const newTheme = !this.isDarkMode.value;
    this.isDarkMode.next(newTheme);
    this.settingsService.updateSetting('theme', newTheme ? 'dark' : 'light');
    document.body.classList.toggle('dark-mode', newTheme);
  }
} 