<script lang="ts">
  type Props = {
    label: string;
    value: string;
  };

  let { label, value }: Props = $props();
</script>

<div class="metric">
  <span>{label}</span>
  <strong>{value}</strong>
</div>

<style>
  .metric {
    display: flex;
    min-height: 66px;
    flex-direction: column;
    justify-content: center;
    gap: 5px;
    padding: 12px;
    border-radius: 9px;
    background: rgba(255, 255, 255, 0.56);
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.06);
  }

  span {
    color: #6e6e73;
    font-size: 12px;
    font-weight: 600;
  }

  strong {
    color: #1d1d1f;
    font-size: 20px;
    line-height: 1.1;
    letter-spacing: 0;
  }
</style>
