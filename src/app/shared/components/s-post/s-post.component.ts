import { Component, inject, input, signal, computed, effect } from '@angular/core';
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
    // Add your update logic here
  }

  onDelete(post: Post) {
    console.log('Delete post:', post);
    // Add your delete logic here
    this.postService.deletePost(post._id).subscribe({
      next: (response) => {
        console.log('Post deleted successfully', response);
        // You might want to emit an event to parent component to remove this post
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