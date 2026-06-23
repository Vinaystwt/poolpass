extern crate std;

use hex_literal::hex;
use soroban_sdk::{bytesn, vec, Bytes, BytesN, Env};

use crate::{GateGroth16, GateGroth16Client};

const PROOF: [u8; 256] = hex!(
    "1afda307679828fc921096410a067d9e2ef959f73b036174c38a575ce66ff17205b99cc7cfe34320fc3c194ab6d28e0b2cbce925542b73b071385ea805d5609f0c98ac2bb195887bc55b3f2b3c1289d8ee1f4025aee723ede60dbefd2cb788372535e4e13230143d4e5cbb17ca7b8cdfb93fb58d191fa9b2e322bc6f63f21058241722da00b8860289a48cca8411bc4c8b9febc69e1549b7fcc99e7ef4b943172430a4b79823d9a05e97ed24353b2285aa25178074e4bc1b30a4526ba5cdecb31cac084ad1054178490606d18b4d57913736157a734b2aa8fc501d93250b07721875e3bd6d61bc38ae8a913f81c2d50d487d9dc64eb36eb73bba9a97b5c63514"
);

const VK: [u8; 580] = hex!(
    "2eb89921709bc12a884fa727435b079cbf98b249a7ffab3f48a971ced82fa78e0c95a002b73816becc4ff3b6d07400bcdc2947a34ea904fc1a6afe9ee6ac5aa7225092119715d546e54595bdd553366f05778cbb4eed46548f4d62929c3a5e6b2a342a6a2b43222f97e344762740aaa9c70b43b05b0f15530faf6412a96daeff180614630a9d4c756230397fdf6f6eb822d1da5b7b65463af5c1075a76d80bed080a2d0c38ec372fa77ffb847f75b873ae4d9e41c84fa8a55587d1885f7db417198e9393920d483a7260bfb731fb5d25f1aa493335a9e71297e485b7aef312c21800deef121f1e76426a00665e5c4479674322d4f75edadd46debd5cd992f6ed090689d0585ff075ec9e99ad690c3395bc4b313370b38ef355acdadcd122975b12c85ea5db8c6deb4aab71808dcb408fe3d1e7690c43d37b4ce6cc0166fa7daa2f7cec2bbbcb0316198e202bff6700ad8fea6cb498244bb496620c2c0e8d8a682a3502ade6fd7949dedce61dacc4b53a5e01f4620cb778d9efba788d48c0305b0765cc39543a84e5880b830c536199479f2ec2fbc8d9a84e970cadc657c6fe5101bbd227a3090eb7df14c63aafa2881782b3915849ee5a0b291f4fcb6efec163000000022bf709e7fb038e2097625de43bf2acc8f6a8c117f1537140bef57a949bec3add0112417a01a180b998324e8f6f077e31bf4d864fb78d06314c6fb650489f14cf1fb7f4085cdd938e291982163e03266d6ae5a42c984ac537aa2b4ea9bf24f41204943f76b8a0b3b0b20361f3bfcfbc152f23304c67a187536a0f8249bcc3798e"
);

fn client(env: &Env) -> GateGroth16Client<'_> {
    let id = env.register(GateGroth16, ());
    GateGroth16Client::new(env, &id)
}

#[test]
fn verifies_dummy_bn254_proof() {
    let env = Env::default();
    let valid = client(&env).verify(
        &Bytes::from_array(&env, &VK),
        &Bytes::from_array(&env, &PROOF),
        &vec![
            &env,
            BytesN::from_array(
                &env,
                &bytesn!(
                    &env,
                    0x0000000000000000000000000000000000000000000000000000000000000021
                )
                .to_array(),
            ),
        ],
    );
    assert!(valid);
}

#[test]
fn rejects_wrong_public_input() {
    let env = Env::default();
    let valid = client(&env).verify(
        &Bytes::from_array(&env, &VK),
        &Bytes::from_array(&env, &PROOF),
        &vec![
            &env,
            BytesN::from_array(
                &env,
                &bytesn!(
                    &env,
                    0x0000000000000000000000000000000000000000000000000000000000000016
                )
                .to_array(),
            ),
        ],
    );
    assert!(!valid);
}
