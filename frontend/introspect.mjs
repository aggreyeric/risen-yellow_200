import * as walletKit from "@creit.tech/stellar-wallets-kit";
import * as sdk from "@stellar/stellar-sdk";

function protoKeys(obj) {
  const set = new Set();
  let cur = obj;
  while (cur && cur !== Object.prototype) {
    Object.getOwnPropertyNames(cur).forEach((n) => set.add(n));
    cur = Object.getPrototypeOf(cur);
  }
  return [...set];
}

console.log("=== StellarWalletsKit ===");
console.log("ctor.length (num ctor params):", walletKit.StellarWalletsKit.length);
console.log("StellarWalletsKit ===", typeof walletKit.StellarWalletsKit);
console.log("StellarWalletsKit.prototype keys:");
console.log(protoKeys(walletKit.StellarWalletsKit.prototype).join(", "));

console.log("\n=== allowedWallets (sample) ===");
const aw = walletKit.allowedWallets;
console.log("type:", Array.isArray(aw) ? "array" : typeof aw, "len:", aw?.length);
if (Array.isArray(aw)) {
  aw.slice(0, 12).forEach((w, i) => {
    console.log(
      `  [${i}]`,
      JSON.stringify({
        id: w.id,
        name: w.name,
        type: w.type,
        isAvailable: typeof w.isAvailable,
        iconUrl: typeof w.iconUrl,
      })
    );
  });
}

console.log("\n=== Networks ===");
console.log(JSON.stringify(walletKit.Networks));

console.log("\n=== sdk.Contract.prototype ===");
console.log(protoKeys(sdk.Contract.prototype).join(", "));

console.log("\n=== sdk.rpc.Server.prototype ===");
console.log(protoKeys(sdk.rpc.Server.prototype).join(", "));

console.log("\n=== sdk.rpc.Api keys ===");
console.log(Object.keys(sdk.rpc.Api).join(", "));

console.log("\n=== nativeToScVal ===", typeof sdk.nativeToScVal);
console.log("=== Address ===", typeof sdk.Address, "methods:", protoKeys(sdk.Address.prototype).join(", "));
