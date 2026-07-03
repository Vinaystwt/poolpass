const TOKEN_SCALE = 10_000_000n;
const PREFERRED_SUBSCRIBE_AMOUNT = 25_000_000_000n;

function formatBaseUnits(value: bigint): string {
  const whole = value / TOKEN_SCALE;
  const fraction = (value % TOKEN_SCALE).toString().padStart(7, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

export function defaultSubscribeAmount(capBaseUnits: string | null | undefined): string {
  const cap = capBaseUnits ? BigInt(capBaseUnits) : PREFERRED_SUBSCRIBE_AMOUNT;
  return formatBaseUnits(
    cap < PREFERRED_SUBSCRIBE_AMOUNT ? cap : PREFERRED_SUBSCRIBE_AMOUNT,
  );
}
