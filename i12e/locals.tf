locals {
  display_name = "blocks99"
  # GCP APIS
  apis = ["billingbudgets.googleapis.com", "run.googleapis.com", "iam.googleapis.com", "cloudresourcemanager.googleapis.com", "cloudbilling.googleapis.com"]
  # Server locals
  server_name  = "${local.display_name}-server"
  server_image = "docker.io/peerjs/peerjs-server:latest"
  server_key   = md5(var.base_server_key)
}
