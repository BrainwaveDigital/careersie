import { Document, Packer, Paragraph, TextRun } from "docx";

export async function generateDocx(data: any) {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [new TextRun(data.name)],
        })
      ]
    }]
  });

  return await Packer.toBuffer(doc);
}
