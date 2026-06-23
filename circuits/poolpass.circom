pragma circom 2.2.2;

include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";

template PoolPass(depth) {
    // Public contract: do not reorder without migrating the verifier and frontend.
    signal input merkle_root;
    signal input amount;
    signal input nullifier;
    signal input epoch;

    signal input investor_id;
    signal input cap;
    signal input investor_secret;
    signal input merkle_path[depth];
    signal input merkle_indices[depth];

    component leafHasher = Poseidon(3);
    leafHasher.inputs[0] <== investor_id;
    leafHasher.inputs[1] <== cap;
    leafHasher.inputs[2] <== investor_secret;

    signal current[depth + 1];
    signal left[depth];
    signal right[depth];
    component pathHasher[depth];
    current[0] <== leafHasher.out;

    for (var level = 0; level < depth; level++) {
        merkle_indices[level] * (merkle_indices[level] - 1) === 0;
        left[level] <== current[level] + merkle_indices[level] * (merkle_path[level] - current[level]);
        right[level] <== merkle_path[level] + merkle_indices[level] * (current[level] - merkle_path[level]);
        pathHasher[level] = Poseidon(2);
        pathHasher[level].inputs[0] <== left[level];
        pathHasher[level].inputs[1] <== right[level];
        current[level + 1] <== pathHasher[level].out;
    }
    current[depth] === merkle_root;

    component withinCap = LessEqThan(64);
    withinCap.in[0] <== amount;
    withinCap.in[1] <== cap;
    withinCap.out === 1;

    component nullifierHasher = Poseidon(2);
    nullifierHasher.inputs[0] <== investor_secret;
    nullifierHasher.inputs[1] <== epoch;
    nullifierHasher.out === nullifier;
}

component main { public [merkle_root, amount, nullifier, epoch] } = PoolPass(3);
