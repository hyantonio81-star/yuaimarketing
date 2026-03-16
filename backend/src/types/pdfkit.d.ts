declare module "pdfkit" {
  import type { Readable } from "stream";
  interface PDFDocument extends Readable {}
  interface PDFDocumentOptions {
    margin?: number;
    size?: string;
  }
  class PDFDocument {
    constructor(options?: PDFDocumentOptions);
    fontSize(size: number): this;
    text(text: string, options?: { align?: string; indent?: number; continued?: boolean }): this;
    moveDown(n?: number): this;
    end(): void;
    on(event: "data", cb: (chunk: Buffer) => void): this;
    on(event: "end", cb: () => void): this;
    on(event: "error", cb: (err: Error) => void): this;
  }
  export default PDFDocument;
}
