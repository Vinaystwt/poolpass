pragma circom 2.2.2;

include "../../node_modules/circomlib/circuits/poseidon.circom";

template PoseidonPair() {
    signal input left;
    signal input right;
    signal output digest;

    component hasher = Poseidon(2);
    hasher.inputs[0] <== left;
    hasher.inputs[1] <== right;
    digest <== hasher.out;
}

component main = PoseidonPair();

