## Testing Considerations

### Required Test Coverage

#### Model Tests

- Field validation
- Method behavior
- Constraint enforcement
- Cascade deletions
- Default values

#### API Tests

- Authentication requirements
- Authorization rules
- Input validation
- Response serialization
- Error handling
- Rate limiting

#### Privacy Tests

- Location fuzzing accuracy
- Visibility rule enforcement
- Follow relationship checks
- Federation filtering

#### Federation Tests

- HTTP signature generation
- Signature verification
- Activity serialization
- Remote actor caching
- Inbox processing

### Test Database Requirements

- PostgreSQL with PostGIS extension
- Redis (can use fakeredis for unit tests)
- Celery eager mode (synchronous task execution)

---

## Deployment Checklist
