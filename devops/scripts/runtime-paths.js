import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

function normalizeDirectory(directoryPath) {
    return path.resolve(directoryPath);
}

export function resolveProjectRoot(fromUrl) {
    if (typeof process.env.PROJECT_DIR === 'string' && process.env.PROJECT_DIR.trim()) {
        return normalizeDirectory(process.env.PROJECT_DIR.trim());
    }
    if (typeof fromUrl === 'string' && fromUrl.startsWith('file:')) {
        return path.resolve(path.dirname(fileURLToPath(fromUrl)), '../..');
    }
    throw new Error('resolveProjectRoot requires import.meta.url when PROJECT_DIR is not set');
}

export function resolveRuntimeDir(fromUrl) {
    return path.join(resolveProjectRoot(fromUrl), 'devops', '.local');
}

export function ensureDirectory(directoryPath) {
    fs.mkdirSync(directoryPath, { recursive: true });
    return directoryPath;
}

export function ensureParentDirectory(filePath) {
    return ensureDirectory(path.dirname(filePath));
}

export function resolveRuntimePath(fromUrl, ...segments) {
    return path.join(resolveRuntimeDir(fromUrl), ...segments);
}

export function resolveKuaishouAuthFile(fromUrl) {
    if (typeof process.env.KUAISHOU_AUTH_FILE === 'string' && process.env.KUAISHOU_AUTH_FILE.trim()) {
        return path.resolve(process.env.KUAISHOU_AUTH_FILE.trim());
    }
    return resolveRuntimePath(fromUrl, 'auth', 'kuaishou_auth.json');
}
