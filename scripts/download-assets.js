import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ASSETS = [
  {
    filename: 'watch_vertices.dat',
    url: 'https://ciechanow.ski/models/watch_vertices.dat?v=3',
    expectedSize: 4549392
  },
  {
    filename: 'watch_indices.dat',
    url: 'https://ciechanow.ski/models/watch_indices.dat?v=3',
    expectedSize: 1513200
  }
];

const targetDir = path.join(__dirname, '../public/models');

// Ensure public/models directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

function downloadAsset(asset) {
  const destPath = path.join(targetDir, asset.filename);

  // Check if file already exists with correct size
  if (fs.existsSync(destPath)) {
    const stats = fs.statSync(destPath);
    if (stats.size === asset.expectedSize) {
      console.log(`[Asset Downloader] ${asset.filename} already exists and is valid. Skipping download.`);
      return Promise.resolve();
    } else {
      console.log(`[Asset Downloader] ${asset.filename} exists but size is incorrect (got ${stats.size}, expected ${asset.expectedSize}). Re-downloading...`);
    }
  }

  return new Promise((resolve, reject) => {
    console.log(`[Asset Downloader] Downloading ${asset.filename} from ${asset.url}...`);
    const file = fs.createWriteStream(destPath);
    
    https.get(asset.url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${asset.filename}: HTTP status ${response.statusCode}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        const stats = fs.statSync(destPath);
        if (stats.size !== asset.expectedSize) {
          reject(new Error(`Size mismatch for ${asset.filename}: got ${stats.size}, expected ${asset.expectedSize}`));
        } else {
          console.log(`[Asset Downloader] Successfully downloaded ${asset.filename} (${stats.size} bytes).`);
          resolve();
        }
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {}); // delete partial file on error
      reject(err);
    });
  });
}

async function run() {
  try {
    for (const asset of ASSETS) {
      await downloadAsset(asset);
    }
    console.log('[Asset Downloader] All watch animation assets are downloaded and verified successfully.');
    process.exit(0);
  } catch (error) {
    console.error('[Asset Downloader] Critical error during asset download:', error);
    process.exit(1);
  }
}

run();
