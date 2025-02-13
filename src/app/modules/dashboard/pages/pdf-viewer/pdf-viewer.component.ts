import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { ModalDataService } from '../../services/modal-data.service';
import { NgZorroAntdModule } from '../../../../shared/ng-zorro-antd.module';
import { LogDownloadSerive } from '../../../../shared/constants/logDownload.service';

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [CommonModule, PdfViewerModule, NgZorroAntdModule],
  templateUrl: './pdf-viewer.component.html',
  styleUrl: './pdf-viewer.component.scss'
})
export class PdfViewerComponent {
  pdfSrc!: string; 
  constructor(private modalDataService: ModalDataService,
    private logDownLoad: LogDownloadSerive,
  ) {
    this.pdfSrc = this.modalDataService.getData();
    console.log("this.data : ", this.pdfSrc);
  }

  logDownloadActivity() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    this.logDownLoad.logDownload(currentUser.user.username, this.pdfSrc)
      .subscribe((data: any) => {
        console.log("✅ บันทึก Log สำเร็จ!");
        this.downloadPdf();
      });
  }

  downloadPdf() {
    fetch(this.pdfSrc)
      .then(response => response.blob()) 
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = this.getFileName(this.pdfSrc);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url); 
      })
      .catch(error => console.error("❌ เกิดข้อผิดพลาดในการดาวน์โหลด:", error));
  }

  getFileName(url: string): string {
    const matches = url.match(/watermarked_.+/);
    return matches ? matches[0] : 'download.pdf'; 
}



}
