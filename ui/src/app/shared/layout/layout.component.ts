import { AuthService } from '@/app/core/auth/auth.service'
import { ConfirmComponent } from '@/app/core/components/confirm/confirm.component'
import { SettingsService } from '@/app/core/settings.service'
import { IoNamespace, WsService } from '@/app/core/ws.service'
import { environment } from '@/environments/environment'
import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { TranslateService } from '@ngx-translate/core'
import { firstValueFrom } from 'rxjs'
import { lt } from 'semver'

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent implements OnInit {
  public sidebarExpanded = false
  private io: IoNamespace

  constructor(
    public $auth: AuthService,
    private $modal: NgbModal,
    private $router: Router,
    public $settings: SettingsService,
    private $translate: TranslateService,
    private $ws: WsService,
  ) {}

  ngOnInit() {
    this.io = this.$ws.connectToNamespace('app')
    this.io.socket.on('reconnect', () => {
      this.$auth.checkToken()
    })

    this.compareServerUiVersion()
  }

  async compareServerUiVersion() {
    if (!this.$settings.settingsLoaded) {
      await firstValueFrom(this.$settings.onSettingsLoaded)
    }

    if (lt(this.$settings.uiVersion, environment.serverTarget)) {
      // eslint-disable-next-line no-console
      console.log(`Server restart required. UI Version: ${environment.serverTarget} - Server Version: ${this.$settings.uiVersion} `)
      const ref = this.$modal.open(ConfirmComponent, {
        size: 'lg',
        backdrop: 'static',
      })

      ref.componentInstance.title = this.$translate.instant('platform.version.service_restart_required')
      ref.componentInstance.message = this.$translate.instant('platform.version.restart_required', {
        serverVersion: this.$settings.uiVersion,
        uiVersion: environment.serverTarget,
      })
      ref.componentInstance.confirmButtonLabel = this.$translate.instant('menu.tooltip_restart')
      ref.componentInstance.faIconClass = 'fas fa-fw-power-off'

      ref.result.then(() => {
        this.$router.navigate(['/restart'])
      }).catch(() => {
        // do nothing
      })
    }
  }
}
