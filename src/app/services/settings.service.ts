import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface AppSettings {
  theme: 'light' | 'dark';
  language: 'en' | 'tr';
  timeFormat: '12' | '24';
  lastBackup?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private readonly STORAGE_KEY = 'app_settings';
  private settings = new BehaviorSubject<AppSettings>({
    theme: 'dark',
    language: 'en',
    timeFormat: '12'
  });

  settings$ = this.settings.asObservable();

  constructor() {
    this.loadSettings();
  }

  private loadSettings(): void {
    const savedSettings = localStorage.getItem(this.STORAGE_KEY);
    if (savedSettings) {
      this.settings.next(JSON.parse(savedSettings));
    }
  }

  private saveSettings(settings: AppSettings): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
    this.settings.next(settings);
  }

  updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    const currentSettings = this.settings.value;
    this.saveSettings({
      ...currentSettings,
      [key]: value
    });
  }

  getSetting<K extends keyof AppSettings>(key: K): AppSettings[K] {
    return this.settings.value[key];
  }

  getAllSettings(): AppSettings {
    return this.settings.value;
  }

  resetSettings(): void {
    const defaultSettings: AppSettings = {
      theme: 'dark',
      language: 'en',
      timeFormat: '12'
    };
    this.saveSettings(defaultSettings);
  }

  updateLastBackup(): void {
    this.updateSetting('lastBackup', new Date().toISOString());
  }
} 