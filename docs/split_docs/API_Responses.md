## API Response Codes

### Standard HTTP Status Codes

#### Success Codes

- `200 OK`: Successful GET, PUT, PATCH, DELETE
- `201 Created`: Successful POST creating resource
- `202 Accepted`: Accepted for async processing (federation)
- `204 No Content`: Successful DELETE with no response body

#### Client Error Codes

- `400 Bad Request`: Invalid request body or parameters
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: Authenticated but not authorized
- `404 Not Found`: Resource does not exist or user cannot access
- `409 Conflict`: Resource already exists (e.g., duplicate like)
- `429 Too Many Requests`: Rate limit exceeded

#### Server Error Codes

- `500 Internal Server Error`: Unhandled exception
- `502 Bad Gateway`: Federation remote server error
- `503 Service Unavailable`: Database or Redis unavailable

### Error Response Format

```json
{
  "error": "Human-readable error message",
  "detail": "Additional technical details (optional)",
  "code": "ERROR_CODE_CONSTANT (optional)"
}
```

### Success Response Patterns

**Single Resource**:

```json
{
  "id": "uuid",
  "field1": "value1",
  "field2": "value2"
}
```

**Resource List**:

```json
{
    "count": 100,
    "next": "https://api.example.com/resource/?page=2",
    "previous": null,
    "results": [
        {...},
        {...}
    ]
}
```

**Action Confirmation**:

```json
{
  "message": "Action completed successfully",
  "success": true,
  "resource_id": "uuid (optional)"
}
```

---

## Data Migration Strategy
