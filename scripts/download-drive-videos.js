/**
 * Download videos from Google Drive and upload to Supabase Storage
 * Run: node scripts/download-drive-videos.js
 */

import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Google Drive file IDs from your links
const driveFiles = [
  { id: '1AON4YybKQGq1eEHBygC3lSk0wPn3E3_w', name: 'preview-1.mp4' },
  { id: '1nJOHLUU84IGSd4REkT_fJiZ4OYMyvieo', name: 'preview-2.mp4' },
  { id: '1qVcFoX8cOLcYCcYCaiK-zxu5FIbimWBi', name: 'preview-3.mp4' },
  { id: '1ha_IZMVtW_xFTMyTPluXsmdabPc7w4Fj', name: 'preview-4.mp4' },
  { id: '1sjtL87kAAKcqj0asJnaecch8vW8UEMNX', name: 'preview-5.mp4' }
];

async function downloadFromDrive(fileId, filename) {
  console.log(`⬇️  Downloading: ${filename}...`);
  
  const url = `https://drive.google.com/uc?export=download&id=${fileId}`;
  
  try {
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'stream',
      timeout: 60000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const tempPath = path.join(__dirname, '..', 'temp', filename);
    const dir = path.dirname(tempPath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(tempPath);
      response.data.pipe(writer);

      writer.on('finish', () => {
        console.log(`✅ Downloaded: ${filename}`);
        resolve(tempPath);
      });

      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`❌ Failed to download ${filename}:`, error.message);
    throw error;
  }
}

async function uploadToSupabase(filePath, bucketName, fileName) {
  console.log(`⬆️  Uploading to Supabase: ${fileName}...`);

  const fileBuffer = fs.readFileSync(filePath);
  
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, fileBuffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'video/mp4'
      });

    if (error) throw error;

    console.log(`✅ Uploaded: ${fileName}`);
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error(`❌ Failed to upload ${fileName}:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting video migration...\n');

  const uploadedUrls = [];

  for (const file of driveFiles) {
    try {
      // Download
      const tempPath = await downloadFromDrive(file.id, file.name);

      // Upload to Supabase
      const publicUrl = await uploadToSupabase(
        tempPath,
        'ai-video-previews',
        file.name
      );

      uploadedUrls.push(publicUrl);

      // Cleanup temp file
      fs.unlinkSync(tempPath);

      console.log(`📍 Public URL: ${publicUrl}\n`);
    } catch (error) {
      console.error(`⚠️  Skipping ${file.name}: ${error.message}\n`);
    }
  }

  // Save URLs to config
  const config = {
    videoPreviews: uploadedUrls,
    uploadedAt: new Date().toISOString()
  };

  fs.writeFileSync(
    path.join(__dirname, '..', 'video-config.json'),
    JSON.stringify(config, null, 2)
  );

  console.log('\n✅ Migration complete!');
  console.log('📄 URLs saved to: video-config.json');
  console.log('\nVideo URLs:');
  uploadedUrls.forEach((url, i) => console.log(`${i + 1}. ${url}`));
}

main().catch(console.error);
