import { Component, ElementRef, inject, model, OnInit, signal, viewChild, WritableSignal } from '@angular/core';
import { initFlowbite, Modal } from 'flowbite';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { PostService } from '../s-post/services/post.service';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-create-post',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './create-post.component.html',
  styleUrl: './create-post.component.css'
})
export class CreatePostComponent implements OnInit {

  private readonly postService = inject(PostService);
  allposts = this.postService.allPosts;
  
  saveFile: WritableSignal<File | null> = signal(null);
  previewUrl: WritableSignal<string | null> = signal(null);  

  content: FormControl = new FormControl('', [Validators.required]);
  myModel = viewChild<ElementRef>('modal');

  ngOnInit(): void {
    initFlowbite();
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
    if (this.content.valid) {
      console.log(this.content.value);
      console.log(this.saveFile());

      const formData = new FormData();
      let file = this.saveFile();
      if (file) {
        formData.append('image', file, file.name);
      }
      formData.append('body', this.content.value);

      this.postService.createPost(formData).subscribe({
        next: (response) => {
          console.log(response);
          if (response.message === 'success') {
            this.content.reset();
            this.saveFile.set(null);
            this.previewUrl.set(null);
            new Modal(this.myModel()?.nativeElement).hide();

            //reload posts
            this.postService.getPostsWithLimit(10, 1).subscribe({
              next: (response) => {
                this.allposts.set(response.posts);
              }
            });
          }
        },
        error: (error) => {
          console.log(error);
        }
      });
    }
  }

  
}
