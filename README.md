## Running the project

### 1. Create a `.env` file

In the project root (next to `docker-compose.yml`):

```env
SA_PASSWORD=YourStrongP@ssw0rd1
JWT_KEY=SuperSecretKeyThatIsAtLeast32BytesLong!123
ASPNETCORE_ENVIRONMENT=Development
JWT_ISSUER=SuperDuperDODO
JWT_AUDIENCE=SuperDuperDODO
RESEND_API_KEY=
RESEND_DEFAULT_FROM=
```

| Variable | Description |
|---|---|
| `SA_PASSWORD` | SQL Server admin password. Minimum 8 characters, at least 3 of 4 categories (uppercase, lowercase, digits, special characters) |
| `JWT_KEY` | Secret key for signing JWT tokens. Minimum 32 bytes |
| `ASPNETCORE_ENVIRONMENT` | `Development` or `Production`. Defaults to `Development` |
| `JWT_ISSUER` / `JWT_AUDIENCE` | Token issuer and audience |
| `RESEND_API_KEY` | API key for [Resend](https://resend.com/), used to send email verification codes. **Only used in `Production`** |
| `RESEND_DEFAULT_FROM` | Sender email address registered in Resend. **Only used in `Production`** |

### 2. Start

```bash
docker compose up -d --build
```

The app will be available at:

```
http://localhost:8080
```

### Useful commands

Stop everything:
```bash
docker compose down
```

Stop and remove data (database and Redis cache will be wiped):
```bash
docker compose down -v
```

Rebuild after code changes:
```bash
docker compose up -d --build web
```

Full rebuild without cache:
```bash
docker compose build --no-cache web
docker compose up -d web
```
