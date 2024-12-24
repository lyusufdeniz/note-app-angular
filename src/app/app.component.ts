import { Component, OnInit, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OnboardingService } from './services/onboarding.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TranslateModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'Papirus';

  constructor(
    private onboardingService: OnboardingService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.onboardingService.showOnboarding();
  }

  @HostListener('contextmenu', ['$event'])
  onRightClick(event: MouseEvent) {
    event.preventDefault();
    
    Swal.fire({
      html: `
        <div class="context-menu">
          <button class="context-btn" id="shareBtn">
            <i class="fas fa-share-alt"></i>
            <span>${this.translate.instant('APP.SHARE')}</span>
          </button>
          <button class="context-btn" id="copyUrlBtn">
            <i class="fas fa-link"></i>
            <span>${this.translate.instant('APP.COPY_URL')}</span>
          </button>
          <button class="context-btn" id="refreshBtn">
            <i class="fas fa-arrows-rotate"></i>
            <span>${this.translate.instant('APP.REFRESH')}</span>
          </button>
        </div>
      `,
      showConfirmButton: false,
      showCloseButton: true,
      customClass: {
        container: 'context-menu-container',
        popup: 'context-menu-popup',
        closeButton: 'context-close-button'
      },
      backdrop: false,
      position: 'center',
      target: document.body,
      didOpen: () => {
        document.getElementById('shareBtn')?.addEventListener('click', () => {
          if (navigator.share) {
            navigator.share({
              title: 'Papirus',
              text: this.translate.instant('APP.SHARE_TEXT'),
              url: window.location.origin
            }).then(() => {
              Swal.close();
            }).catch(console.error);
          }
        });

        document.getElementById('copyUrlBtn')?.addEventListener('click', () => {
          navigator.clipboard.writeText(window.location.href).then(() => {
            Swal.fire({
              title: this.translate.instant('APP.URL_COPIED'),
              icon: 'success',
              timer: 1500,
              showConfirmButton: false,
              customClass: {
                popup: 'ios-alert'
              }
            });
          });
        });

        document.getElementById('refreshBtn')?.addEventListener('click', () => {
          window.location.reload();
        });
      }
    });
  }
}
