#!/usr/bin/env node

/**
 * 图片上传工具 - 自动压缩后上传到自有CDN
 *
 * 解决痛点：直接上传大图片会报 413 Request Entity Too Large
 * 功能：自动压缩到适合手机浏览的大小，然后上传到 letmetry.cloud
 *
 * 用法：
 *   node tools/upload-image-to-cdn.js <图片路径> [选项]
 *
 * 选项：
 *   --width <像素>    目标宽度（默认：建筑800px，文物600px）
 *   --output <路径>   保存压缩后的本地文件路径
 *   --verbose         显示详细信息
 *
 * 示例：
 *   node tools/upload-image-to-cdn.js /path/to/museum-building.jpg
 *   node tools/upload-image-to-cdn.js /path/to/treasure.jpg --width 600
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CDN_UPLOAD_URL = 'https://letmetry.cloud/image/upload';

function log(msg) {
  console.log(msg);
}

function error(msg) {
  console.error(`❌ ${msg}`);
}

/**
 * 检查系统是否有图片压缩工具
 */
function findImageCompressor() {
  // macOS sips
  try {
    execSync('which sips', { stdio: 'ignore' });
    return 'sips';
  } catch {}

  // ImageMagick
  try {
    execSync('which convert', { stdio: 'ignore' });
    return 'imagemagick';
  } catch {}

  try {
    execSync('which magick', { stdio: 'ignore' });
    return 'imagemagick7';
  } catch {}

  return null;
}

/**
 * 压缩图片
 */
function compressImage(inputPath, outputPath, targetWidth) {
  const compressor = findImageCompressor();

  if (!compressor) {
    throw new Error('未找到图片压缩工具。请安装 ImageMagick 或确保在 macOS 上运行（自带 sips）');
  }

  if (compressor === 'sips') {
    execSync(`sips -Z ${targetWidth} "${inputPath}" --out "${outputPath}"`, { stdio: 'ignore' });
  } else if (compressor === 'imagemagick') {
    execSync(`convert "${inputPath}" -resize ${targetWidth}x> "${outputPath}"`, { stdio: 'ignore' });
  } else if (compressor === 'imagemagick7') {
    execSync(`magick "${inputPath}" -resize ${targetWidth}x> "${outputPath}"`, { stdio: 'ignore' });
  }

  const originalSize = fs.statSync(inputPath).size;
  const compressedSize = fs.statSync(outputPath).size;
  const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1);

  return { originalSize, compressedSize, ratio };
}

/**
 * 使用 curl 上传图片到CDN
 */
async function uploadToCDN(filePath) {
  return new Promise((resolve, reject) => {
    const { exec } = require('child_process');
    const cmd = `curl -s -X POST "${CDN_UPLOAD_URL}" -F "file=@${filePath}"`;

    exec(cmd, { timeout: 30000 }, (err, stdout, stderr) => {
      if (err) {
        reject(new Error(`上传失败: ${err.message}`));
        return;
      }

      try {
        const result = JSON.parse(stdout);
        if (result.success) {
          resolve(result);
        } else {
          reject(new Error(`上传失败: ${JSON.stringify(result)}`));
        }
      } catch (e) {
        reject(new Error(`解析响应失败: ${stdout}`));
      }
    });
  });
}

/**
 * 验证URL可访问
 */
async function validateUrl(url) {
  return new Promise((resolve) => {
    const { exec } = require('child_process');
    exec(`curl -sI "${url}" | head -1`, { timeout: 10000 }, (err, stdout) => {
      if (err) {
        resolve(false);
        return;
      }
      resolve(stdout.includes('200'));
    });
  });
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
图片上传工具 - 自动压缩后上传到自有CDN

用法：
  node tools/upload-image-to-cdn.js <图片路径> [选项]

选项：
  --width <像素>    目标宽度（默认：800）
  --output <路径>   保存压缩后的本地文件路径
  --type <类型>     图片类型：building(800px) | treasure(600px) | custom

示例：
  node tools/upload-image-to-cdn.js ~/Downloads/museum.jpg
  node tools/upload-image-to-cdn.js ~/Downloads/treasure.jpg --type treasure
  node tools/upload-image-to-cdn.js ~/Downloads/photo.jpg --width 1200 --output ./compressed.jpg
    `);
    process.exit(0);
  }

  const inputPath = path.resolve(args[0]);

  if (!fs.existsSync(inputPath)) {
    error(`文件不存在: ${inputPath}`);
    process.exit(1);
  }

  // 解析选项
  let targetWidth = 800;
  let outputPath = null;

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--width' && args[i + 1]) {
      targetWidth = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--output' && args[i + 1]) {
      outputPath = path.resolve(args[i + 1]);
      i++;
    } else if (args[i] === '--type' && args[i + 1]) {
      const type = args[i + 1];
      if (type === 'building') targetWidth = 800;
      else if (type === 'treasure') targetWidth = 600;
      i++;
    }
  }

  // 默认输出到临时目录
  if (!outputPath) {
    const tmpDir = path.join(require('os').tmpdir(), 'museum-images');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    outputPath = path.join(tmpDir, path.basename(inputPath));
  }

  log(`📁 原图: ${inputPath}`);
  log(`📐 目标宽度: ${targetWidth}px`);
  log(`💾 压缩后保存至: ${outputPath}`);
  log('');

  // 步骤1：压缩
  log('🔧 正在压缩图片...');
  try {
    const stats = compressImage(inputPath, outputPath, targetWidth);
    log(`   ✅ 压缩完成: ${(stats.originalSize / 1024).toFixed(1)}KB → ${(stats.compressedSize / 1024).toFixed(1)}KB (节省 ${stats.ratio}%)`);
  } catch (e) {
    error(`压缩失败: ${e.message}`);
    process.exit(1);
  }
  log('');

  // 步骤2：上传
  log('☁️  正在上传至CDN...');
  let result;
  try {
    result = await uploadToCDN(outputPath);
    log(`   ✅ 上传成功`);
    log(`   📄 文件名: ${result.filename}`);
    log(`   📦 大小: ${(result.size / 1024).toFixed(1)}KB`);
  } catch (e) {
    error(`上传失败: ${e.message}`);
    process.exit(1);
  }
  log('');

  // 步骤3：验证
  const cdnUrl = `https://letmetry.cloud/${result.path}`;
  log('🔗 验证URL可访问性...');
  const isValid = await validateUrl(cdnUrl);
  if (isValid) {
    log(`   ✅ URL可访问`);
  } else {
    log(`   ⚠️ URL可能暂时不可访问，但上传已成功`);
  }
  log('');

  // 输出结果
  log('══════════════════════════════════════════════════');
  log('🎉 图片处理完成！');
  log('══════════════════════════════════════════════════');
  log(`CDN URL: ${cdnUrl}`);
  log('');
  log('💡 在博物馆数据模板中使用以上URL即可');
  log('');
}

main().catch(err => {
  error(err.message);
  process.exit(1);
});
