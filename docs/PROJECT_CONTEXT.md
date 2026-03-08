# DAB AI Platform – Project Context

## Overview

DAB AI is an autonomous marketing operations platform.

The system allows businesses, agencies, and freelancers to manage marketing campaigns, capture leads, automate communication, and optimize advertising performance through an AI agent.

The platform operates as a marketing control center where the user interacts with an AI assistant that can perform marketing tasks.

---

# Core Capabilities

The platform supports the following major capabilities:

1. AI Chat Agent  
Users interact with the system using natural language commands.

Example:

Create campaign for real estate leads with $300 budget.

The AI agent interprets commands and triggers system actions.

---

2. Campaign Management

Users can create and manage advertising campaigns.

Each campaign includes:

name  
platform  
budget  
target audience  
generated ad content  
performance metrics  

Campaigns collect leads from advertising platforms.

---

3. Lead Management

The system stores and manages leads captured from campaigns.

Lead information includes:

name  
email  
company  
campaign source  
lead score  
conversation history  

Leads move through a pipeline:

New Lead  
Qualified Lead  
Meeting Scheduled  
Closed Deal

---

4. Automation Engine

Automation rules allow the system to perform actions automatically.

Example rule:

Trigger: new lead created  
Condition: lead score > 70  
Action: send follow-up message

Automation actions include:

sending messages  
scheduling meetings  
adjusting campaign budgets  
updating lead status  

---

5. Financial Analytics

The system tracks marketing spend and revenue.

Metrics include:

total ad spend  
revenue generated  
cost per lead  
conversion rate  
return on ad spend (ROAS)

These metrics are displayed on the dashboard.

---

6. AI Optimization

The AI agent analyzes campaign performance and provides optimization recommendations.

Examples:

Increase campaign budget when conversion rate is high.

Pause campaign when cost per lead exceeds threshold.

The system logs all AI decisions.

---

7. Integration Layer

The platform integrates with external services such as:

advertising platforms  
messaging platforms  
calendar scheduling systems  

These integrations allow the AI agent to interact with real marketing tools.

---

# Frontend Architecture

Frontend is built using:

Next.js  
React  
TypeScript  
TailwindCSS  

Main UI areas:

Dashboard  
Chat Agent  
Leads  
Campaigns  
Automation  
Finance  
Integrations  
Command Center  
Reports  
Settings  

The dashboard displays system performance metrics and AI activity.

---

# Backend Architecture

Backend services are built using:

Node.js  
Express  
Supabase database  

Key backend components:

API controllers  
automation engine  
agent orchestrator  
integration services  
task scheduler  

---

# Database Structure

Core tables include:

users  
leads  
campaigns  
campaign_stats  
automation_rules  
automation_history  
agent_activity  
finance  
integrations  

---

# Agent Orchestration

The AI agent acts as the system coordinator.

Responsibilities:

interpret user commands  
trigger backend services  
execute automation workflows  
analyze campaign performance  
generate insights  

---

# Development Guidelines

Follow these principles:

use modular architecture  
separate services by responsibility  
create reusable UI components  
document API endpoints  
log all automation actions  

All generated code must remain consistent with this architecture.

---

# Goal of the Platform

DAB AI should function as a centralized marketing control system where users can:

monitor campaigns  
manage leads  
automate communication  
analyze financial performance  
allow AI to optimize marketing operations
