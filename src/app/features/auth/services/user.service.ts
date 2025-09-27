import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private readonly httpClient =inject(HttpClient);

  signUp(data:object):Observable<any>{
    return this.httpClient.post(environment.baseUrl+`users/signup`,data);
  }

  signIn(data:object):Observable<any>{
    return this.httpClient.post(environment.baseUrl+`users/signin`,data);
  }

  changePassword(data:object):Observable<any>{
    return this.httpClient.patch(environment.baseUrl+`users/change-password`,data);
  }

  uploadProfilePhoto(data:object):Observable<any>{
    return this.httpClient.put(environment.baseUrl+`users/upload-photo`,data);
  }

  // Signal to hold user data
  user = signal<any | null>(null);

  getLoggedUserData() {
    return this.httpClient.get(environment.baseUrl + 'users/profile-data').pipe(
      tap((res: any) => {
        if (res.message === 'success') {
          this.user.set(res.user);
        }
      })
    );
  }

  // Add this method to your UserService class

  /**
   * Force update user signal to trigger reactivity across all components
   */
  forceUserUpdate(): void {
    const currentUser = this.user();
    if (currentUser) {
      // Create a new reference to trigger signal updates
      this.user.set({ ...currentUser });
    }
  }

  /**
   * Update user photo and trigger reactivity
   */
  updateUserPhoto(photoUrl: string): void {
    this.user.update(user => 
      user ? { ...user, photo: photoUrl } : user
    );
    // Force update to ensure all components react
    this.forceUserUpdate();
  }
  
}
