# Reverb

## Development Database Setup

1. Start PostgreSQL service (if not running):

```bash
brew services start postgresql@14
```

2. Create the development database:

```bash
createdb reverb
```

3. Grant necessary permissions to postgres user:

```bash
psql -U postgres -c "ALTER USER postgres WITH CREATEROLE;"
psql -h localhost -U postgres -d reverb -c "GRANT USAGE, CREATE ON SCHEMA public TO postgres;"
```

4. Create application database user:

```bash
psql -U postgres -c "CREATE USER reverb_admin_user WITH ENCRYPTED PASSWORD 'reverb_admin_password';"
```

5. Grant privileges to the application user:

```bash
psql -U postgres -d reverb -c "GRANT ALL PRIVILEGES ON DATABASE reverb TO reverb_admin_user;"
psql -U postgres -d reverb -c "GRANT ALL PRIVILEGES ON SCHEMA public TO reverb_admin_user;"
```

6. Run migrations:

```bash
node ace migration:fresh
```

### Notes

- These commands assume PostgreSQL is installed via Homebrew
- If you get "role postgres does not exist" error, you may need to create it first:
  ```bash
  createuser -s postgres
  ```
- To ensure PostgreSQL starts on system boot:
  ```bash
  brew services restart postgresql@14
  ```

### Troubleshooting

- If you get connection refused errors, make sure PostgreSQL is running
- If you get authentication errors, verify your `.env` file has the correct credentials:
  ```
  DB_CONNECTION=pg
  DB_HOST=localhost
  DB_PORT=5432
  DB_USER=reverb_admin_user
  DB_PASSWORD=reverb_admin_password
  DB_DATABASE=reverb
  ```

# Running the app for local development

```bash
node ace serve --hmr
```
