# How to Create an Admin User

There are two simple ways to promote a user to admin:

## Method 1: Using the Script (Recommended)

1. Make sure you have a user account registered in the system
2. Run the script from the project root:

```bash
node scripts/makeAdmin.js <username>
```

**Example:**
```bash
node scripts/makeAdmin.js john
```

This will promote the user "john" to admin role.

## Method 2: Direct MongoDB Update

If you have MongoDB access, you can directly update the user:

1. Connect to your MongoDB database
2. Find your database (usually `minigames`)
3. Run this command in MongoDB shell or Compass:

```javascript
db.users.updateOne(
  { username: "yourusername" },
  { $set: { role: "admin" } }
)
```

Replace `"yourusername"` with the actual username you want to promote.

## Verify Admin Status

After promoting a user:
1. Log out and log back in (to refresh the JWT token)
2. Navigate to `/admin/reports` - you should be able to access it
3. Or check your role via the API: `GET /api/profile` (should return `"role": "admin"`)

## Notes

- The JWT token contains the role, so you need to **log out and log back in** after promoting a user for the change to take effect
- Only users with `role: "admin"` can access `/admin/reports` and `GET /api/reports`

