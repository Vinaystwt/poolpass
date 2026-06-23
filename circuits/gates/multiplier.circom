pragma circom 2.2.2;

template Multiplier() {
    signal input a;
    signal input b;
    signal input c;

    a * b === c;
}

component main {public [c]} = Multiplier();

