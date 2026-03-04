<script lang="ts">
  import { Archive } from 'libarchive.js';
  import { Zip, ZipPassThrough } from 'fflate';
  import FileList from './FileList.svelte';
  import type { FileEntry } from './types';

  Archive.init({ workerUrl: '/worker-bundle.js' });

  let archive = $state<any>(null);
  let uploadedFile = $state<File | null>(null);
  let files = $state<FileEntry[]>([]);
  let loading = $state(false);
  let error = $state('');
  let needsPassword = $state(false);
  let password = $state('');

  async function handleFileUpload(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    loading = true;
    error = '';
    files = [];
    needsPassword = false;
    password = '';
    uploadedFile = file;

    try {
      archive = await Archive.open(file);

      if (await archive.hasEncryptedData()) {
        needsPassword = true;
        loading = false;
        return;
      }

      await loadFiles();
    } catch (e: any) {
      error = e.message || 'Failed to open archive';
      loading = false;
    }
  }

  async function handlePasswordSubmit() {
    if (!archive || !password) return;

    loading = true;
    error = '';

    try {
      await archive.usePassword(password);
      await loadFiles();
      needsPassword = false;
    } catch (e: any) {
      error = e.message || 'Invalid password';
      loading = false;
    }
  }

  async function loadFiles() {
    try {
      const fileArray = await archive.getFilesArray();
      files = fileArray.map((f: any) => ({
        path: f.path + f.file.name,
        size: f.file.size,
        file: f.file,
      }));
      loading = false;
    } catch (e: any) {
      error = e.message || 'Failed to list files';
      loading = false;
    }
  }

  async function downloadFile(fileEntry: FileEntry) {
    loading = true;
    error = '';

    try {
      const extracted = await fileEntry.file.extract();
      const url = URL.createObjectURL(extracted);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileEntry.path.split('/').pop() || 'file';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      error = e.message || 'Failed to download file';
    } finally {
      loading = false;
    }
  }

  function findFileInTree(tree: any, path: string): File | null {
    const parts = path.split('/');
    let current = tree;
    for (const part of parts) {
      if (!current || typeof current !== 'object') return null;
      current = current[part];
    }
    return current instanceof File ? current : null;
  }

  async function downloadSelectedFiles(selectedFiles: FileEntry[]) {
    if (!uploadedFile) return;
    loading = true;
    error = '';

    try {
      const freshArchive = await Archive.open(uploadedFile);
      if (password) await freshArchive.usePassword(password);
      const extractedContent = await freshArchive.extractFiles();

      const chunks: ArrayBuffer[] = [];

      const blob: Blob = await new Promise((resolve, reject) => {
        const zip = new Zip((err, chunk, final) => {
          if (err) { reject(err); return; }
          chunks.push(chunk.buffer as ArrayBuffer);
          if (final) {
            resolve(new Blob(chunks, { type: 'application/zip' }));
          }
        });

        (async () => {
          for (const fileEntry of selectedFiles) {
            const file = findFileInTree(extractedContent, fileEntry.path);
            if (!file) continue;
            const buffer = await file.arrayBuffer();
            const entry = new ZipPassThrough(fileEntry.path);
            zip.add(entry);
            entry.push(new Uint8Array(buffer), true);
          }
          zip.end();
        })().catch(reject);
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'selected-files.zip';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error('Download selected files error:', e);
      error = e?.message || String(e) || 'Failed to download selected files';
    } finally {
      loading = false;
    }
  }
</script>

<div class="extractor">
  <h2>Extract Archive</h2>

  <div class="upload-section">
    <input
      type="file"
      accept=".zip,.rar,.7z,.tar,.tar.gz,.tar.bz2,.tar.xz,.tgz"
      onchange={handleFileUpload}
    />
  </div>

  {#if needsPassword}
    <div class="password-section">
      <p>This archive is password-protected</p>
      <div class="password-input">
        <input
          type="password"
          bind:value={password}
          placeholder="Enter password"
        />
        <button onclick={handlePasswordSubmit} disabled={!password}>
          Submit
        </button>
      </div>
    </div>
  {/if}

  {#if loading}
    <p class="loading">Processing...</p>
  {/if}

  {#if error}
    <p class="error">{error}</p>
  {/if}

  {#if files.length > 0}
    <FileList
      {files}
      onDownload={downloadFile}
      onDownloadSelected={downloadSelectedFiles}
    />
  {/if}
</div>

<style>
  .extractor {
    padding: 1rem;
  }

  h2 {
    margin-top: 0;
  }

  .upload-section {
    margin: 1rem 0;
  }

  .password-section {
    margin: 1rem 0;
    padding: 1rem;
    background: #f5f5f5;
    border-radius: 4px;
  }

  .password-input {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .password-input input {
    flex: 1;
    padding: 0.5rem;
  }

  .loading {
    color: #0066cc;
    font-style: italic;
  }

  .error {
    color: #cc0000;
    padding: 0.5rem;
    background: #ffe6e6;
    border-radius: 4px;
  }
</style>
