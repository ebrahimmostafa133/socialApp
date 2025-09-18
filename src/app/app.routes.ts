import { Routes } from '@angular/router';
import { MainLayoutComponent } from './core/layouts/main-layout/main-layout.component';
import { TimelineComponent } from './features/timeline/timeline.component';
import { ProfileComponent } from './features/profile/profile.component';
import { DetailsPostComponent } from './features/details-post/details-post.component';
import { ChangePasswordComponent } from './features/auth/change-password/change-password.component';
import { AuthLayoutComponent } from './core/layouts/auth-layout/auth-layout.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { NotfoundComponent } from './features/notfound/notfound.component';
import { authGuard } from './core/guards/auth-guard';
import { isLoggedGuard } from './core/guards/is-logged-guard';

export const routes: Routes = [
      {path:'',redirectTo:'timeline',pathMatch:'full'}
      ,{
            path:'',component:MainLayoutComponent,
            canActivate: [authGuard]
            ,children:[
                  {path: 'timeline',component:TimelineComponent ,title:'Timeline page' },
                  {path: 'profile',component:ProfileComponent ,title:'Profile page' },
                  {path: 'details',component:DetailsPostComponent ,title:'Detalis page' },
                  {path: 'change',component:ChangePasswordComponent,title:'ChangePassword page'}
            ]
      },
      {
            path:'',component:AuthLayoutComponent,
            canActivate: [isLoggedGuard],
            children:[
                  {path: 'login',component:LoginComponent ,title:'Login page' },
                  {path: 'register',component:RegisterComponent ,title:'Register page' },
            ]
      },
      {path:'**',component:NotfoundComponent, title:'NotFound Page'}
];
