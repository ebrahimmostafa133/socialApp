import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Post } from '../model/post.interface';

@Injectable({
  providedIn: 'root'
})
export class PostService {

  private readonly httpClient = inject(HttpClient);
  allPosts: WritableSignal<Post[]> = signal([]);

  createPost(data: object): Observable<any> {
    return this.httpClient.post(environment.baseUrl + `posts`, data);
  }

  getAllPosts(): Observable<any> {
    return this.httpClient.get(environment.baseUrl + `posts`);
  }

  getPostsWithLimit(limit: number = 50, page: number = 1, sort: string = '-createdAt'): Observable<any> {
    return this.httpClient.get(environment.baseUrl + `posts?limit=${limit}&page=${page}&sort=${sort}`);
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

  // Method to refresh a single post with full data (including populated user)
  refreshSinglePost(postId: string): void {
    console.log('Refreshing single post:', postId);
    this.getSinglePost(postId).subscribe({
      next: (response) => {
        console.log('Refreshed post response:', response);
        let refreshedPost = response;
        if (response && response.post) {
          refreshedPost = response.post;
        } else if (response && response.data) {
          refreshedPost = response.data;
        }

        if (refreshedPost && refreshedPost._id) {
          console.log('Updating post in allPosts array:', refreshedPost);
          // Update the post in the allPosts array
          const currentPosts = this.allPosts();
          const updatedPosts = currentPosts.map(post => 
            post._id === postId ? refreshedPost : post
          );
          this.allPosts.set(updatedPosts);
        }
      },
      error: (error) => {
        console.error('Error refreshing post:', error);
      }
    });
  }

  // 🔥 Method to add a new post to the beginning of the array
  addNewPostToFeed(newPost: Post): void {
    const currentPosts = this.allPosts();
    
    // Check if post already exists to avoid duplicates
    const existingPostIndex = currentPosts.findIndex(p => p._id === newPost._id);
    
    if (existingPostIndex >= 0) {
      // Update existing post
      const updatedPosts = [...currentPosts];
      updatedPosts[existingPostIndex] = newPost;
      this.allPosts.set(updatedPosts.sort(
        (a: Post, b: Post) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } else {
      // Add new post to beginning
      const updatedPosts = [newPost, ...currentPosts].sort(
        (a: Post, b: Post) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      this.allPosts.set(updatedPosts);
    }
  }

  // 🔥 Method to get posts for a specific user (for profile filtering)
  getUserPostsFromFeed(userId: string): Post[] {
    return this.allPosts().filter(post => post.user?._id === userId);
  }
}