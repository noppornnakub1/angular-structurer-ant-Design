import { Injectable } from '@angular/core';
import { DeviceType } from '../enum/device-type.enum';


@Injectable({
  providedIn: 'root'
})
export class OsDetectorService {

  constructor() { }

  getDeviceType(): string {
    const userAgent = window.navigator.userAgent.toLowerCase();


    if (/macintosh|mac os x/i.test(userAgent)) {
      return DeviceType.MAC_OS;
    } else if (/ipad/i.test(userAgent)) {
      return DeviceType.TABLET;
    } else if (/iphone|ipod/i.test(userAgent)) {
      return DeviceType.MOBILE;
    } else if (/android/i.test(userAgent) && !/mobile/i.test(userAgent)) {
      return DeviceType.TABLET; // Android tablets
    } else if (/android/i.test(userAgent)) {
      return DeviceType.MOBILE; // Android mobile devices
    } else {
      return DeviceType.PC;
    }
  }


  isMobile(): boolean {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipod|android|windows phone/.test(userAgent);
  }

  isTablet(): boolean {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /ipad|android/.test(userAgent) && !/mobile/.test(userAgent);
  }

  isDesktop(): boolean {
    return !this.isMobile() && !this.isTablet();
  }
}
