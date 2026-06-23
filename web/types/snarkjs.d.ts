declare module "snarkjs" {
  type ProofInput = Record<string, unknown>;
  interface Groth16Proof {
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
    protocol: string;
    curve: string;
  }
  export const wtns: {
    calculate(input: ProofInput, wasmFile: string | Uint8Array, wtnsFile: unknown): Promise<void>;
  };
  export const groth16: {
    prove(
      zkeyFile: string | Uint8Array,
      wtnsFile: unknown,
    ): Promise<{ proof: Groth16Proof; publicSignals: string[] }>;
    fullProve(
      input: ProofInput,
      wasmFile: string | Uint8Array,
      zkeyFile: string | Uint8Array,
    ): Promise<{ proof: Groth16Proof; publicSignals: string[] }>;
    verify(vk: unknown, publicSignals: string[], proof: unknown): Promise<boolean>;
  };
}
