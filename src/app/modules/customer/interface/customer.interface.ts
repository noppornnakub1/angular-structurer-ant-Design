export interface ICustomer {
    id: number,
    name: string,
    key:string,
    tax_Id: string,
    address_sup: string,
    district: string,
    subdistrict: string,
    province: string,
    postalCode: string,
    status:string,
    tel: string,
    email: string,
    customer_num: string,
    customer_type: string,
    site: string,
    tax:string,
    company: string,
    fileReq: string,
    fileCertificate: string,
    path: string
  }

  export interface CustomerSupplier {
    id: number;
    name: string;
    tax_Id: string;
    address_sup: string;
    district: string;
    subdistrict: string;
    province: string;
    postalCode: string;
    tel: string;
    email: string;
    num: string; // เป็น customer_num หรือ supplier_num ขึ้นอยู่กับข้อมูล
    type: string; // เป็น customer_type หรือ supplier_type ขึ้นอยู่กับข้อมูล
    site: string;
    payment_Method?: string; // อาจเป็น null หรือไม่มีสำหรับ customer
    source: string; // 'Customer' หรือ 'Supplier'
    user_id: number;
  }

  export interface DataOld {
    NAME: string;
    TAX?: string;
    NUM: string; // เป็น customer_num หรือ supplier_num ขึ้นอยู่กับข้อมูล
    SITE?: string;
    KEY?:string;
    VENDOR_TYPE?: string;
    COMPANY_GROUP?: string;
    KEY_CUSTOMER?: string;
    PAYMENT_MEDTHOD?: string;

  }
  
  