import { Component, input } from '@angular/core';
import { Post } from './model/post.interface';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SCommentComponent } from '../s-comment/s-comment.component';
import { NgIf } from '@angular/common';
@Component({
  selector: 'app-s-post',
  standalone: true,
  imports: [CommonModule, FormsModule, SCommentComponent, NgIf],
  templateUrl: './s-post.component.html',
  styleUrls: ['./s-post.component.css']
})
export class SPostComponent {
  post = input.required<Post>();
  mode = input.required<string>();
  

  openDropdownId: string | null = null;
  showComments = false;

  toggleDropdown(postId: string) {
    this.openDropdownId = this.openDropdownId === postId ? null : postId;
  }

  onHide(post: Post) {
    console.log('Hide post:', post);
  }

  onUpdate(post: Post) {
    console.log('Update post:', post);
  }

  onDelete(post: Post) {
    console.log('Delete post:', post);
  }

  toggleComments() {
    this.showComments = !this.showComments;
  }
}
