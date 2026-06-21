<script lang="ts">
	type Props = {
		label: string;
		description: string;
		checked: boolean;
	};

	let { label, description, checked = $bindable(false) }: Props = $props();
</script>

<label class="toggle-row">
	<span class="copy">
		<strong>{label}</strong>
		<small>{description}</small>
	</span>
	<input type="checkbox" bind:checked />
	<span class="switch"></span>
</label>

<style>
	.toggle-row {
		display: grid;
		grid-template-columns: 1fr 44px;
		gap: 12px;
		align-items: center;
		padding: 11px 0;
		cursor: pointer;
	}

	.copy {
		display: flex;
		min-width: 0;
		flex-direction: column;
		gap: 2px;
	}

	strong {
		color: #1d1d1f;
		font-size: 13px;
		line-height: 1.2;
	}

	small {
		color: #6e6e73;
		font-size: 12px;
		line-height: 1.25;
	}

	input {
		position: absolute;
		opacity: 0;
	}

	.switch {
		position: relative;
		width: 44px;
		height: 26px;
		border-radius: 999px;
		background: #d1d1d6;
		transition: background 140ms ease;
	}

	.switch::after {
		content: "";
		position: absolute;
		top: 2px;
		left: 2px;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		background: white;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.22);
		transition: transform 140ms ease;
	}

	input:checked + .switch {
		background: #34c759;
	}

	input:checked + .switch::after {
		transform: translateX(18px);
	}
</style>
