import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PostService {

  private readonly httpClient = inject(HttpClient);

  createPost(data: object): Observable<any> {
    return this.httpClient.post(environment.baseUrl + `posts`, data);
  }

  getAllPosts(): Observable<any> {
    return this.httpClient.get(environment.baseUrl + `posts`);
  }

  getPostsWithLimit(limit: number = 50, page: number = 1): Observable<any> {
    return this.httpClient.get(environment.baseUrl + `posts?limit=${limit}`);
  }

  getUserPosts(userId: string, limit: number = 2): Observable<any> {
    return this.httpClient.get(environment.baseUrl + `users/${userId}/posts?limit=${limit}`);
  }

  getSinglePost(id: string): Observable<any> {
    return this.httpClient.get(environment.baseUrl + `posts/${id}`);
  }

  updatePost(id: string, data: object): Observable<any> {
    return this.httpClient.put(environment.baseUrl + `posts/${id}`, data);
  }

  deletePost(id: string): Observable<any> {
    return this.httpClient.delete(environment.baseUrl + `posts/${id}`);
  }
}
