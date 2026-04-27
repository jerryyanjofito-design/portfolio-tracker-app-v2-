#!/usr/bin/env python3
"""
GitHub API Client for Repository Management
Uses existing GitHub token for authentication
"""

import requests
import json
import os

# GitHub token from environment
GITHUB_TOKEN = os.environ.get('GITHUB_TOKEN')
HEADERS = {
    'Authorization': f'token {GITHUB_TOKEN}',
    'Accept': 'application/vnd.github.v3+json'
}

class GitHubAPI:
    def __init__(self, owner, repo):
        self.owner = owner
        self.repo = repo
        self.base_url = f"https://api.github.com/repos/{owner}/{repo}"

    def get_issues(self, state='open'):
        """Get issues from repository"""
        url = f"{self.base_url}/issues?state={state}"
        response = requests.get(url, headers=HEADERS)
        return response.json()

    def create_issue(self, title, body='', labels=None):
        """Create a new issue"""
        url = f"{self.base_url}/issues"
        data = {
            'title': title,
            'body': body,
            'labels': labels or []
        }
        response = requests.post(url, headers=HEADERS, json=data)
        return response.json()

    def get_pulls(self, state='open'):
        """Get pull requests"""
        url = f"{self.base_url}/pulls?state={state}"
        response = requests.get(url, headers=HEADERS)
        return response.json()

    def create_pull(self, title, head, base, body=''):
        """Create a new pull request"""
        url = f"{self.base_url}/pulls"
        data = {
            'title': title,
            'head': head,
            'base': base,
            'body': body
        }
        response = requests.post(url, headers=HEADERS, json=data)
        return response.json()

    def get_file_content(self, path):
        """Get file content"""
        url = f"{self.base_url}/contents/{path}"
        response = requests.get(url, headers=HEADERS)
        return response.json()

    def update_file_content(self, path, content, message, sha=None):
        """Update file content"""
        url = f"{self.base_url}/contents/{path}"
        data = {
            'message': message,
            'content': content,
            'sha': sha
        }
        response = requests.put(url, headers=HEADERS, json=data)
        return response.json()

# Example usage
if __name__ == "__main__":
    # Replace with your repository details
    gh = GitHubAPI('owner', 'repo')

    # List issues
    issues = gh.get_issues()
    print(f"Found {len(issues)} issues")

    # Create issue
    # new_issue = gh.create_issue(
    #     title="Test Issue",
    #     body="This is a test issue created via API",
    #     labels=["bug", "test"]
    # )