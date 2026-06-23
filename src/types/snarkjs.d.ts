declare module "snarkjs" {
  export const groth16: {
    fullProve(input: object, wasmPath: string, zkeyPath: string): Promise<{ proof: object; publicSignals: string[] }>;
    verify(verificationKey: object, publicSignals: string[], proof: object): Promise<boolean>;
  };
}
