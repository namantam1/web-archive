<script lang="ts">
  import { Archive, ArchiveCompression, ArchiveFormat } from 'libarchive.js';

  Archive.init({ workerUrl: 'worker-bundle.js' });

  let fileInput = $state<HTMLInputElement>();
  let selectedFiles = $state<File[]>([]);
  let format = $state<string>('zip');
  let loading = $state(false);
  let error = $state('');

  const formats: { value: string; label: string; compression?: ArchiveCompression; format?: ArchiveFormat }[] = [
    { value: 'zip', label: 'ZIP', format: ArchiveFormat.ZIP },
    { value: 'tar', label: 'TAR', format: ArchiveFormat.USTAR },
    { value: 'tar.gz', label: 'TAR.GZ (gzip)', compression: ArchiveCompression.GZIP, format: ArchiveFormat.USTAR },
    { value: 'tar.bz2', label: 'TAR.BZ2 (bzip2)', compression: ArchiveCompression.BZIP2, format: ArchiveFormat.USTAR },
    { value: 'tar.xz', label: 'TAR.XZ (xz)', compression: ArchiveCompression.XZ, format: ArchiveFormat.USTAR },
    { value: '7zip', label: '7-Zip', format: ArchiveFormat.SEVEN_ZIP },
  ];

  function handleFileSelection(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files) {
      selectedFiles = Array.from(target.files);
      error = '';
    }
  }

  async function compressFiles() {
    if (selectedFiles.length === 0) {
      error = 'Please select files to compress';
      return;
    }

    loading = true;
    error = '';

    try {
      const archiveName = `archive.${format}`;
      const formatConfig = formats.find((f) => f.value === format);

      const files = selectedFiles.map((file) => ({
        file,
        pathname: file.name,
      }));

      const archiveFile = await Archive.write({
        files: files as any,
        outputFileName: archiveName,
        compression: formatConfig?.compression || ArchiveCompression.NONE,
        format: formatConfig?.format || ArchiveFormat.ZIP,
        passphrase: null,
      });

      const url = URL.createObjectURL(archiveFile);
      const a = document.createElement('a');
      a.href = url;
      a.download = archiveName;
      a.click();
      URL.revokeObjectURL(url);

      selectedFiles = [];
      if (fileInput) fileInput.value = '';
    } catch (e: any) {
      error = e.message || 'Failed to create archive';
    } finally {
      loading = false;
    }
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  function getTotalSize(): string {
    const total = selectedFiles.reduce((sum, file) => sum + file.size, 0);
    return formatSize(total);
  }
</script>

<div class="creator">
  <h2>Create Archive</h2>

  <div class="upload-section">
    <input
      bind:this={fileInput}
      type="file"
      multiple
      onchange={handleFileSelection}
    />
  </div>

  {#if selectedFiles.length > 0}
    <div class="file-info">
      <p><strong>Selected files:</strong> {selectedFiles.length}</p>
      <p><strong>Total size:</strong> {getTotalSize()}</p>

      <div class="files-list">
        {#each selectedFiles as file}
          <div class="file-item">
            <span class="file-name">{file.name}</span>
            <span class="file-size">{formatSize(file.size)}</span>
          </div>
        {/each}
      </div>
    </div>

    <div class="format-section">
      <label>
        Archive Format:
        <select bind:value={format}>
          {#each formats as fmt}
            <option value={fmt.value}>{fmt.label}</option>
          {/each}
        </select>
      </label>
    </div>

    <button
      class="compress-btn"
      onclick={compressFiles}
      disabled={loading || selectedFiles.length === 0}
    >
      {loading ? 'Compressing...' : 'Create Archive'}
    </button>
  {/if}

  {#if loading}
    <p class="loading">Creating archive...</p>
  {/if}

  {#if error}
    <p class="error">{error}</p>
  {/if}
</div>

<style>
  .creator {
    padding: 1rem;
  }

  h2 {
    margin-top: 0;
  }

  .upload-section {
    margin: 1rem 0;
  }

  .file-info {
    margin: 1rem 0;
    padding: 1rem;
    background: #f5f5f5;
    border-radius: 4px;
  }

  .files-list {
    max-height: 200px;
    overflow-y: auto;
    margin-top: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: white;
  }

  .file-item {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem;
    border-bottom: 1px solid #eee;
  }

  .file-item:last-child {
    border-bottom: none;
  }

  .file-name {
    font-family: monospace;
    font-size: 0.9rem;
  }

  .file-size {
    color: #666;
    font-size: 0.85rem;
  }

  .format-section {
    margin: 1rem 0;
  }

  .format-section label {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .format-section select {
    padding: 0.5rem;
    font-size: 1rem;
  }

  .compress-btn {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    background: #0066cc;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .compress-btn:hover:not(:disabled) {
    background: #0052a3;
  }

  .compress-btn:disabled {
    background: #ccc;
    cursor: not-allowed;
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
