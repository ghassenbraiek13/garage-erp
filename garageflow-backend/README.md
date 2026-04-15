# GarageFlow Backend

## Prerequisites
- Node.js 20 LTS
- MongoDB 7 (local or Atlas)
- npm 10+

## Setup
1. `cd garageflow-backend`
2. `npm install`
3. `cp .env.example .env` and fill values
4. `npm run seed` — seeds database with all data + prints credentials
5. `npm run dev` — starts dev server on port 5000

## First Login Credentials
| Role        | Email                        | Password         |
|-------------|------------------------------|------------------|
| Super Admin | superadmin@garageflow.app    | SuperAdmin@2024! |
| Manager     | manager@garageflow.app       | Manager@2024!    |
| Mechanic    | mechanic1@garageflow.app     | Mechanic@2024!   |
| Cashier     | cashier@garageflow.app       | Cashier@2024!    |
| Client      | client@garageflow.app        | Client@2024!     |

## API Documentation
Base URL: `http://localhost:5000/api/v1`
Health: `http://localhost:5000/health`
All protected routes require: `Authorization: Bearer <accessToken>`

## Project Structure
See /src directory — MVC architecture with services layer
Models → Controllers → Routes pattern
Middleware: auth + rbac + validate + upload + errorHandler
