declare module "pdf2pic" {
  interface ConvertOptions {
    density?: number;
    saveFilename?: string;
    savePath?: string;
    format?: string;
    width?: number;
    height?: number;
  }

  interface ConvertResult {
    path: string;
    name: string;
    size: number;
    page: number;
  }

  interface BulkResult {
    length: number;
    [key: number]: ConvertResult;
  }

  interface ConvertFunction {
    (pageNumber: number, options?: { responseType: string }): Promise<Buffer[]>;
    bulk(
      pageNumbers: number[],
      options?: { responseType: string }
    ): Promise<BulkResult>;
  }

  function fromPath(pdfPath: string, options?: ConvertOptions): ConvertFunction;

  export = { fromPath };
}
