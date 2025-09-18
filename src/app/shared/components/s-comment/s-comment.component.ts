import { Component, input, inject, signal, WritableSignal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommentService } from './services/comment.service';
import { Comment } from '../s-post/model/post.interface';

@Component({
  selector: 'app-s-comment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './s-comment.component.html',
  styleUrl: './s-comment.component.css'
})
export class SCommentComponent implements OnInit {
  private readonly commentService = inject(CommentService);

  // ✅ Using input signals
  postId = input.required<string>();
  commentsSignal = input.required<WritableSignal<Comment[]>>();

  // ✅ Local signals
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
        // Ensure we always have a valid array and filter out any invalid comments
        const validComments = (res.comments || []).filter((comment: Comment) => 
          comment && comment._id && comment.commentCreator
        );
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

    // Make the API call first (simpler approach)
    this.commentService.createComment({
      content: commentContent,
      post: this.postId()
    }).subscribe({
      next: (response) => {
        // Check if response has the new comment
        if (response && response.comment && response.comment._id) {
          // Add the new comment to the list
          this.commentsSignal().update(comments => [...comments, response.comment]);
        } else {
          // If response doesn't include the comment, reload all comments
          this.loadComments();
        }
        this.isAddingComment.set(false);
      },
      error: (error) => {
        console.error('Error adding comment:', error);
        // Restore the comment text so user can try again
        this.newComment.set(commentContent);
        this.isAddingComment.set(false);
      }
    });
  }

  deleteComment(commentId: string) {
    if (!commentId) return;

    this.commentService.deleteComment(commentId).subscribe({
      next: () => {
        // Remove the comment from the list
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
}