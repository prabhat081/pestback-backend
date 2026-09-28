export type InvoiceStatus =
  | "draft"
  | "issued"
  | "partially-paid"
  | "paid"
  | "cancelled";

export type GstType =
  | "cgst-sgst"
  | "igst";

export interface InvoicePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface InvoiceListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: InvoiceStatus;
  customerId?: string;
  propertyId?: string;
  jobId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface InvoiceCustomer {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
}

export interface InvoiceProperty {
  id: string;
  name: string;
  propertyType: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface InvoiceJob {
  id: string;
  jobNumber: string;
  status: string;
  priority: string;
}

export interface Invoice {
  id: string;
  companyId: string;

  customerId: string;
  propertyId: string;
  jobId: string;

  invoiceNumber: string;
  status: InvoiceStatus;

  issueDate: string | null;
  dueDate: string | null;

  taxApplied: boolean;
  gstType: GstType | null;

  subtotal: string;
  discount: string;
  taxableAmount: string;

  cgstAmount: string;
  sgstAmount: string;
  igstAmount: string;

  totalTax: string;
  total: string;

  notes: string | null;

  createdAt: string;
  updatedAt: string;

  customer: InvoiceCustomer;
  property: InvoiceProperty;
  job: InvoiceJob;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;

  description: string;
  quantity: string;
  unitPrice: string;
  discount: string;

  taxableAmount: string;

  taxRate: string;
  taxAmount: string;

  amount: string;

  createdAt: string;
  updatedAt: string;
}

export interface InvoiceDetails extends Invoice {
  items: InvoiceItem[];
}

export interface InvoiceListResponse {
  data: Invoice[];
  pagination: InvoicePagination;
}

export interface InvoiceResponse {
  data: InvoiceDetails;
}

export interface CreateInvoiceItemInput {
  description: string;
  quantity: string;
  unitPrice: string;
  discount?: string;
  taxRate?: string;
}

export interface CreateInvoiceInput {
  customerId: string;
  propertyId: string;
  jobId: string;

  issueDate?: string;
  dueDate?: string;

  taxApplied?: boolean;
  gstType?: GstType;

  discount?: string;

  items: CreateInvoiceItemInput[];

  notes?: string;
}

export interface UpdateInvoiceInput {
  issueDate?: string;
  dueDate?: string;

  taxApplied?: boolean;
  gstType?: GstType;

  discount?: string;

  notes?: string;
}

export interface UpdateInvoiceStatusInput {
  status: InvoiceStatus;
}

export interface AddInvoiceItemInput {
  description: string;
  quantity: string;
  unitPrice: string;
  discount?: string;
  taxRate?: string;
}

export interface UpdateInvoiceItemInput {
  description?: string;
  quantity?: string;
  unitPrice?: string;
  discount?: string;
  taxRate?: string;
}

export interface DeleteInvoiceResponse {
  message: string;
}

export interface InvoiceMessageResponse {
  message: string;
}