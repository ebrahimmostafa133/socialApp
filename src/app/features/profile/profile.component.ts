import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { CreatePostComponent } from "../../shared/components/create-post/create-post.component";
import { SPostComponent } from "../../shared/components/s-post/s-post.component";
import { PostService } from '../../shared/components/s-post/services/post.service';
import { Post } from '../../shared/components/s-post/model/post.interface';
import { UserService } from '../auth/services/user.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CreatePostComponent, SPostComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {

  private readonly postService = inject(PostService);
  readonly userService = inject(UserService);
  
  previewPhoto = signal<string | null>(null);
  allPosts = signal<Post[]>([]);
  limit: number = 20;
  private lastPostsLength = 0;

  constructor() {
    // React to user changes using effect
    effect(() => {
      const user = this.userService.user();
      if (user?._id) {
        this.loadUserPosts(user._id);
      }
    });

    // 🔥 Watch postService.allPosts for new posts
    effect(() => {
      const servicePosts = this.postService.allPosts();
      const currentUser = this.userService.user();
      
      if (currentUser?._id && servicePosts.length > this.lastPostsLength) {
        // New post was added, filter and update user posts
        this.filterUserPostsFromService(currentUser._id, servicePosts);
        this.lastPostsLength = servicePosts.length;
      }
    });
  }

  ngOnInit(): void {
    // Load user data if not already loaded
    this.userService.getLoggedUserData().subscribe();
    
    // Set initial posts length
    this.lastPostsLength = this.postService.allPosts().length;
  }

  private loadUserPosts(userId: string): void {
    this.postService.getUserPosts(userId, this.limit).subscribe({
      next: (response) => {
        // Sort by createdAt desc (newest first)
        const sorted = (response.posts || []).sort(
          (a: Post, b: Post) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.allPosts.set(sorted);
      },
      error: (err) => console.error('Error loading user posts:', err)
    });
  }

  // 🔥 Filter user posts from the main service posts array
  private filterUserPostsFromService(userId: string, servicePosts: Post[]): void {
    const userPosts = servicePosts
      .filter(post => post.user?._id === userId)
      .sort((a: Post, b: Post) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    this.allPosts.set(userPosts);
  }

  // 🔥 Handle new post creation - called when create-post emits newPostCreated
  addNewPost(newPost: Post): void {
    console.log('ProfileComponent: addNewPost called with:', newPost);
    const currentUser = this.userService.user();
    console.log('Current user:', currentUser);
    
    // Only add if this post belongs to the current user (for profile page)
    if (newPost.user?._id === currentUser?._id) {
      console.log('Post belongs to current user, adding to profile posts');
      
      // Add to the beginning of the posts array for immediate display
      this.allPosts.update(posts => {
        console.log('Current posts before update:', posts);
        
        // Check if post already exists to avoid duplicates
        const existingPostIndex = posts.findIndex(p => p._id === newPost._id);
        if (existingPostIndex >= 0) {
          console.log('Post already exists, updating it');
          // Replace existing post
          const updatedPosts = [...posts];
          updatedPosts[existingPostIndex] = newPost;
          const sortedPosts = updatedPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          console.log('Posts after update:', sortedPosts);
          return sortedPosts;
        } else {
          console.log('Adding new post to beginning');
          // Add new post
          const sortedPosts = [newPost, ...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          console.log('Posts after adding new post:', sortedPosts);
          return sortedPosts;
        }
      });
    } else {
      console.log('Post does not belong to current user, skipping');
    }
  }

  onPostUpdated(updatedPost: Post): void {
    this.allPosts.update(posts =>
      posts.map(post => post._id === updatedPost._id ? updatedPost : post)
    );
  }

  onPostDeleted(postId: string): void {
    this.allPosts.update(posts =>
      posts.filter(post => post._id !== postId)
    );
  }

  onProfilePhotoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    
    // 🔥 Create preview URL for immediate display
    const previewUrl = URL.createObjectURL(file);
    
    // 🔥 Store original photo as backup
    const originalPhoto = this.userService.user()?.photo;
    
    // 🔥 IMMEDIATELY update user signal for instant UI update everywhere
    this.userService.user.update(user =>
      user ? { ...user, photo: previewUrl } : user
    );

    const formData = new FormData();
    formData.append('photo', file);

    this.userService.uploadProfilePhoto(formData).subscribe({
      next: (res) => {
        console.log('Profile photo updated:', res);

        const serverPhotoUrl = res.user?.photo || res.photo;
        
        // 🔥 Update user signal with server photo URL
        this.userService.user.update(user =>
          user ? { ...user, photo: serverPhotoUrl } : user
        );

        // 🔥 Clean up preview URL
        URL.revokeObjectURL(previewUrl);

        // 🔥 Update all existing posts with new profile photo
        this.updatePostsWithNewProfilePhoto(serverPhotoUrl);

        // 🔥 Also update posts in the main service
        this.updateServicePostsWithNewProfilePhoto(serverPhotoUrl);

        // 🔥 Force refresh user data to ensure server sync
        setTimeout(() => {
          this.userService.getLoggedUserData().subscribe({
            next: (userData) => {
              // Only update if the server has the new photo
              if (userData?.photo && userData.photo !== originalPhoto) {
                this.userService.user.update(user =>
                  user ? { ...user, photo: userData.photo } : user
                );
              }
            }
          });
        }, 1000); // Wait 1 second for server to process
      },
      error: (err) => {
        console.error('Upload failed:', err);
        
        // 🔥 Revert to original photo on error
        this.userService.user.update(user =>
          user ? { ...user, photo: originalPhoto || '/images/profile.png' } : user
        );
        
        // Clean up preview URL
        URL.revokeObjectURL(previewUrl);
      }
    });
  }

  // 🔥 Update posts in local array
  private updatePostsWithNewProfilePhoto(newPhotoUrl: string): void {
    const currentUserId = this.userService.user()?._id;
    if (!currentUserId) return;

    this.allPosts.update(posts =>
      posts.map(post => {
        if (post.user?._id === currentUserId) {
          return {
            ...post,
            user: { ...post.user, photo: newPhotoUrl }
          };
        }
        return post;
      })
    );
  }

  // 🔥 Update posts in main service array
  private updateServicePostsWithNewProfilePhoto(newPhotoUrl: string): void {
    const currentUserId = this.userService.user()?._id;
    if (!currentUserId) return;

    const servicePosts = this.postService.allPosts();
    const updatedServicePosts = servicePosts.map(post => {
      if (post.user?._id === currentUserId) {
        return {
          ...post,
          user: { ...post.user, photo: newPhotoUrl }
        };
      }
      return post;
    });

    this.postService.allPosts.set(updatedServicePosts);
  }

  // 🔥 Get current profile photo for immediate display
  getCurrentProfilePhoto(): string {
    const userPhoto = this.userService.user()?.photo;
    return userPhoto || '/images/profile.png';
  }
}