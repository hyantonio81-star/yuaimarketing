/**
 * generate_commercial_invoice(order)
 * Template fill → 다국어(en, de, zh, es) DOCX/PDF 생성
 */

export interface OrderItem {
  name: string;
  hs_code: string;
  qty: number;
  price: number;
}

export interface OrderInput {
  id?: string;
  buyer: {
    company_name: string;
    full_address: string;
    contact_person?: string;
  };
  items: OrderItem[];
  payment_terms?: string;
  incoterms?: string;
  total_amount?: number;
}

export interface InvoiceItem {
  description: string;
  hs_code: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface CommercialInvoiceResult {
  data: {
    invoice_no: string;
    date: string;
    buyer: { name: string; address: string; contact: string };
    seller: { name: string; address: string; contact: string };
    items: InvoiceItem[];
    subtotal: number;
    shipping: number;
    insurance: number;
    total: number;
    payment_terms: string;
    incoterms: string;
  };
  documents: Record<
    string,
    { docx: string; pdf: string; filename: string }
  >;
}

function loadCompanyInfo(): { name: string; address: string; contact: string } {
  return {
    name: "[Your Company Name]",
    address: "Seoul, South Korea",
    contact: "export@company.com",
  };
}

function calculateShipping(_order: OrderInput): number {
  return 850;
}

function calculateInsurance(order: OrderInput): number {
  const subtotal = order.items.reduce((s, i) => s + i.qty * i.price, 0);
  return Math.round(subtotal * 0.002 * 100) / 100;
}

/**
 * generate_commercial_invoice
 * Returns filled data + per-language document placeholders (docx/pdf as placeholder; real impl would use docxtpl + pdf conversion).
 */
export function generateCommercialInvoice(order: OrderInput): CommercialInvoiceResult {
  const id = order.id ?? "001";
  const now = new Date();
  const invoiceNo = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${id}`;
  const dateStr = now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const items: InvoiceItem[] = (order.items || []).map((item) => ({
    description: item.name,
    hs_code: item.hs_code || "",
    quantity: item.qty,
    unit_price: item.price,
    total: item.qty * item.price,
  }));

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const shipping = calculateShipping(order);
  const insurance = calculateInsurance(order);
  const total = Number(order.total_amount) || Math.round((subtotal + shipping + insurance) * 100) / 100;

  const data = {
    invoice_no: invoiceNo,
    date: dateStr,
    buyer: {
      name: order.buyer?.company_name ?? "",
      address: order.buyer?.full_address ?? "",
      contact: order.buyer?.contact_person ?? "",
    },
    seller: loadCompanyInfo(),
    items,
    subtotal,
    shipping,
    insurance,
    total,
    payment_terms: order.payment_terms ?? "T/T 30 days",
    incoterms: order.incoterms ?? "CIF",
  };

  const languages = ["en", "de", "zh", "es"];
  const documents: Record<string, { docx: string; pdf: string; filename: string }> = {};

  for (const lang of languages) {
    const filename = `${data.invoice_no}_${lang.toUpperCase()}.pdf`;
    documents[lang] = {
      docx: `[Generated DOCX - ${lang}]`,
      pdf: `data:application/pdf;base64,placeholder`,
      filename,
    };
  }

  return { data, documents };
}
