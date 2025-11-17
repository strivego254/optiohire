import PDFDocument from 'pdfkit'

export async function createCompanyReportPdf(companyName: string, jobStats: Array<{ job_posting_id: string; job_title: string; total_applicants: string; shortlisted: string; flagged: string; rejected: string }>): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 36 })
  const chunks: Buffer[] = []
  return new Promise((resolve, reject) => {
    doc.on('data', (c: Buffer) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    doc.fontSize(20).text(`Hiring Report - ${companyName}`, { underline: true })
    doc.moveDown()

    jobStats.forEach((row) => {
      doc
        .fontSize(12)
        .text(`Job: ${row.job_title}`)
        .text(`Total Applicants: ${row.total_applicants} | Shortlisted: ${row.shortlisted} | Flagged: ${row.flagged} | Rejected: ${row.rejected}`)
        .moveDown()
    })

    doc.end()
  })
}


