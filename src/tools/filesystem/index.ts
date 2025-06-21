export { readFile } from './readFile.js';
export { writeFile } from './writeFile.js';
export { listFiles } from './listFiles.js';
export { createDirectory } from './createDirectory.js';
export { deleteFile } from './deleteFile.js';
export { moveFile } from './moveFile.js';

// ツールのコレクション
import { readFile } from './readFile.js';
import { writeFile } from './writeFile.js';
import { listFiles } from './listFiles.js';
import { createDirectory } from './createDirectory.js';
import { deleteFile } from './deleteFile.js';
import { moveFile } from './moveFile.js';

export const filesystemTools = {
  readFile,
  writeFile,
  listFiles,
  createDirectory,
  deleteFile,
  moveFile,
} as const;