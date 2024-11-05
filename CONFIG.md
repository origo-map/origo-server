# Origo server configuration

### Basic configuration
The configuration of Origo server are split in to two files conf/config.js and conf/dbconfig.js

Both files are a text that makes up a json object. The difference is that dbconfig.js concerns anything that is related to database and config.js contains the other services which is not directly a database.

Since the text in conf/config.js and conf/dbconfig.js are parsed to a JSON object it's important that it is correct JSON syntax in the text otherwise it will fail.

### Configuration options
Configuration explained for the following services:

- ConvertToGeojson - translates a none standard json to GeoJSON FeatureCollection.

		converts - an array which holds one or more configurations of objects that is to be converted.

		name - a unique name for the converting which is used to call on it from the front end.

		url - the url to the JSON which is to be converted.

		title - the title that is used as name in the GeoJSON FeatureCollection.

		arrayOfObjects - the name of the array object in the JSON that holds the objects that is to be converted.

		geometry - the name of the object in the JSON that holds the obects geometry.

		geometry_type - the type of the geometry, values can be Point, LineString, Polygon, MultiPoint, MultiLineString, and MultiPolygon.

		geometry_format - the format of the geometry, values can for now be Array or GeometryCollections.

		properties - an array with the names of the objects which should be transferred into properties of the feature in the GeoJSON.

		encoding - the charcter encoding of the JSON if not the standard for GeoJSON which is UTF-8, UTF-16, or UTF-32. Is only needed if encoding isn't UTF-8, UTF-16, or UTF-32 otherwise it's optional.

- IoTProxy - translates data in NGSI-LD standard to GeoJSON FeatureCollection.

If you have data from IoT sensors in NGSI-LD standard and want to read it directly in Origo as a GeoJSON use this service to setup a translation. Read more about NGSI-LD in [NGSI-LD FAQ](https://fiware-datamodels.readthedocs.io/en/latest/ngsi-ld_faq/index.html)

		services - an array which holds one or more configurations of type of sensor data to be retrieved.

		name - a unique name for the service which is used to call on it from the front end.

		url - the url to the JSON which is to be converted.

		title - the title that is used as name in the GeoJSON FeatureCollection.

		properties - an array with the names of the objects which should be transferred into properties of the feature in the GeoJSON.

- Overpass - get data from OpenStreetMap through the Overpass API.

A typical query can be to get all nodes tagged with some key within a area limited by a bounding box. Test your queries in [overpass turbo](https://overpass-turbo.eu/) Read more about [Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API) Uses the module [query-overpass](https://github.com/perliedman/query-overpass)

		queries - an array which holds one or more query objects that retrieves data from OpenStreetMap.

		name - a unique name for the query which is used to call on it from the front end.

		query - a overpass query which is passed to the API. Test the query in overpass turbo and make sure it's on a single row in the config. Limited support for complex queries.

		title - the title that is used as name in the GeoJSON FeatureCollection.

		options - optional options to be set which currently is overpassUrl and flatProperties

- Trafikverket API - get data from Trafikverket API.

To use the API you must have a authentication key, which can be obtained by registration on [Trafikverkets öppna API](https://api.trafikinfo.trafikverket.se/) or [Trafiklab API](https://www.trafiklab.se/api)

		services - an array which holds one or more configurations of questions that is to be executed.

		name - a unique name for the service which is used to call on it from the front end.

		url - the url to the API.

		title - the title that is used as name in the GeoJSON FeatureCollection.

		query - a query that is accepted by the Trafikverket API in XML-format inclusive the authentication key.

		type - the object type of the response, currently only Siuation is implemented.
		
- Authorization with openID

An openID connect provider is required for this to work.

    	openidIssuer - url to openID well-known configuration

    	redirect_uri - url to where the response to the request should be sent, after the user signs in. Must be the same as in the openID provider.

    	http_timeout - timeout in milliseconds for communication with openIdIssuer.

    	client_id - from openID provider

    	client_secret - from openID provider

    	display_name - attribute from user-information displayed in the user menu (Origo with oidc-plugin).

- NGP Detaljplan - get documents from detailed plans

Acts as a attachment server for files from Nationella geodataplattformen (NGP). First setup the Oauth2 keys in [Lantmäteriet APImanager](https://apimanager.lantmateriet.se/devportal/apis) and add GeodatakatalogSökning and GeodatakatalogNedladdning as subscribtions.

    	url_base - the base url to Lantmäteriet API, f.e. 'https://api.lantmateriet.se/' or 'https://api-ver.lantmateriet.se/'.

    	client_key - the client key used to get the token from Lantmäteriet API

    	client_secret - the client secret used to get the token from Lantmäteriet API

    	grant_type - the grant type used to get the token from Lantmäteriet API, f.e. 'client_credentials'.

    	scope - the scope used to get the token from Lantmäteriet API, f.e. 'am_application_scope default'.

    	query - A string with JSON to specify the query on which a detailed plan is searched for and specify where to inject identifier in the query between two $ characters, f.e. '{"feature.typ": {"eq": "detaljplan"}, "detaljplan.beteckning": {"eq": "$planid$"}, "detaljplan.status": {"in": ["laga kraft"]}}'.
