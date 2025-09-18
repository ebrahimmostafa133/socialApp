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

}