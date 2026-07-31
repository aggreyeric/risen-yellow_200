// Live probe: read the deployed contract via stellar-sdk v16 + verify the API.
import * as sdk from "@stellar/stellar-sdk";

const CONTRACT = "CD76QS2APOWHXZ3E24R5GJIYGF2TUWVED36U3SMTQMAPIIH3AYHS2C46";
const RPC = "https://soroban-testnet.stellar.org:443";
const NET = sdk.Networks.TESTNET;

console.log("scValToNative?", typeof sdk.scValToNative);
console.log("nativeToScVal?", typeof sdk.nativeToScVal);
console.log("Address.fromString?", typeof sdk.Address.fromString);

const server = new sdk.rpc.Server(RPC, { allowHttp: false });

// Need a real account only to give TransactionBuilder a sequence number.
const DUMMY_PUB = "GBQYOTSQKR5OBD6PGMKYIU644TZFBC4EKKE4R75YD5LBLXWA3DN6IZRF";
const account = await server.getAccount(DUMMY_PUB);

const contract = new sdk.Contract(CONTRACT);

async function read(method, ...args) {
  const tx = new sdk.TransactionBuilder(account, {
    fee: sdk.BASE_FEE,
    networkPassphrase: NET,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  return sim;
}

console.log("\n--- get_total_raised ---");
const t = await read("get_total_raised");
console.log("isSuccess:", sdk.rpc.Api.isSimulationSuccess(t));
console.log("result keys:", Object.keys(t));
console.log("result:", JSON.stringify(t.result));
if (sdk.rpc.Api.isSimulationSuccess(t) && t.result?.retval) {
  const native = sdk.scValToNative(t.result.retval);
  console.log("PARSED total_raised:", native);
}

console.log("\n--- get_donor_count ---");
const c = await read("get_donor_count");
if (sdk.rpc.Api.isSimulationSuccess(c) && c.result?.retval) {
  console.log("PARSED donor_count:", sdk.scValToNative(c.result.retval));
}

console.log("\n--- get_campaign ---");
const camp = await read("get_campaign");
if (sdk.rpc.Api.isSimulationSuccess(camp) && camp.result?.retval) {
  const parsed = sdk.scValToNative(camp.result.retval);
  console.log("PARSED campaign type:", typeof parsed, Array.isArray(parsed) ? "array" : "");
  console.log(
    "PARSED campaign (bigint-safe):",
    JSON.stringify(parsed, (_, v) => (typeof v === "bigint" ? Number(v) : v), 2)
  );
  console.log("keys:", Object.keys(parsed));
}
