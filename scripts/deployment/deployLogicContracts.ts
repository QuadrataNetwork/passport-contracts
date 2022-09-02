const {
  deployGovernance,
  deployPassport,
  deployReader,
} = require("../../utils/deployment.ts");

(async () => {
  const governance = await deployGovernance();
  console.log(`QuadGovernance is deployed: ${governance.address}`);
  const passport = await deployPassport(governance);
  console.log(`QuadPassport is deployed: ${passport.address}`);
  const reader = await deployReader(governance, passport);
  console.log("QuadReader is deployed: ", reader.address);
})();
