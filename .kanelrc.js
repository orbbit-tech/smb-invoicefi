const { makeKyselyHook, kyselyCamelCaseHook } = require('kanel-kysely');

require('dotenv').config();

module.exports = {
  connection: {
    host: process.env.POSTGRES_HOST || 'localhost',
    database: process.env.POSTGRES_DATABASE || 'postgres',
    port: Number(process.env.POSTGRES_PORT) || 54322,
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
  },
  generateIdentifierType: false,

  // Web3 Invoice Financing schemas
  schemas: [
    'identity',      // Organizations, users, members
    'business',      // Payer companies and relationships
    'invoice',       // Invoice lifecycle management
    'blockchain',    // NFTs, transactions, events
    'investment',    // Investor positions and yields
  ],

  // Add the Kysely hooks with custom naming
  preRenderHooks: [
    makeKyselyHook({
      includeSchemaNameInTableName: true,
      // Custom naming function to add "Db" suffix
      getKyselyItemMetadata: (d, selectorName, canInitialize, canMutate) => {
        // Get the table name and capitalize the first letter
        const tableName = d.name
          .split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join('');

        return {
          tableInterfaceName: `${tableName}Table`,
          selectableName: `${tableName}Db`,
          insertableName: canInitialize ? `${tableName}CreateDb` : undefined,
          updatableName: canMutate ? `${tableName}UpdateDb` : undefined,
        };
      },
    }),
    kyselyCamelCaseHook,
  ],
  outputPath: './src/types/db',
};
