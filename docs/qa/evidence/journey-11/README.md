# Journey 11 Evidence - Magic Links

This directory contains evidence for Magic Link authentication testing.

## Expected Screenshots

1. **magic_link_request.png** - Request magic link form
2. **magic_link_sent.png** - Confirmation message after request
3. **magic_link_email_log.png** - Backend logs showing magic link URL
4. **magic_link_verify.png** - Verification page
5. **magic_link_success.png** - Successful login
6. **magic_link_expired.png** - Expired token error

## Test Scenarios

- Request magic link for registered email
- Check backend logs for magic link URL
- Copy token from logs
- Navigate to verification URL
- Verify successful login
- Test expired token (after 15 minutes)
