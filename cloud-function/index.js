//gcloud --project=grey-sort-challenge functions deploy goWithTheDataFlow --stage-bucket gs://batch-pipeline --trigger-bucket gs://batch-pipeline
const google = require('googleapis');
exports.goWithTheDataFlow = function(data, context, callback) {
  const file = data;
  const etype = data.context.eventType;

  //console.log("Event is: ", event);
  console.log("File is: ", file);
  console.log("File name is: ", file.name);
  console.log("file.name.indexOf('upload/') ", file.name.indexOf('upload/'));
  //console.log("test: ",file.context.eventType);
  console.log("State is: ", etype);

  if (etype === 'google.storage.object.finalize' && file.name.indexOf('upload/') !== -1) {
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
