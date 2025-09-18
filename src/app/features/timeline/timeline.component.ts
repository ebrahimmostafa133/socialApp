import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { CreatePostComponent } from "../../shared/components/create-post/create-post.component";
import { SPostComponent } from "../../shared/components/s-post/s-post.component";
import { PostService } from '../../shared/components/s-post/services/post.service';
import { Post } from '../../shared/components/s-post/model/post.interface';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CreatePostComponent, SPostComponent, InfiniteScrollModule],
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.css'
})
export class TimelineComponent implements OnInit {

  private readonly postService = inject(PostService);
  allPosts = this.postService.allPosts;
    hasMorePosts = signal(true);

  // pagination
  limit: number = 20;   
  page: number = 1;     

  ngOnInit(): void {
    this.loadPosts();
  }
    

loadPosts(): void {
  this.postService.getPostsWithLimit(this.limit, this.page).subscribe({
    next: (response) => {
      this.allPosts.update(posts => [...posts, ...response.posts]);
    }
  });
}

onScroll(): void {
  console.log("Scrolled!! Load more posts...");
  this.page += 1;  // increment page
  this.loadPosts();
}

refreshPosts(): void {
    this.page = 1;
    this.hasMorePosts.set(true);
    this.allPosts.set([]); // Clear existing posts
    this.loadPosts();
  }

  // Method to add a new post to the beginning (after creation)
  addNewPost(newPost: Post): void {
    this.allPosts.update(posts => [newPost, ...posts]);
  }

  // Handle post update event from child component
  onPostUpdated(updatedPost: Post): void {
    console.log('Post updated in timeline:', updatedPost);
    this.allPosts.update(posts => 
      posts.map(post => 
        post._id === updatedPost._id ? updatedPost : post
      )
    );
  }

  // Handle post delete event from child component
  onPostDeleted(postId: string): void {
    console.log('Post deleted in timeline:', postId);
    this.allPosts.update(posts => 
      posts.filter(post => post._id !== postId)
    );
  }

  // Handle refresh request from child component
  onRefreshRequested(): void {
    console.log('Refresh requested from child component');
    this.refreshPosts();
  }

}