const approval = process.env.KORA_APPROVE_PRODUCTION_DB_PUSH;
const expected = "I approve production db push for gcunbxduzixilquodcow";

if (approval !== expected) {
  console.error("Production database push is blocked.");
  console.error(`Set KORA_APPROVE_PRODUCTION_DB_PUSH=\"${expected}\" only after backup, review, and deployment approval.`);
  process.exit(1);
}

console.log("Production database push approval phrase verified.");
