<script lang="ts">
  import ArchiveExtractor from './lib/ArchiveExtractor.svelte';
  import ArchiveCreator from './lib/ArchiveCreator.svelte';

  let activeTab = $state<'extract' | 'compress'>('extract');
</script>

<main>
  <h1>Web Archive Utility</h1>

  <div class="tabs">
    <button
      class:active={activeTab === 'extract'}
      onclick={() => (activeTab = 'extract')}
    >
      Extract
    </button>
    <button
      class:active={activeTab === 'compress'}
      onclick={() => (activeTab = 'compress')}
    >
      Compress
    </button>
  </div>

  <div class="tab-content">
    {#if activeTab === 'extract'}
      <ArchiveExtractor />
    {:else}
      <ArchiveCreator />
    {/if}
  </div>
</main>

<style>
  main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  h1 {
    text-align: center;
    margin-bottom: 2rem;
  }

  .tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
    border-bottom: 2px solid #ddd;
  }

  .tabs button {
    padding: 0.75rem 1.5rem;
    background: none;
    border: none;
    border-bottom: 3px solid transparent;
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.2s;
  }

  .tabs button:hover {
    background: #f5f5f5;
  }

  .tabs button.active {
    border-bottom-color: #0066cc;
    color: #0066cc;
    font-weight: 600;
  }

  .tab-content {
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    min-height: 400px;
  }
</style>
