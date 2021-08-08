//gcloud --project=grey-sort-challenge functions deploy goWithTheDataFlow --stage-bucket gs://batch-pipeline --trigger-bucket gs://batch-pipeline
//gcloud functions deploy goWithTheDataFlow --project=mrsutikno --region=australia-southeast1 --runtime=nodejs10 --set-env-vars DISABLE_LEGACY_METADATA_SERVER_ENDPOINTS=true --service-account=datadeployer@sutikno.iam.gserviceaccount.com --stage-bucket=gs://batch-pipeline-code --trigger-bucket=gs://batch-pipeline-code
const { google } = require('googleapis');
//var {google} = require('googleapis');
const PROJECT_ID = "mrsutikno";

const createDataflowJob = (dataflow, projectId, file) => {
  dataflow.projects.templates.create({
      projectId: projectId,
      resource: {
          parameters: {
              inputFile: `gs://${file.bucket}/${file.name}`
          },
          jobName: 'called-from-a-cloud-function-batch-pipeline-' + new Date().getTime(),
          gcsPath: `gs://${file.bucket}/template/pipeline`

      }
  }, (err, response) => {
      if (err) console.error("Error running dataflow template: ", err);
      console.log("Dataflow template response: ", response);
  });
}

exports.goWithTheDataFlow = async function(data, context, callback) {
  const file = data;  
  //const etype = data.context.eventType;
  const ttype = context.eventType;
     
  console.log("File bucket is: ", file.bucket);
  console.log("File name is: ", file.name);
  console.log("ttype is: ", ttype);

  //if (etype === 'google.storage.object.finalize' && file.data.name.indexOf('upload/') !== -1) {
 if (ttype === 'google.storage.object.finalize' && file.name.indexOf('upload/') !== -1) {
   
    const authClient = await google.auth.getClient({
      scopes: [
        'https://www.googleapis.com/auth/cloud-platform',        
        'https://www.googleapis.com/auth/userinfo.email' 
        ]
    }); 
        
    const dataflow = google.dataflow({ version: 'v1b3', auth: authClient });
    createDataflowJob(dataflow, PROJECT_ID, file);
    callback();

  } else {
    console.log("Nothing to do here, ignoring.");
    callback();
  }
};
