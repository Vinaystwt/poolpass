export interface CommandResult {
  stdout: string;
  stderr: string;
}

export type StellarRunner = (args: string[]) => Promise<CommandResult>;

export interface PrivateIdentity {
  publicKey: string;
  secretKey?: string;
}

export interface PublicIdentity {
  publicKey: string;
}

export interface NamedPublicIdentity extends PublicIdentity {
  name: string;
}

const SECRET_KEY = /S[A-Z2-7]{55}/;
const PUBLIC_KEY = /^G[A-Z2-7]{55}$/;

export function publicIdentity(identity: PrivateIdentity): PublicIdentity {
  return { publicKey: identity.publicKey };
}

function assertNoSecret(result: CommandResult): void {
  if (SECRET_KEY.test(`${result.stdout}\n${result.stderr}`)) {
    throw new Error("Stellar command output contained a secret key; refusing to expose it");
  }
}

async function readAddress(runner: StellarRunner, name: string): Promise<string> {
  const result = await runner(["keys", "address", name]);
  assertNoSecret(result);
  const publicKey = result.stdout.trim();
  if (!PUBLIC_KEY.test(publicKey)) throw new Error(`Invalid public key returned for identity ${name}`);
  return publicKey;
}

export async function ensureIdentities(
  runner: StellarRunner,
  names: string[],
): Promise<NamedPublicIdentity[]> {
  const identities: NamedPublicIdentity[] = [];

  for (const name of names) {
    let publicKey: string;
    try {
      publicKey = await readAddress(runner, name);
    } catch (error) {
      if (error instanceof Error && /contained a secret/i.test(error.message)) throw error;
      const generated = await runner(["keys", "generate", name, "--network", "testnet", "--fund"]);
      assertNoSecret(generated);
      publicKey = await readAddress(runner, name);
    }
    identities.push({ name, publicKey });
  }

  return identities;
}

