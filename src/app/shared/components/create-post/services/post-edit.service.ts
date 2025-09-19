import { Injectable, signal, WritableSignal } from '@angular/core';
import { Post } from '../../s-post/model/post.interface';

@Injectable({ providedIn: 'root' })
export class PostEditService {
  // Signal holding the post to edit (null means no edit)
  postToEdit: WritableSignal<Post | null> = signal(null);

  // Signal to trigger modal open
  openModal: WritableSignal<boolean> = signal(false);
  
  // Signal to hold the updated post for communication between components
  updatedPost: WritableSignal<Post | null> = signal(null);
}