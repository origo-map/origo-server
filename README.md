# Origo server

### Install Origo server
The minimum requirements are:

  * [Git](https://git-scm.com/)
  * [Node.js](https://nodejs.org/) (version 4 or higher is recommended)

 1. To get your own local copy of Origo server use git to clone the repository with the command below:

   		  git clone https://github.com/origo-map/origo-server.git

 2. To install the required node dependencies run the following command from the root directory of origo-server:

  		   npm install

 	 *install without optional dependencies*

	 	   npm install --no-optional

 3. To start Origo server, run:

   		  node app.js

The server will be available at <http://localhost:3001/origoserver>.

The database dependencies in Origo server are optional and if any of the modules fails to install it will be skipped. Currently Origo server supports MS SQL Server, Oracle and PostgreSQL.

### Install Origo server as a Windows service
Origo can be installed as a Windows service. Run the following command from tasks:

  		   node create_windowsservice.js

Make sure the paths specified in create_windowsservice.js are correct.

To uninstall run the following command:

  		   node uninstall_windowsservice.js

### Current services provided
Basic configuration needed in conf/config.js and/or conf/dbconfig.js. More information about configuration can be found in the [CONFIG.md](https://github.com/origo-map/origo-server/blob/master/CONFIG.md) file.

Configured services at:

- Inskrivning Direkt - configuration of serviceparts at models/inskrivning.js

		/origoserver/estate/inskrivning?fnr={fastighetsnyckel}

		/origoserver/estate/inskrivning?objektid={objektidentitet}

- Byggnad Direkt - set consumer_key and consumer_secret in conf/config.js

		/origoserver/lm/building?registerenhet={objektidentitet of estate}

		/origoserver/lm/building?uuid={objektidentitet of building}

- Akt Direkt

		/origoserver/document/index.djvu?archive={archive/county-number}&id={akt-number}

		/origoserver/document/page_{vers}_{subdoc}_{page}_{archive}_{id}.djvu

- Search

		/origoserver/addressestatesearch?q={defined in dbconfig.js}

		/origoserver/search?q={defined in dbconfig.js}

		/origoserver/singlesearch?q={defined in dbconfig.js}

- Proxys

		/origoserver/proxy

		/origoserver/lmproxy-ver

		/origoserver/lmproxy

- Höjd Direkt - set consumer_key and consumer_secret in conf/config.js

		/origoserver/lm/elevation/{EPSG code}/{longitude}/{latitude}

- Ortnamn Direkt - set consumer_key and consumer_secret in conf/config.js

		/origoserver/lm/placenames/?q={searchstring}&kommunkod={4-digit number for the municipality}&limit={number}&nametype={placename type}&lang={language name}&srid={EPSG code}

- Registerbeteckning Direkt - set consumer_key and consumer_secret in conf/config.js

		/origoserver/lm/registerenheter?q={searchstring}&srid={EPSG code}&maxHits={number}

		The {searchstring} should start with one or multiple, seperated by commas, municipalities and then a space followed by the free text search for the address. For example "Sundsvall,Hudiksvall Nyland 99:1"

		/origoserver/lm/registerenheter?&fnr={UUID}

		/origoserver/lm/registerenheter/{UUID}/enhetsomraden

		/origoserver/lm/registerenheter?x={easting}&y={northing}&srid={EPSG code}

		/origoserver/lm/enhetsomraden?x={easting}&y={northing}&srid={EPSG code}&type={merged/full}

		Type can be merged or full, default is merged. Full will get the full response from Lantmäteriet and merged will give enhetsomraden polygon and only a subset of properties.

- Belägenhetsadress Direkt - set consumer_key and consumer_secret in conf/config.js

		/origoserver/lm/addresses?q={searchstring}&srid={EPSG code}&maxHits={number}

		The {searchstring} should start with one or multiple, seperated by commas, municipalities and then a space followed by the free text search for the address. For example "Sundsvall,Hudiksvall Storgatan"

		/origoserver/lm/addresses?northing={northing}&easting={easting}&srid={EPSG code}&format={format}

		Supply coordinates and get the closest address to those coordinates. Default format is GeoJSON, but Origo can also be used.

- IoTProxy - translates the IoT standard NGSI-LD to GeoJSON

		/origoserver/iotproxy/?q={service name}&srid={EPSG code}

		The {service name} specified in the config. Transforms coordinates to Sweref99 TM (EPSG:3006) if no srid is supplied.

- Overpass - sends Overpass queries for OpenStreetMap and returns GeoJSON

		/origoserver/overpass/?q={query name}

		The {query name} specified in the config.

- Trafikverket API - fetches data from Trafikverket API

		/origoserver/tvapi/?q={query name}&output={format}

		The {query name} specified in the config. The format of the output if not the standard from Trafikverket API, currently only supported GeoJSON.

- ConvertToGeojson - translates a none standard json to GeoJSON FeatureCollection

		/origoserver/converttogeojson/?q={query name}

		The {query name} specified in the config.
