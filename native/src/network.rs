use serde::{Deserialize, Serialize};

#[allow(dead_code)]
pub const API_BASE: &str = "https://noterender.denzyl.io";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthUser {
    pub id: i64,
    pub email: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthResponse {
    pub token: String,
    pub user: AuthUser,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiError {
    pub error: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CheckoutResponse {
    pub id: Option<String>,
    pub url: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: i64,
    pub name: String,
    pub data: serde_json::Value,
    #[serde(default)]
    pub created_at: Option<String>,
    #[serde(default)]
    pub updated_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Shoutout {
    pub id: i64,
    pub name: String,
    pub message: String,
    pub status: String,
    #[serde(default)]
    pub club_id: Option<i64>,
    #[serde(default)]
    pub created_at: Option<String>,
}

pub async fn login(email: &str, password: &str) -> Result<AuthResponse, String> {
    let client = reqwest::Client::new();
    let resp = client
        .post(format!("{}/api/auth/login", API_BASE))
        .json(&serde_json::json!({ "email": email, "password": password }))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if resp.status().is_success() {
        resp.json::<AuthResponse>()
            .await
            .map_err(|e| format!("Parse error: {}", e))
    } else {
        let err: ApiError = resp
            .json()
            .await
            .unwrap_or(ApiError { error: "Unknown error".into() });
        Err(err.error)
    }
}

pub async fn register(email: &str, password: &str) -> Result<AuthResponse, String> {
    let client = reqwest::Client::new();
    let resp = client
        .post(format!("{}/api/auth/register", API_BASE))
        .json(&serde_json::json!({ "email": email, "password": password }))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if resp.status().is_success() {
        resp.json::<AuthResponse>()
            .await
            .map_err(|e| format!("Parse error: {}", e))
    } else {
        let err: ApiError = resp
            .json()
            .await
            .unwrap_or(ApiError { error: "Unknown error".into() });
        Err(err.error)
    }
}

#[allow(dead_code)]
pub async fn fetch_me(token: &str) -> Result<AuthUser, String> {
    let client = reqwest::Client::new();
    let resp = client
        .get(format!("{}/api/me", API_BASE))
        .bearer_auth(token)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if resp.status().is_success() {
        resp.json::<AuthUser>()
            .await
            .map_err(|e| format!("Parse error: {}", e))
    } else {
        Err(format!("Status: {}", resp.status()))
    }
}

pub async fn create_checkout_session(item: &str) -> Result<CheckoutResponse, String> {
    let client = reqwest::Client::new();
    let resp = client
        .post(format!("{}/api/checkout", API_BASE))
        .json(&serde_json::json!({ "item": item }))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if resp.status().is_success() {
        resp.json::<CheckoutResponse>()
            .await
            .map_err(|e| format!("Parse error: {}", e))
    } else {
        Err(format!("Status: {}", resp.status()))
    }
}

#[allow(dead_code)]
pub async fn load_projects(token: &str) -> Result<Vec<Project>, String> {
    let client = reqwest::Client::new();
    let resp = client
        .get(format!("{}/api/projects", API_BASE))
        .bearer_auth(token)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if resp.status().is_success() {
        resp.json::<Vec<Project>>()
            .await
            .map_err(|e| format!("Parse error: {}", e))
    } else {
        Err(format!("Status: {}", resp.status()))
    }
}

#[allow(dead_code)]
pub async fn save_project(token: &str, name: &str, data: &serde_json::Value) -> Result<Project, String> {
    let client = reqwest::Client::new();
    let resp = client
        .post(format!("{}/api/projects", API_BASE))
        .bearer_auth(token)
        .json(&serde_json::json!({ "name": name, "data": data }))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if resp.status().is_success() {
        resp.json::<Project>()
            .await
            .map_err(|e| format!("Parse error: {}", e))
    } else {
        Err(format!("Status: {}", resp.status()))
    }
}

pub async fn fetch_pending_shoutouts(token: &str) -> Result<Vec<Shoutout>, String> {
    let client = reqwest::Client::new();
    let resp = client
        .get(format!("{}/api/shoutout/pending", API_BASE))
        .bearer_auth(token)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if resp.status().is_success() {
        resp.json::<Vec<Shoutout>>()
            .await
            .map_err(|e| format!("Parse error: {}", e))
    } else {
        Err(format!("Status: {}", resp.status()))
    }
}

pub async fn approve_shoutout(token: &str, id: i64, status: &str) -> Result<(), String> {
    let client = reqwest::Client::new();
    let resp = client
        .put(format!("{}/api/shoutout/{}/approve", API_BASE, id))
        .bearer_auth(token)
        .json(&serde_json::json!({ "status": status }))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if resp.status().is_success() {
        Ok(())
    } else {
        Err(format!("Status: {}", resp.status()))
    }
}

pub async fn fetch_approved_shoutouts(
    club_id: i64,
    since: &str,
) -> Result<Vec<Shoutout>, String> {
    let client = reqwest::Client::new();
    let resp = client
        .get(format!(
            "{}/api/shoutout/approved?club_id={}&since={}",
            API_BASE, club_id, since
        ))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if resp.status().is_success() {
        resp.json::<Vec<Shoutout>>()
            .await
            .map_err(|e| format!("Parse error: {}", e))
    } else {
        Err(format!("Status: {}", resp.status()))
    }
}

pub async fn submit_shoutout(
    club_id: i64,
    name: &str,
    message: &str,
) -> Result<(), String> {
    let client = reqwest::Client::new();
    let resp = client
        .post(format!("{}/api/shoutout", API_BASE))
        .json(&serde_json::json!({
            "club_id": club_id,
            "name": name,
            "message": message,
        }))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if resp.status().is_success() {
        Ok(())
    } else {
        Err(format!("Status: {}", resp.status()))
    }
}
