declare module "circomlibjs" {
  export interface Poseidon {
    (inputs: bigint[]): unknown;
    F: { toObject(value: unknown): bigint };
  }

  export function buildPoseidon(): Promise<Poseidon>;
}
