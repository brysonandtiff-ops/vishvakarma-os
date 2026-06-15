#!/usr/bin/env node

import { createGzip } from 'node:zlib';
import { createReadStream } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { pipeline } from 'node:stream/promises';

function chunkKeyFromFilename(filename) {
  const match = filename.match(/^(vendor-[a-z0-9-]+|index)-/i);
  if (match) return match[1];
  if (filename.startsWith('index-')) return 'index';
  return filename.replace(/-[A-Za-z0-9_-]+\.(js|css)$/i, '');
}

async function gzipSize(filePath) {
  const gzip = createGzip({ level: 9 });
  let size = 0;
  gzip.on('data', (chunk) => {
    size += chunk.length;
  });
  await pipeline(createReadStream(filePath), gzip);
  return size;
}

export async function parseDistAssets(distDir, options = {}) {
  const assetsDir = join(distDir, 'assets');
  const includeGzip = options.includeGzip ?? false;
  const files = [];

  try {
    const entries = await readdir(assetsDir);
    for (const entry of entries) {
      if (!/\.(js|css)$/i.test(entry)) continue;
      const filePath = join(assetsDir, entry);
      const fileStat = await stat(filePath);
      const chunkKey = chunkKeyFromFilename(entry);
      const record = {
        file: entry,
        chunkKey,
        bytes: fileStat.size,
      };
      if (includeGzip) {
        record.gzipBytes = await gzipSize(filePath);
      }
      files.push(record);
    }
  } catch {
    return {
      distDir,
      totalBytes: 0,
      files: [],
      chunks: {},
    };
  }

  let totalBytes = 0;
  const chunks = {};

  for (const file of files) {
    totalBytes += file.bytes;
    const current = chunks[file.chunkKey] ?? { bytes: 0, files: [] };
    current.bytes += file.bytes;
    current.files.push(file.file);
    if (file.gzipBytes) {
      current.gzipBytes = (current.gzipBytes ?? 0) + file.gzipBytes;
    }
    chunks[file.chunkKey] = current;
  }

  return {
    distDir,
    totalBytes,
    totalMb: Number((totalBytes / (1024 * 1024)).toFixed(2)),
    files,
    chunks,
  };
}

export function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} kB`;
  return `${bytes} B`;
}
