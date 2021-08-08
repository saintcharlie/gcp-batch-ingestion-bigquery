//gcloud --project=grey-sort-challenge functions deploy goWithTheDataFlow --stage-bucket gs://batch-pipeline --trigger-bucket gs://batch-pipeline
//gcloud functions deploy goWithTheDataFlow --project=mrsutikno --region=australia-southeast1 --runtime=nodejs10 --set-env-vars DISABLE_LEGACY_METADATA_SERVER_ENDPOINTS=true --service-account=datadeployer@sutikno.iam.gserviceaccount.com --stage-bucket=gs://batch-pipeline-code --trigger-bucket=gs://batch-pipeline-code
const {google} = require('googleapis');
exports.helloGCS = function(event, callback) {
    const file = event.data;


        google.auth.getApplicationDefault(function(err, authClient, projectId) {
            if (err) {
                throw err;
            }
            if (authClient.createScopedRequired && authClient.createScopedRequired()) {
                authClient = authClient.createScoped([
                    'https://www.googleapis.com/auth/cloud-platform',
                    'https://www.googleapis.com/auth/userinfo.email'
                ]);
            }
            const dataflow = google.dataflow({
                version: 'v1b3',
                auth: authClient
            });
            dataflow.projects.templates.create({
                projectId: projectId,
                resource: {
                    parameters: {
                        inputFile: `gs://cloud-dataflow-bucket-input/*.txt`
                    },
                    jobName: 'dataflow-triggered-by-cloud-function',
                    gcsPath: 'gs://cloud-dataflow-pipeline-bucket-staging/templates/dataflow-custom-redis-template'
                }
            }, function(err, response) {
                if (err) {
                    console.error("Problems occurred while running dataflow template, error was: ", err);
                }
                console.log("The dataflow template response: ", response);
                callback();
            });
        });

};