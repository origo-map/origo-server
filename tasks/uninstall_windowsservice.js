var Service = require('node-windows').Service;

// Create a new service object
var svc = new Service({
  name:'origoserver',
  description: 'Origo server',
  script: 'C:\\node\\origo-server\\app.js'
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('uninstall',function(){
  console.log('Uninstall complete.');
  console.log('The service exists: ',svc.exists);
});

// Uninstall the service.
svc.uninstall();