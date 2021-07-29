terraform {
  backend "gcs" {
    bucket = "tf-state-gcp-batch-ingestion"
    #region = "australia-southeast1-a"
    prefix = "terraform/state"
  }
}

provider "google" {
  project = "sutikno"
  region = "australia-southeast1-a"
}

resource "google_storage_bucket" "batch-pipeline" {
  #name = "temp-gcp-code-batch"
  name = "batch-pipeline"
  storage_class = "REGIONAL"
  location  = "australia-southeast1"
}
