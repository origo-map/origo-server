var configutil = require('../lib/utils/configutil');

module.exports = {
  limit: 10,
  connectors: {
      addressEstate: {
          mssql: {
            user: process.env.ORIGOSERVER_CONNECTORS_ADDRESSESTATE_MSSQL_USER ?? 'xxxxx',
            password: process.env.ORIGOSERVER_CONNECTORS_ADDRESSESTATE_MSSQL_PASSWORD ?? 'xxxxx',
            connectString: process.env.ORIGOSERVER_CONNECTORS_ADDRESSESTATE_MSSQL_CONNECTSTRING ?? "server name",
            database: process.env.ORIGOSERVER_CONNECTORS_ADDRESSESTATE_MSSQL_DATABASE ?? "database name"
          }
      },
      search: {
          pg: {
            user: process.env.ORIGOSERVER_CONNECTORS_SEARCH_PG_USER ?? 'postgres',
            password: process.env.ORIGOSERVER_CONNECTORS_SEARCH_PG_PASSWORD ?? 'postgres',
            connectString: process.env.ORIGOSERVER_CONNECTORS_SEARCH_PG_CONNECTSTRING ?? "localhost",
            database: process.env.ORIGOSERVER_CONNECTORS_SEARCH_PG_DATABASE ?? "mdk",
			port: configutil.convertToNumber(process.env.ORIGOSERVER_CONNECTORS_SEARCH_PG_PORT) ?? 5432
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
            user: process.env.ORIGOSERVER_CONNECTORS_SINGLESEARCH_PG_USER ?? 'postgres',
            password: process.env.ORIGOSERVER_CONNECTORS_SINGLESEARCH_PG_PASSWORD ?? 'postgres',
            connectString: process.env.ORIGOSERVER_CONNECTORS_SINGLESEARCH_PG_CONNECTSTRING ?? "localhost",
            database: process.env.ORIGOSERVER_CONNECTORS_SINGLESEARCH_PG_DATABASE ?? "rtj",
            port: configutil.convertToNumber(process.env.ORIGOSERVER_CONNECTORS_SINGLESEARCH_PG_PORT) ?? 5432
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
              table: process.env.ORIGOSERVER_MODELS_SINGLESEARCH_TABLE ?? "fastighetsytor_sammanslagen",
              searchField: process.env.ORIGOSERVER_MODELS_SINGLESEARCH_SEARCHFIELD ?? "FASTIGHET",
              schema: process.env.ORIGOSERVER_MODELS_SINGLESEARCH_SCHEMA ?? 'public',
              geometryName: process.env.ORIGOSERVER_MODELS_SINGLESEARCH_GEOMETRYNAME ?? 'geom',
              useCentroid: configutil.convertToBoolean(process.env.ORIGOSERVER_MODELS_SINGLESEARCH_USECENTROID) ?? true
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
              table: process.env.ORIGOSERVER_MODELS_ADDRESSESTATE_ADDRESSES_TABLE ?? "table name",
              searchField: process.env.ORIGOSERVER_MODELS_ADDRESSESTATE_ADDRESSES_SEARCHFIELD ?? "search field name",
              schema: process.env.ORIGOSERVER_MODELS_ADDRESSESTATE_ADDRESSES_SCHEMA ?? 'schema name, for example dbo',
              database: process.env.ORIGOSERVER_MODELS_ADDRESSESTATE_ADDRESSES_DATABASE ?? 'database name',
              useCentroid: configutil.convertToBoolean(process.env.ORIGOSERVER_MODELS_ADDRESSESTATE_ADDRESSES_USECENTROID) ?? true,
              fields: ['field name', 'field name']
          },
          estates: {
              table: process.env.ORIGOSERVER_models_addressEstate_estates_table ?? "table name",
              searchField: process.env.ORIGOSERVER_models_addressEstate_estates_searchField ?? "search field name",
              schema: process.env.ORIGOSERVER_models_addressEstate_estates_schema ?? 'schema name, for example dbo',
              database: process.env.ORIGOSERVER_models_addressEstate_estates_database ?? 'database name',
              useCentroid: configutil.convertToBoolean(process.env.ORIGOSERVER_models_addressEstate_estates_useCentroid) ?? true,
              fields: ['field name', 'field name']
          }
      }
  }
};
