import { Component, effect, ElementRef, EventEmitter, inject, model, OnInit, Output, signal, viewChild, WritableSignal } from '@angular/core';
import { initFlowbite, Modal } from 'flowbite';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { PostService } from '../s-post/services/post.service';
import { CommonModule } from '@angular/common';
import { PostEditService } from './services/post-edit.service';
import { Post } from '../s-post/model/post.interface';
import { UserService } from '../../../features/auth/services/user.service';

@Component({
  selector: 'app-create-post',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './create-post.component.html',
  styleUrl: './create-post.component.css'
})
export class CreatePostComponent implements OnInit {

  @Output() newPostCreated = new EventEmitter<Post>();

  private readonly postService = inject(PostService);
  private readonly userService = inject(UserService); // Add this injection
  allposts = this.postService.allPosts;
  // pagination
  limit: number = 20;   
  page: number = 1;  
  private readonly postEditService = inject(PostEditService);

  saveFile: WritableSignal<File | null> = signal(null);
  previewUrl: WritableSignal<string | null> = signal(null);  

  content: FormControl = new FormControl('', [Validators.required]);
  myModel = viewChild<ElementRef>('modal');

  constructor() {
    // Fill form when postToEdit changes
    effect(() => {
      const post = this.postEditService.postToEdit();
      if (post) {
        this.content.setValue(post.body);
        if (post.image) this.previewUrl.set(post.image);
      } else {
        this.content.reset();
        this.saveFile.set(null);
        this.previewUrl.set(null);
      }
    });

    // Open modal when triggered
    effect(() => {
      if (this.postEditService.openModal()) {
        const modalEl = document.getElementById('authentication-modal');
        if (modalEl) new Modal(modalEl).show();

        // Reset trigger after opening
        this.postEditService.openModal.set(false);
      }
    });
  }

  ngOnInit(): void {
    initFlowbite();

    // Load all posts on initialization
    this.loadAllPosts();
  }

  private loadAllPosts(): void {
    this.postService.getPostsWithLimit(this.limit, this.page).subscribe({
      next: (response) => {
        console.log('Posts loaded:', response);
        if (response && response.posts) {
          // For initial load, replace the posts array
          if (this.page === 1) {
            this.allposts.set(response.posts);
          } else {
            // For pagination, append to existing posts
            this.allposts.update(posts => [...posts, ...response.posts]);
          }
        }
      },
      error: (error) => {
        console.error('Error loading posts:', error);
      }
    });
  }

  changeImage(event: Event): void {
    let file = (event.target as HTMLInputElement).files?.[0] || null;
    this.saveFile.set(file);

    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl.set(reader.result as string); 
      };
      reader.readAsDataURL(file);
    } else {
      this.previewUrl.set(null);
    }
  }

  submitForm(e: Event): void {
    e.preventDefault();
    if (!this.content.valid) return;

    const formData = new FormData();
    if (this.saveFile()) formData.append('image', this.saveFile()!, this.saveFile()!.name);
    formData.append('body', this.content.value);
    
    if (this.postEditService.postToEdit()) {
      // Update existing post
      const originalPost = this.postEditService.postToEdit()!;
      this.postService.updatePost(originalPost._id, formData).subscribe({
        next: (response) => {
          console.log('Post updated', response);
          
          // Preserve the original user data and merge with updated content
          let updatedPost = response;
          if (response && response.post) {
            updatedPost = response.post;
          }
          
          // Merge the updated post data with the original user data
          const completeUpdatedPost = {
            ...originalPost, // Keep original data (including user info)
            ...updatedPost,  // Override with updated data
            user: originalPost.user, // Ensure user data is preserved
            _id: originalPost._id // Ensure ID is preserved
          };
          
          // Update the post in the allPosts array
          const currentPosts = this.postService.allPosts();
          const updatedPosts = currentPosts.map(p => 
            p._id === originalPost._id ? completeUpdatedPost : p
          );
          this.postService.allPosts.set(updatedPosts);
          
          // Store the updated post in the edit service
          this.postEditService.updatedPost.set(completeUpdatedPost);
          
          this.resetForm();
          new Modal(this.myModel()?.nativeElement).hide();
          this.postEditService.postToEdit.set(null);
        },
        error: (error) => {
          console.error('Error updating post:', error);
        }
      });
    } else {
      // Create new post
      this.postService.createPost(formData).subscribe({
        next: (response) => {
          console.log('Post created - Full response:', response);
          
          // Handle different response structures
          let newPost:any = null;
          
          if (response && response.post) {
            newPost = response.post;
          } else if (response && response.data) {
            newPost = response.data;
          } else if (response && response._id) {
            // Response is the post itself
            newPost = response;
          }
          
          console.log('Extracted new post:', newPost);
          
          if (newPost) {
            // 🔥 CRITICAL: Ensure the post has complete user data
            const currentUser = this.userService.user();
            
            // If the post doesn't have complete user data, add it
            if (!newPost.user || !newPost.user.name || !newPost.user.photo) {
              newPost = {
                ...newPost,
                user: {
                  _id: currentUser?._id || newPost.user?._id,
                  name: currentUser?.name || newPost.user?.name || 'Unknown User',
                  photo: currentUser?.photo || newPost.user?.photo || '/images/profile.png',
                  email: currentUser?.email || newPost.user?.email,
                  ...newPost.user // Keep any existing user data
                }
              };
            }

            // Ensure createdAt exists for proper sorting
            if (!newPost.createdAt) {
              newPost.createdAt = new Date().toISOString();
            }

            console.log('Final new post with user data:', newPost);
            
            // Add the new post to the beginning of the posts array
            const currentPosts = this.postService.allPosts();
            const updatedPosts = [newPost, ...currentPosts].sort(
              (a: Post, b: Post) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            this.postService.allPosts.set(updatedPosts);

            // 🔥 EMIT the post so ProfileComponent can react immediately
            console.log('Emitting newPostCreated event with:', newPost);
            this.newPostCreated.emit(newPost);
            
            // 🔥 Optional: Refresh the post from server to ensure we have complete data
            setTimeout(() => {
              if (newPost._id) {
                this.postService.refreshSinglePost(newPost._id);
              }
            }, 500);
            
          } else {
            console.warn('New post data not found in response, reloading posts');
            this.page = 1;
            this.loadAllPosts();
          }
          
          this.resetForm();
          new Modal(this.myModel()?.nativeElement).hide();
        },
        error: (error) => {
          console.error('Error creating post:', error);
        }
      });
    }
  }

  private resetForm() {
    this.content.reset();
    this.saveFile.set(null);
    this.previewUrl.set(null);
  }
}