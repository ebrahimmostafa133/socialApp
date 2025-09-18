import { Component, inject, input, signal, computed, effect, output } from '@angular/core';
import { Post } from './model/post.interface';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SCommentComponent } from '../s-comment/s-comment.component';
import { PostService } from './services/post.service';

@Component({
  selector: 'app-s-post',
  standalone: true,
  imports: [CommonModule, FormsModule, SCommentComponent],
  templateUrl: './s-post.component.html',
  styleUrls: ['./s-post.component.css']
})
export class SPostComponent {
  private readonly postService = inject(PostService);

  post = input.required<Post>();
  mode = input.required<string>();
  
  // Use writable signal for comments (this will be the single source of truth)
  commentsWritable = signal<any[]>([]);
  // Output events to parent component
  postUpdated = output<Post>();
  postDeleted = output<string>(); // Emit post ID
  refreshRequested = output<void>();
  
  // Use computed signal that reads from commentsWritable for display
  comments = computed(() => this.commentsWritable());

  openDropdownId = signal<string | null>(null);
  showComments = signal(false);

  constructor() {
    // Effect to sync comments when post changes
    effect(() => {
      const currentPost = this.post();
      if (currentPost?.comments) {
        this.commentsWritable.set(currentPost.comments);
      }
    });
  }

  toggleDropdown(postId: string) {
    const currentId = this.openDropdownId();
    this.openDropdownId.set(currentId === postId ? null : postId);
  }

  onHide(post: Post) {
    console.log('Hide post:', post);
    // Add your hide logic here
  }

  onUpdate(post: Post) {
    console.log('Update post:', post);
    
    // Example update logic - you can modify this based on your needs
    const updatedData = {
      body: 'Updated post content', // This should come from a form or modal
      // Add other fields you want to update
    };

    this.postService.updatePost(post._id, updatedData).subscribe({
      next: (response) => {
        console.log('Post updated successfully', response);
        
        // Option 1: Emit the updated post data if API returns it
        if (response.post) {
          this.postUpdated.emit(response.post);
        } else {
          // Option 2: Just request a refresh if API doesn't return updated data
          this.refreshRequested.emit();
        }
        
        // Close dropdown after successful update
        this.openDropdownId.set(null);
      },
      error: (error) => {
        console.error('Error updating post:', error);
      }
    });
  }

  onDelete(post: Post) {
    console.log('Delete post:', post);
    
    // Optional: Show confirmation dialog
    const confirmed = confirm('Are you sure you want to delete this post?');
    if (!confirmed) return;

    this.postService.deletePost(post._id).subscribe({
      next: (response) => {
        console.log('Post deleted successfully', response);
        
        // Emit the post ID to parent so it can remove it from the list
        this.postDeleted.emit(post._id);
        
        // Close dropdown after successful deletion
        this.openDropdownId.set(null);
      },
      error: (error) => {
        console.error('Error deleting post:', error);
      }
    });
  }

  toggleComments() {
    this.showComments.update(current => !current);
  }

  // Method to update comments from child component
  updateComments(newComments: any[]) {
    this.commentsWritable.set(newComments);
  }
}