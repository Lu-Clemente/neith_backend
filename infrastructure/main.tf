terraform {
  required_providers {
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "5.38.0"
    }
  }
}

locals {
  project_name = "neith-app-project"
}

variable "gcloud_credentials_path" {
  type = string
}

variable "environment" {
  type    = string
  default = "sandbox"
}

provider "google-beta" {
  project = local.project_name
  region  = "us-central1"

  credentials = var.gcloud_credentials_path
}

resource "google_storage_bucket" "serving_bucket" {
  provider                    = google-beta
  name                        = "${local.project_name}-serving-bucket-${var.environment}"
  location                    = "US"
  uniform_bucket_level_access = true
}

resource "google_storage_bucket_object" "privacy_policy_object" {
  provider = google-beta
  bucket   = google_storage_bucket.serving_bucket.id

  name   = "privacy-policy/index.html"
  source = "${path.module}/files/privacy-policy.html"
}

resource "google_firebase_storage_bucket" "firebase_serving_bucket" {
  provider = google-beta
  project  = local.project_name

  bucket_id = google_storage_bucket.serving_bucket.id
}

resource "google_storage_bucket" "users_bucket" {
  provider                    = google-beta
  name                        = "${local.project_name}-users-bucket-${var.environment}"
  location                    = "US"
  uniform_bucket_level_access = true
}

resource "google_firebase_storage_bucket" "firebase_users_bucket" {
  provider = google-beta
  project  = local.project_name

  bucket_id = google_storage_bucket.users_bucket.id
}

resource "google_storage_bucket" "places_photos_bucket" {
  provider                    = google-beta
  name                        = "${local.project_name}-places-photos-bucket-${var.environment}"
  location                    = "US"
  uniform_bucket_level_access = true
}

resource "google_firebase_storage_bucket" "firebase_places_photos_bucket" {
  provider = google-beta
  project  = local.project_name

  bucket_id = google_storage_bucket.places_photos_bucket.id
}

resource "google_project_service" "places_api_service" {
  provider = google-beta
  project  = local.project_name

  service = "places-backend.googleapis.com"
}

resource "google_project_service" "places_api_new_service" {
  provider = google-beta
  project  = local.project_name

  service = "places.googleapis.com"
}

resource "google_firestore_database" "project_firestore" {
  provider = google-beta
  project  = local.project_name

  name        = "${local.project_name}-${var.environment}"
  location_id = "nam5"
  type        = "FIRESTORE_NATIVE"
}
