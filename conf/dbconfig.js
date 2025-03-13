module.exports = {
  limit: 10,
  connectors: {
      addressEstate: {
          mssql: {
            user: 'xxxxx',
            password: 'xxxxx',
            connectString: 'server name',
            database: 'database name'
          }
      },
      // Defines a default connector. If more than one connector is specified (only works for the search endpoint), then each search model must specify which connector to use.
      search: {
          pg: {
            user: 'postgres',
            password: 'postgres',
            connectString: 'localhost',
            database: 'mdk',
			port: 5432
          }
          // ,
          // mssql: {
          //   user: 'xxxxx',
          //   password: 'xxxxx',
          //   connectString: 'server name',
          //   database: 'database name'
          // }
      },
      singlesearch: {
          // oracle: {
          //     user: 'xxxxx',
          //     password: 'xxxxx',
          //     connectString: process.env.NODE_ORACLEDB_CONNECTIONSTRING || 'server name:1521/orcl'
          // }
          // mssql: {
          //   user: 'xxxxx',
          //   password: 'xxxxx',
          //   connectString: 'server name',
          //   database: 'database name'
          // }
          pg: {
            user: 'postgres',
            password: 'postgres',
            connectString: 'localhost',
            database: 'rtj',
            port: 5432
          }
      }
  },
  models: {
      singlesearch: {
          // search: {
          //     table: 'table name',
          //     searchField: 'search field name',
          //     schema: 'schema name, for example dbo',
          //     database: 'database name',
          //     useCentroid: true
          // }
          search: {
              table: 'fastighetsytor_sammanslagen',
              searchField: 'FASTIGHET',
              schema: 'public',
              geometryName: 'geom',
              useCentroid: true
          }

      },
      search: {
        search: {
          // Add a reference to the connector if using more than one.
          // connector: 'pg',
          tables: [
            {
              table: 'fastighetsytor',
              customType: 'fastighetsindelning',
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
        // ,
        // search2: {
        //   connector: 'mssql',
        //   tables: [
        //     {
        //       table: 'gatunamn',
        //       searchField: 'namn',
        //       schema: 'dbo',
        //       geometryName: 'geom',
        //       useCentroid: false
        //     }
        //   ]
        // }
     },
      addressEstate: {
          addresses: {
              table: 'table name',
              searchField: 'search field name',
              schema: 'schema name, for example dbo',
              database: 'database name',
              useCentroid: true,
              fields: ['field name', 'field name']
          },
          estates: {
              table: 'table name',
              searchField: 'search field name',
              schema: 'schema name, for example dbo',
              database: 'database name',
              useCentroid: true,
              fields: ['field name', 'field name']
          }
      }
  }
};
