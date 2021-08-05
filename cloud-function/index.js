//gcloud --project=grey-sort-challenge functions deploy goWithTheDataFlow --stage-bucket gs://batch-pipeline --trigger-bucket gs://batch-pipeline
//gcloud functions deploy goWithTheDataFlow --project=sutikno --region=australia-southeast1 --runtime=nodejs10 --service-account=datadeployer@sutikno.iam.gserviceaccount.com --stage-bucket=gs://batch-pipeline-code --trigger-bucket=gs://batch-pipeline-code
const google = require('googleapis');
//var {google} = require('googleapis');
exports.goWithTheDataFlow = function(data, context, callback) {
  const file = data;  
  //const etype = data.context.eventType;
  const ttype = context.eventType;
     
  console.log("File is: ", file);
  //console.log("etype is: ", etype);
  console.log("ttype is: ", ttype);
  //console.log("file.data.name is: ", file.data.name);
  //console.log("data.name is: ", data.name);

  //if (etype === 'google.storage.object.finalize' && file.data.name.indexOf('upload/') !== -1) {
  if (ttype === 'google.storage.object.finalize' && file.name.indexOf('upload/') !== -1) {    
    google.auth.getApplicationDefault(function (err, authClient) {
    if (err) {
      throw err; 
    }

      // See https://cloud.google.com/compute/docs/authentication for more information on scopes
      if (authClient.createScopedRequired && authClient.createScopedRequired()) {
        // Scopes can be specified either as an array or as a single, space-delimited string.
        authClient = authClient.createScoped([
          'https://www.googleapis.com/auth/cloud-platform',
          'https://www.googleapis.com/auth/userinfo.email'
        ]);
      }
      
      google.auth.getDefaultProjectId(function(err, projectId) {
        if (err || !projectId) {
          console.error(`Problems getting projectId (${projectId}). Err was: `, err);
          throw err;
        }
        console.log("then here?");
        const dataflow = google.dataflow({ version: 'v1b3', auth: authClient });
        dataflow.projects.templates.create({
          projectId: projectId,
          resource: {
            parameters: {
              inputFile: `gs://${file.bucket}/${file.name}`
            },
            jobName: 'called-from-a-cloud-function-batch-pipeline-' + new Date().getTime(),
            gcsPath: 'gs://batch-pipeline/template/pipeline'
          }
        }, function(err, response) {
          if (err) {
            console.error("Problem running dataflow template, error was: ", err);
          }
          console.log("Dataflow template response: ", response);
          callback();
        });
      });
    });
  } else {
    console.log("Nothing to do here, ignoring.");
    callback();
  }
};
