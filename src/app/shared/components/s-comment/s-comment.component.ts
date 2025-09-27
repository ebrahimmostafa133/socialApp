import { Component, input, inject, signal, WritableSignal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommentService } from './services/comment.service';
import { Comment } from '../s-post/model/post.interface';
import { environment } from '../../../../environments/environment';
import { UserService } from '../../../features/auth/services/user.service'; // Add this import

@Component({
  selector: 'app-s-comment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './s-comment.component.html',
  styleUrl: './s-comment.component.css'
})
export class SCommentComponent implements OnInit {
  private readonly commentService = inject(CommentService);
  private readonly userService = inject(UserService); // Add this injection

  // Input signals
  postId = input.required<string>();
  commentsSignal = input.required<WritableSignal<Comment[]>>();
  
  // Local signals
  loading = signal<boolean>(false);
  newComment = signal<string>("");
  isAddingComment = signal<boolean>(false);

  ngOnInit() {
    this.loadComments();
  }

  loadComments() {
    this.loading.set(true);
    this.commentService.getPostComments(this.postId()).subscribe({
      next: (res) => {
        const validComments = (res.comments || []).filter((comment: Comment) =>
          comment && comment._id && comment.commentCreator
        );
        // Fix: Use commentsSignal() instead of this.comments
        this.commentsSignal().set(validComments);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading comments:', error);
        this.loading.set(false);
      }
    });
  }

  addComment() {
    if (!this.newComment().trim() || this.isAddingComment()) return;

    const commentContent = this.newComment().trim();
    this.isAddingComment.set(true);
    this.newComment.set(""); // Clear input immediately

    this.commentService.createComment({
      content: commentContent,
      post: this.postId()
    }).subscribe({
      next: (response) => {
        if (response && response.comment && response.comment._id) {
          this.commentsSignal().update(comments => [...comments, response.comment]);
        } else {
          this.loadComments();
        }
        this.isAddingComment.set(false);
      },
      error: (error) => {
        console.error('Error adding comment:', error);
        this.newComment.set(commentContent);
        this.isAddingComment.set(false);
      }
    });
  }

  deleteComment(commentId: string) {
    if (!commentId) return;

    this.commentService.deleteComment(commentId).subscribe({
      next: () => {
        this.commentsSignal().update(comments => 
          comments.filter((comment: Comment) => comment && comment._id !== commentId)
        );
      },
      error: (error) => {
        console.error('Error deleting comment:', error);
      }
    });
  }

  // Helper method to get safe comments array
  getSafeComments() {
    const comments = this.commentsSignal()();
    return comments.filter((comment: Comment) => comment && comment._id && comment.commentCreator);
  }

  // Get comment creator photo with full URL
  getCommentCreatorPhoto(commentCreator: { photo?: string }): string {
    if (!commentCreator) {
      return '/images/profile.png';
    }

    const photo = commentCreator.photo;
    
    // Handle various invalid photo states
    if (!photo || 
        photo === '' || 
        photo === 'undefined' || 
        photo === 'null' ||
        photo.includes('undefined') ||
        photo.includes('null')) {
      return '/images/profile.png';
    }

    // If it's already a full URL, return as is
    if (photo.startsWith('http://') || photo.startsWith('https://')) {
      return photo;
    }

    // If it starts with /, it's a relative path, prepend base URL
    if (photo.startsWith('/')) {
      return environment.baseUrl + photo;
    }

    // Otherwise, assume it's a filename and build full URL
    return environment.baseUrl + '/' + photo;
  }

  // Get current user's photo
  getCurrentUserPhoto(): string {
    const user = this.userService.user();
    if (!user || !user.photo) {
      return '/images/profile.png';
    }

    const photo = user.photo;
    
    // Handle various invalid photo states
    if (photo === '' || 
        photo === 'undefined' || 
        photo === 'null' ||
        photo.includes('undefined') ||
        photo.includes('null')) {
      return '/images/profile.png';
    }

    // If it's already a full URL, return as is
    if (photo.startsWith('http://') || photo.startsWith('https://')) {
      return photo;
    }

    // If it starts with /, it's a relative path, prepend base URL
    if (photo.startsWith('/')) {
      return environment.baseUrl + photo;
    }

    // If it's a blob URL (for immediate preview), return as is
    if (photo.startsWith('blob:')) {
      return photo;
    }

    // Otherwise, assume it's a filename and build full URL
    return environment.baseUrl + '/' + photo;
  }

  // Handle image loading errors
  handleImageError(event: Event) {
    const target = event.target as HTMLImageElement;
    target.src = '/images/profile.png';
  }
}