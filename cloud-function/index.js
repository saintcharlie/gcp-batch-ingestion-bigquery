//gcloud --project=grey-sort-challenge functions deploy goWithTheDataFlow --stage-bucket gs://batch-pipeline --trigger-bucket gs://batch-pipeline
const google = require('googleapis');
exports.goWithTheDataFlow = function(data, context, callback) {
  const file = data;
  const etype = data.context.eventType;

  
  console.log("File is: ", file);
  //console.log("File name is: ", file.data.name);
  console.log("State is: ", etype);

  if (etype === 'google.storage.object.finalize' && file.data.name.indexOf('upload/') !== -1) {
    console.log("inside if");
    google.auth.getApplicationDefault(function (err, authClient) {
      if (err) {
        console.log("inside err?");
        throw err;
      }
      // See https://cloud.google.com/compute/docs/authentication for more information on scopes
      if (authClient.createScopedRequired && authClient.createScopedRequired()) {
        // Scopes can be specified either as an array or as a single, space-delimited string.
        console.log("inside scope);
        authClient = authClient.createScoped([
          'https://www.googleapis.com/auth/cloud-platform',
          'https://www.googleapis.com/auth/userinfo.email'
        ]);
      }
      console.log("here?");
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
              inputFile: `gs://${file.data.bucket}/${file.data.name}`
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
