| Method | Path                          | Action                          |
|--------|-------------------------------|---------------------------------|
| POST   | `/api/users`                  | Create user                     |
| GET    | `/api/users`                  | List users                      |
| PUT    | `/api/users`                  | Update user by email            |
| DELETE | `/api/users`                  | Delete user by email            |
| PUT    | `/api/superuser/reset-password` | Force reset user password (superUser) |

/**
 * Route: POST /api/users
 * Purpose: Register a new user
 * Required fields: name, email, password
 * Optional fields: company, telnummer, clientID
 * Notes:
 *   - Password must be 8+ chars, include one uppercase and one number
 *   - Password is hashed using bcrypt
 * 
 * Example full curl call:
 * curl -u AdminHS:expressPassword -X POST http://localhost:7023/api/users \
 * -H "Content-Type: application/json" \
 * -d '{
 *   "name": "Max Muster",
 *   "email": "max@muster.ch",
 *   "password": "Test1234",
 *   "company": "Muster AG",
 *   "telnummer": "+41791234567",
 *   "clientID": "HS-001"
 * }'
 */




/**
 * Route: PUT /api/users
 * Purpose: Update user data by email
 * Required: email
 * Optional updates: { name, telnummer, clientID, company, password, etc }
 * Special:
 *   - If password is updated, oldPassword is required for verification
 *   - Password is hashed before saving
 *
 * Example payload:
 * {
 *   "email": "a@b.ch",
 *   "updates": {
 *     "name": "New Name",
 *     "password": "NewPass123",
 *     "oldPassword": "OldPass1"
 *   }
 * }
 *
 * Example curl:
 * curl -u AdminHS:expressPassword -X PUT http://localhost:7023/api/users \
 * -H "Content-Type: application/json" \
 * -d '{"email": "a@b.ch", "updates": { "name": "New Name", "password": "NewPass123", "oldPassword": "OldPass1" }}'
 */


/**
 * Route: DELETE /api/users
 * Purpose: Delete user by email
 * Required: { email }
 * 
 * Example payload:
 * {
 *   "email": "a@b.ch"
 * }
 * 
 * Example curl:
 * curl -u AdminHS:expressPassword -X DELETE http://localhost:7023/api/users \
 * -H "Content-Type: application/json" \
 * -d '{"email": "a@b.ch"}'
 */

 /////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Route: PUT /api/superuser/reset-password
 * Purpose: Force reset a user's password by superUser
 * Required in body:
 *   - email (user to update)
 *   - newPassword (new user password)
 *   - superUserEmail, superUserPassword (must match .env)
 *   - force: true
 * Env vars:
 *   - SUPERUSER_EMAIL
 *   - SUPERUSER_PASSWORD
 * Example curl:
 * curl -u AdminHS:SecurePassword \
 * -X PUT http://localhost:7023/api/superuser/reset-password \
 * -H "Content-Type: application/json" \
 * -d '{
 *        "email": "ramzi@tester.ch",
 *        "newPassword": "ResetPass123",
 *        "superUserEmail": "SUPERUSER_EMAIL",
 *        "superUserPassword": "SUPERUSER_PASSWORD",
 *        "force": true
 *      }'
 * 
 */