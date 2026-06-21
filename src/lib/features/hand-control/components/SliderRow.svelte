<script lang="ts">
	type Props = {
		label: string;
		value: number;
		min?: number;
		max?: number;
		step?: number;
		displayValue: string;
	};

	let {
		label,
		value = $bindable(0.5),
		min = 0.12,
		max = 1,
		step = 0.01,
		displayValue,
	}: Props = $props();
</script>

<label class="slider-row">
	<span>
		<strong>{label}</strong>
		<small>{displayValue}</small>
	</span>
	<input type="range" bind:value {min} {max} {step} />
</label>

<style>
	.slider-row {
		display: flex;
		flex-direction: column;
    gap: 4px;
    padding: 5px 0 3px;
	}

	span {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	strong {
		color: #1d1d1f;
    font-size: 10px;
	}

	small {
		color: #6e6e73;
    font-size: 9px;
		font-weight: 700;
	}

  input {
    width: 100%;
    height: 16px;
    accent-color: #007aff;
  }
</style>
