//gcloud --project=grey-sort-challenge functions deploy goWithTheDataFlow --stage-bucket gs://batch-pipeline-code --trigger-bucket gs://batch-pipeline-code
const google = require('googleapis');
exports.goWithTheDataFlow = function(event, callback) {
  const file = event.data;
  const context = event.context;

  console.log("Event is: ", event);
  console.log("File is: ", file);
  console.log("State is: ", context.eventType);

  if (context.eventType === 'google.storage.object.finalize' && file.name.indexOf('upload/') !== -1) {
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
            jobName: 'called-from-a-cloud-function-batch-pipeline-code-' + new Date().getTime(),
            gcsPath: 'gs://batch-pipeline-code/template/pipeline'
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
