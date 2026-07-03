interface NetworkConfiguration {
  rpcUrl: string;
  passphrase: string;
}

export function resolveNetworkConfiguration(
  defaults: NetworkConfiguration,
  env: NodeJS.ProcessEnv = process.env,
): NetworkConfiguration {
  return {
    rpcUrl: env.STELLAR_RPC_URL ?? defaults.rpcUrl,
    passphrase: env.STELLAR_NETWORK_PASSPHRASE ?? defaults.passphrase,
  };
}

export function resolveListenOptions(env: NodeJS.ProcessEnv = process.env) {
  return {
    host: env.HOST ?? "0.0.0.0",
    port: Number(env.PORT ?? 3000),
  };
}
