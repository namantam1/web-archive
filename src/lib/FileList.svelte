<script lang="ts">
  import type { FileEntry } from './types';

  interface Props {
    files: FileEntry[];
    onDownload: (file: FileEntry) => void;
    onDownloadSelected: (files: FileEntry[]) => void;
  }

  let { files, onDownload, onDownloadSelected }: Props = $props();
  let selectedFiles = $state<Set<string>>(new Set());

  function toggleFile(path: string) {
    if (selectedFiles.has(path)) {
      selectedFiles.delete(path);
    } else {
      selectedFiles.add(path);
    }
    selectedFiles = new Set(selectedFiles);
  }

  function selectAll() {
    selectedFiles = new Set(files.map((f) => f.path));
  }

  function selectNone() {
    selectedFiles = new Set();
  }

  function downloadSelected() {
    const selected = files.filter((f) => selectedFiles.has(f.path));
    onDownloadSelected(selected);
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }
</script>

<div class="file-list">
  {#if files.length > 0}
    <div class="controls">
      <button onclick={selectAll}>Select All</button>
      <button onclick={selectNone}>Select None</button>
      {#if selectedFiles.size > 0}
        <button onclick={downloadSelected}>
          Download Selected ({selectedFiles.size})
        </button>
      {/if}
    </div>

    <div class="files">
      {#each files as file}
        <div class="file-item">
          <input
            type="checkbox"
            checked={selectedFiles.has(file.path)}
            onchange={() => toggleFile(file.path)}
          />
          <span class="file-path">{file.path}</span>
          <span class="file-size">{formatSize(file.size)}</span>
          <button onclick={() => onDownload(file)}>Download</button>
        </div>
      {/each}
    </div>
  {:else}
    <p class="empty">No files to display</p>
  {/if}
</div>

<style>
  .file-list {
    margin-top: 1rem;
  }

  .controls {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .files {
    border: 1px solid #ccc;
    border-radius: 4px;
    max-height: 400px;
    overflow-y: auto;
  }

  .file-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem;
    border-bottom: 1px solid #eee;
  }

  .file-item:last-child {
    border-bottom: none;
  }

  .file-path {
    flex: 1;
    font-family: monospace;
    font-size: 0.9rem;
  }

  .file-size {
    color: #666;
    font-size: 0.85rem;
    min-width: 80px;
    text-align: right;
  }

  .empty {
    text-align: center;
    color: #999;
    padding: 2rem;
  }

  button {
    padding: 0.25rem 0.75rem;
    font-size: 0.85rem;
  }
</style>
