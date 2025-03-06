import { Component } from '@angular/core';
import { MasterContentService } from '../../../../shared/constants/masterContent.service';

@Component({
  selector: 'app-download-form',
  standalone: true,
  imports: [],
  templateUrl: './download-form.component.html',
  styleUrl: './download-form.component.scss'
})
export class DownloadFormComponent {
  customer: string = '';
  supplier: string = '';
  oneIndividual: string = '';
  oneLegal: string = '';
  gchIndividual: string = '';
  gchLegal: string = '';
  constructor(
    private masterService: MasterContentService,
  ) { }

  ngOnInit(): void {
    this.loadManualContent();
  }

  loadManualContent(): void {
    this.masterService.findContentById(3).subscribe({
      next: (data) => {
        if (Array.isArray(data) && data.length > 0) {
          this.customer = data[0].content
        } else {
          console.log("No content available");
        }
      },
      error: (err) => {
        console.error('Error fetching Content:', err);
      }
    });
    this.masterService.findContentById(5).subscribe({
      next: (data) => {
        if (Array.isArray(data) && data.length > 0) {
          this.supplier = data[0].content
        } else {
          console.log("No content available");
        }
      },
      error: (err) => {
        console.error('Error fetching Content:', err);
      }
    });
    this.masterService.findContentById(7).subscribe({
      next: (data) => {
        if (Array.isArray(data) && data.length > 0) {
          this.oneIndividual = data[0].content
        } else {
          console.log("No content available");
        }
      },
      error: (err) => {
        console.error('Error fetching Content:', err);
      }
    });
    this.masterService.findContentById(8).subscribe({
      next: (data) => {
        if (Array.isArray(data) && data.length > 0) {
          this.oneLegal = data[0].content
        } else {
          console.log("No content available");
        }
      },
      error: (err) => {
        console.error('Error fetching Content:', err);
      }
    });
    this.masterService.findContentById(9).subscribe({
      next: (data) => {
        if (Array.isArray(data) && data.length > 0) {
          this.gchIndividual = data[0].content
        } else {
          console.log("No content available");
        }
      },
      error: (err) => {
        console.error('Error fetching Content:', err);
      }
    });
    this.masterService.findContentById(12).subscribe({
      next: (data) => {
        if (Array.isArray(data) && data.length > 0) {
          this.gchLegal = data[0].content
        } else {
          console.log("No content available");
        }
      },
      error: (err) => {
        console.error('Error fetching Content:', err);
      }
    });
  }
}
