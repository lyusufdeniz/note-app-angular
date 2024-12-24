import { Injectable, Inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root'
})
export class TimeFormatService {
  private is24HourFormat = new BehaviorSubject<boolean>(false);
  is24HourFormat$ = this.is24HourFormat.asObservable();

  constructor(@Inject(SettingsService) private settingsService: SettingsService) {
    const timeFormat = this.settingsService.getSetting('timeFormat');
    this.is24HourFormat.next(timeFormat === '24');
  }

  toggleTimeFormat(): void {
    const newFormat = !this.is24HourFormat.value;
    this.is24HourFormat.next(newFormat);
    this.settingsService.updateSetting('timeFormat', newFormat ? '24' : '12');
  }

  getTimeFormat(): string {
    return this.is24HourFormat.value ? 'MMM d, y, HH:mm' : 'MMM d, y, h:mm a';
  }
} 