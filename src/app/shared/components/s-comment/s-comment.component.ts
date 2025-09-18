import { Component, Input, inject, signal, effect, input } from '@angular/core';
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
export class SCommentComponent {
  private readonly commentService = inject(CommentService);

  // ✅ postId will come from parent component
  @Input({ required: true }) postId!: string;
  

  // ✅ Signals
  comments = signal<Comment[]>([]);
  loading = signal<boolean>(false);
  newComment = signal<string>("");

  constructor() {
    // re-fetch whenever postId changes
    effect(() => {
      if (this.postId) {
        this.loadComments();
      }
    });
  }

  loadComments() {
    this.loading.set(true);
    this.commentService.getPostComments(this.postId).subscribe({
      next: (res) => {
        this.comments.set(res.comments); // assuming API returns array
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  addComment() {
  if (!this.newComment().trim()) return;

  this.commentService.createComment({
    content: this.newComment(),
    post: this.postId
  }).subscribe({
    next: () => {
      // After success, reload comments from server
      this.newComment.set("");
      this.loadComments();
    }
  });
}


  deleteComment(commentId: string) {
    this.commentService.deleteComment(commentId).subscribe({
      next: () => {
        this.comments.update(c => c.filter(cm => cm._id !== commentId));
      }
    });
  }
}
