import { Component, Input } from "@angular/core";
import { ModalDataService } from "../../../services/modal-data.service";
import { CommonModule } from "@angular/common";
import { SupplierService } from "../../../../supplier/services/supplier.service";
import { CustomerService } from "../../../../customer/services/customer.service";

@Component({
  selector: "app-view-details",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./view-details.component.html",
  styleUrl: "./view-details.component.scss",
})
export class ViewDetailsComponent {
  data: any;
  type: string = "";
  logs: any[] = [];
  constructor(
    private modalDataService: ModalDataService,
    private supplierService: SupplierService,
    private customerService: CustomerService,
  ) {
    this.data = this.modalDataService.getData();
    this.type = this.data?.source || "";

    if (this.type === "Supplier") {
      this.supplierService.getLog(this.data.id).subscribe((log) => {
        this.logs = log;
      });
    } else if (this.type === "Customer") {
      this.customerService.getLog(this.data.id).subscribe((log) => {
        this.logs = log;
      });
    }
  }

  fnApproverStatus(): string {
    const status = this.data?.status;
    if (status === "Success") {
      return "(Success)";
    }
    if (status === "Approved By ACC") {
      return "(Waiting FN Review)";
    }
    if (status === "Pending Approved By ACC") {
      const fnLog = this.logs.find((log) => log.userId === this.data?.ownerFN);
      if (fnLog && fnLog.rejectReason !== "" && fnLog.rejectReason !== null) {
        return "(Reject)";
      }
    }
    return "";
  }
}
