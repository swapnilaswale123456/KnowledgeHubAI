import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function generateFavicon() {
  const svgBuffer = fs.readFileSync(join(__dirname, '../app/assets/img/favicon.svg'));
  
  await sharp(svgBuffer)
    .resize(1000, 1000)
    .png()
    .toFile(join(__dirname, '../public/favicon.png'));

  console.log('Favicon PNG generated successfully!');
}

generateFavicon().catch(console.error); 