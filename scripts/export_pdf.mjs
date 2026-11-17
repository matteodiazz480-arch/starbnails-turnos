import http from 'http';
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

const PORT = 3333;
const PUBLIC_DIR = path.resolve('public');

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
};

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];
  const filePath = path.join(PUBLIC_DIR, urlPath === '/' ? 'presentation.html' : urlPath);
  
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, async () => {
  console.log(`Server listening at http://localhost:${PORT}`);
  try {
    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    const page = await browser.newPage({
      viewport: { width: 1400, height: 900 }
    });

    console.log('Navigating to presentation...');
    await page.goto(`http://localhost:${PORT}/presentation.html`, { waitUntil: 'networkidle' });
    await page.evaluateHandle('document.fonts.ready');
    await page.waitForTimeout(1000);

    const pdfPath = path.join(PUBLIC_DIR, 'StarbNails_Propuesta_Turnos.pdf');
    console.log(`Generating PDF to ${pdfPath}...`);
    
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
      preferCSSPageSize: true
    });

    console.log('PDF generated successfully!');
    await browser.close();
  } catch (err) {
    console.error('Error generating PDF:', err);
  } finally {
    server.close();
    process.exit(0);
  }
});
