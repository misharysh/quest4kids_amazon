import { Injectable } from "@nestjs/common";
import { Response } from "express";
import * as PDFDocument from 'pdfkit';

@Injectable()
export class PdfService {
    public generatePdf(response: Response, data: {title: string, content: string}) 
    {
        const document = new PDFDocument({margin: 50});

        response.setHeader('Content-Type', 'application/pdf');
        response.setHeader('Content-Disposition', 'inline; filename=tasks.pdf');

        document.pipe(response);
        document.fontSize(22).text(data.title, {align: 'center'}).moveDown();
        document.fontSize(12).text(data.content, {
            align: 'left',
            lineGap: 6,
          });
      
        document.end();
    };
}