module.exports = {
  limit: 10,
  connectors: {
      addressEstate: {
          mssql: {
            user: 'xxxxx',
            password: 'xxxxx',
            connectString: "server name",
            database: "database name"
          }
      },
      search: {
          mssql: {
            user: 'xxxxx',
            password: 'xxxxx',
            connectString: "server name",
            database: "test"
          }
      },
      singlesearch: {
          // oracle: {
          //     user: 'xxxxx',
          //     password: 'xxxxx',
          //     connectString: process.env.NODE_ORACLEDB_CONNECTIONSTRING || "server name:1521/orcl"
          // }
          // mssql: {
          //   user: 'xxxxx',
          //   password: 'xxxxx',
          //   connectString: "server name",
          //   database: "database name"
          // }
          pg: {
            user: 'xxxxx',
            password: 'xxxxx',
            connectString: "server name",
            database: "database name",
            port: 5432
          }
      }
  },
  models: {
      singlesearch: {
          // search: {
          //     table: "table name",
          //     searchField: "search field name",
          //     schema: 'schema name, for example dbo',
          //     database: 'database name'
          // }
          search: {
              table: "table name",
              searchField: "search field name",
              schema: 'schema name, for example public',
              geometryName: 'geometry field name, for example geom',
          }

      },
      search: {
          search: {
              table: "table name",
              searchField: "search field name",
              schema: 'schema name, for example dbo',
              geometryName: 'geometry field name, for example geom',
              database: 'database name',
              fields: ['field name', 'field name'],
			  layers: [
				'layer name',
				'layer name',
				'layer name',
				'layer name'
			  ]
          }
      },
      addressEstate: {
          addresses: {
              table: "table name",
              searchField: "search field name",
              schema: 'schema name, for example dbo',
              database: 'database name',
              fields: ['field name', 'field name']
          },
          estates: {
              table: "table name",
              searchField: "search field name",
              schema: 'schema name, for example dbo',
              database: 'database name',
              fields: ['field name', 'field name']
          }
      }
  }
};
