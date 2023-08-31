const { time } = require("@openzeppelin/test-helpers");
require("@openzeppelin/test-helpers/configure")({
  provider: "http://localhost:8545",
});

async function main() {
  await time.advanceBlock();
  console.log('done')
}

main()