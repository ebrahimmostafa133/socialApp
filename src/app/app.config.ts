import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling, withViewTransitions } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { headerInterceptor } from './core/interceptors/header-interceptor';
import { provideToastr } from 'ngx-toastr';
import { errorHandleInterceptor } from './core/interceptors/error-handle-interceptor';
import { provideAnimations  } from '@angular/platform-browser/animations';  

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withInMemoryScrolling({scrollPositionRestoration: 'top'}), withViewTransitions()),
    provideHttpClient(withFetch(),withInterceptors([headerInterceptor,errorHandleInterceptor]) ),
    provideToastr(),
    provideAnimations(),
  ]
};
