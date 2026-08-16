import PDFDocument from "pdfkit";

class PDFService {
    async generatePdf(report, writeStream) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                doc.pipe(writeStream);

                // Title
                doc.fontSize(24).font('Helvetica-Bold').text("E-Rakshak Investigation Report", { align: 'center' });
                doc.moveDown(1);

                // Case Information Box
                doc.fontSize(16).font('Helvetica-Bold').text("Case Information");
                doc.fontSize(10).font('Helvetica');
                doc.text(`Report ID: ${report.reportId}`);
                doc.text(`Generated At: ${report.generatedAt}`);
                doc.text(`Case ID: ${report.case.id}`);
                doc.text(`Title: ${report.case.title}`);
                doc.text(`Officer: ${report.case.officer}`);
                doc.text(`Priority: ${report.case.priority}`);
                doc.text(`Status: ${report.case.status}`);
                doc.text(`Description: ${report.case.description || 'N/A'}`);
                doc.moveDown(1);

                // Statistics
                doc.fontSize(16).font('Helvetica-Bold').text("Case Statistics");
                doc.fontSize(10).font('Helvetica');
                doc.text(`Total Evidence Bookmarks: ${report.summary.totalEvidence}`);
                doc.text(`Total Timeline Events: ${report.summary.totalTimelineEvents}`);
                doc.text(`Total Cameras Visited: ${report.summary.totalCameras}`);
                doc.text(`Total Track Identifiers: ${report.summary.totalTracks}`);
                doc.text(`Total Audit Actions: ${report.summary.totalAuditLogs}`);
                doc.moveDown(1);

                // Timeline Events
                doc.fontSize(16).font('Helvetica-Bold').text("Timeline Records");
                doc.moveDown(0.5);
                if (report.timeline && report.timeline.length > 0) {
                    report.timeline.forEach((event, index) => {
                        doc.fontSize(10).font('Helvetica-Bold').text(`[${index + 1}] Event Time: ${event.timestamp} | Camera: ${event.cameraId}`);
                        doc.fontSize(10).font('Helvetica').text(`Description: ${event.description}`);
                        doc.moveDown(0.5);
                    });
                } else {
                    doc.fontSize(10).text("No timeline records available.");
                    doc.moveDown(1);
                }

                // Evidence Section
                doc.fontSize(16).font('Helvetica-Bold').text("Bookmarked Evidence");
                doc.moveDown(0.5);
                if (report.evidence && report.evidence.length > 0) {
                    report.evidence.forEach((ev, index) => {
                        doc.fontSize(10).font('Helvetica-Bold').text(`[${index + 1}] ID: ${ev.id} | Class: ${ev.className || ev.class || 'Unknown'}`);
                        doc.fontSize(10).font('Helvetica').text(`Track ID: ${ev.trackId} | Camera: ${ev.cameraId} | Similarity: ${(ev.similarity * 100).toFixed(1)}%`);
                        doc.fontSize(10).font('Helvetica').text(`Description: ${ev.description || 'N/A'}`);
                        doc.moveDown(0.5);
                    });
                } else {
                    doc.fontSize(10).text("No bookmarked evidence available.");
                    doc.moveDown(1);
                }

                // Audit Trails
                doc.fontSize(16).font('Helvetica-Bold').text("Audit Trail");
                doc.moveDown(0.5);
                if (report.auditLogs && report.auditLogs.length > 0) {
                    report.auditLogs.forEach((log, index) => {
                        doc.fontSize(10).font('Helvetica-Bold').text(`[${index + 1}] Action: ${log.action} | Time: ${log.timestamp}`);
                        doc.fontSize(10).font('Helvetica').text(`Officer: ${log.officer} | Details: ${JSON.stringify(log.details)}`);
                        doc.moveDown(0.5);
                    });
                } else {
                    doc.fontSize(10).text("No audit records available.");
                }

                doc.end();
                resolve();
            } catch (err) {
                reject(err);
            }
        });
    }
}

export default new PDFService();
