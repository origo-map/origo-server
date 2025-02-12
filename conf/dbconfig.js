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
          pg: {
            user: 'postgres',
            password: 'postgres',
            connectString: "localhost",
            database: "mdk",
			port: 5432
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
            user: 'postgres',
            password: 'postgres',
            connectString: "localhost",
            database: "rtj",
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
          //     database: 'database name',
          //     useCentroid: true
          // }
          search: {
              table: "fastighetsytor_sammanslagen",
              searchField: "FASTIGHET",
              schema: 'public',
              geometryName: 'geom',
              useCentroid: true
          }

      },
      search: {
        search: {
           tables: [
              {
                 table: 'fastighetsytor',
                 searchField: 'fastighetsbeteckning',
                 schema: 'public',
                 geometryName: 'geom',
                 title: 'Fastigheter',
                 useCentroid: true
              },
              {
                 table: 'Adresser',
                 searchField: 'NAMN',
                 schema: 'public',
                 geometryName: 'geom',
                 gid: 'OBJECTID'
              }
           ]
        }
     },
      addressEstate: {
          addresses: {
              table: "table name",
              searchField: "search field name",
              schema: 'schema name, for example dbo',
              database: 'database name',
              useCentroid: true,
              fields: ['field name', 'field name']
          },
          estates: {
              table: "table name",
              searchField: "search field name",
              schema: 'schema name, for example dbo',
              database: 'database name',
              useCentroid: true,
              fields: ['field name', 'field name']
          }
      }
  }
};
